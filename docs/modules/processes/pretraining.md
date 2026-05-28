# Module `pretraining`

This IGM module trains a neural network emulator for the iceflow solver **offline**, before running a full glacier simulation. Given a precomputed dataset of input–velocity pairs, it optimises the emulator weights using a combination of a data loss (matching reference velocities) and a physics loss (based on the ice-flow energy functional), then writes the trained model to disk ready to be loaded by the `iceflow` module.

!!! warning "New emulator generation"
    This module trains the **new generation** of IGM emulators introduced in IGM 3.2, which use a different architecture and training pipeline from the emulators shipped with earlier versions. Older pre-trained emulators remain fully supported for **inference** (forward runs) and can still be loaded, just ensure that  `cfg.processes.iceflow.unified.network.pretrained_path` is empty and IGM will fallback to trying to load a previous-generation emulator. However, they cannot be retrained or fine-tuned with this updated module.

!!! note
    the `pretraining` module is intended for training new ice-flow emulators, if you want to use these new-generation emulators for inference, just set `cfg.processes.iceflow.unified.network.pretrained_path` to point to an existing emulator file and `cfg.processes.iceflow.unified.network.pretrained` to `true`.

## Overview

The emulator learns to map input fields (e.g. ice thickness, surface elevation, sliding coefficient) to the horizontal velocity fields $U$ and $V$. Training adjusts network weights to minimize the sum of two loss functions:

- **Data loss** — penalises the difference between predicted and reference velocities from a physics-based solver. Either mean-squared error (MSE) or a Huber loss can be used; Huber is recommended for glacier datasets which may contain large velocity outliers near the margins.
- **Physics loss** — penalises departure from the ice-flow energy functional. This acts as a regulariser and can improve generalisation to conditions not present in the training data.

The relative weight of the physics loss, $\lambda$, is adapted automatically during training: after an initial **warmup phase** (data-only), the trainer compares the gradient magnitudes of both losses and adjusts $\lambda$ so that neither term dominates. An EMA filter and per-step multiplicative clamp prevent large oscillations.

## Module ordering

The `pretraining` module must be listed alongside `iceflow` in the `processes` list. The `iceflow` module provides the network architecture, numerical discretisation ($N_z$, precision), and physics configuration that the trainer uses. When `pretraining` is present, `iceflow` skips its normal initialisation of glacier fields.

```yaml
defaults:
  - override /processes:
    - iceflow
    - pretraining
```

## Training data

Training data must be provided as **TFRecord files** organised in the following directory layout:

```
<data_dir>/
  metadata.json
  train/
    nz<Nz>/
      shard_000.tfrecord
      shard_001.tfrecord
      ...
  val/
    nz<Nz>/
      shard_000.tfrecord
      ...
```

where `<Nz>` matches `cfg.processes.iceflow.numerics.Nz`. The number and order of input channels encoded in the TFRecords must match `cfg.processes.iceflow.unified.inputs` exactly. The module validates this at startup and raises a descriptive error if there is a mismatch.

!!! info "Public dataset"
    A glacier catalogue in the required TFRecord format will be made publicly available following the publication of the paper describing this training pipeline.

## Output

After training, the module writes a self-contained **emulator artifact** to:

```
<out_dir>/<experiment_name>/
```

This directory contains the Keras model file and input normaliser state. The `iceflow` module can load it directly by pointing `cfg.processes.iceflow.unified.network.pretrained_path` at this path.

When `save_model: true` (the default), training **checkpoints** are also written to `<out_dir>/<experiment_name>/checkpoints/` so that interrupted runs can be resumed (see `resume`).

When `make_plots: true`, a loss-curve figure (`loss_curve.png`) and per-epoch speed-comparison images are written to `<out_dir>/<experiment_name>/figures/`.

## Parameters

Default configuration file ([pretraining.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/pretraining.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/pretraining.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/pretraining.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/pretraining.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}

## Example usage

### Basic training run

```yaml
defaults:
  - override /processes:
    - iceflow
    - pretraining

processes:
  iceflow:
    method: unified
    numerics:
      Nz: 10
      precision: single
    unified:
      inputs: [thk, usurf, slidingco]
      mapping: network
      network:
        pretrained: false
        architecture: CNN

  pretraining:
    data_dir: /data/glacier_catalog/tfrecords/
    out_dir: /experiments/
    experiment_name: cnn_nz10_v1
    batch_size: 8
    micro_batch_size: 8
    epochs: 1000
    steps_per_epoch: 1000
    val_steps: 50
    learning_rate: 0.0001
    loss_type: huber
    huber_delta: 50.0
    warmup_steps: 100000
    save_model: true
    make_plots: true
```

### Resuming an interrupted training run

Set `resume: true` to pick up from the last saved checkpoint. All other parameters (epochs, learning rate, etc.) should remain unchanged.

```yaml
  pretraining:
    data_dir: /data/glacier_catalog/tfrecords/
    out_dir: /experiments/
    experiment_name: cnn_nz10_v1
    # ... same hyperparameters as original run ...
    resume: true
    save_model: true
```

### Hyperparameter search (no model saving)

When running many trials, set `save_model: false` to skip writing checkpoints and model artifacts. A `state.score` value (mean validation loss over the last 5 epochs) is still available for the search framework.

```yaml
  pretraining:
    data_dir: /data/glacier_catalog/tfrecords/
    out_dir: /experiments/sweeps/
    experiment_name: trial_42
    batch_size: 16
    micro_batch_size: 4
    epochs: 50
    steps_per_epoch: 500
    val_steps: 20
    learning_rate: 0.0003
    loss_type: mse
    warmup_steps: 10000
    save_model: false
    make_plots: false
```

### Memory-constrained GPU (gradient accumulation)

If a full batch does not fit in GPU memory, reduce `micro_batch_size`. The effective gradient update is equivalent to training with `batch_size` examples; only the peak GPU memory footprint changes.

```yaml
  pretraining:
    batch_size: 16
    micro_batch_size: 2
```

{{ render_contributors("pretraining") }}
