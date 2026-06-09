# Module `field_inversion`

!!! info "Brief summary"
    `field_inversion` inverts for unknown fields (e.g. ice thickness) from surface
    observations (e.g. observed surface ice velocities) by iteratively minimising a
    cost function that penalises the misfit between model predictions and observations
    plus a regularization penalty on the control variables. Optionally, the iceflow
    network emulator can be fine-tuned between inversion iterations to keep it
    self-consistent with the updated geometry.

    The **parameters** of the module are described [here](#parameters).

!!! warning "Requires Keras 3 or newer"
    `field_inversion` requires Keras ≥ 3. The module checks the installed version at
    initialisation and raises a `RuntimeError` if an older version is detected.

{{ render_module_io("field_inversion") }}

## Overview

`field_inversion` uses gradient-based optimisation to recover one or more control variables (e.g. `thk`, `tau_ref`, `arrhenius`) from surface velocity observations. Each call to `update` performs the following sequence:

1. **DA phase** — minimise the total cost $J = J_\text{misfit} + J_\text{reg}$ with respect to the control variables using an L-BFGS optimiser with optional box constraints. Snapshots of the cost and the state fields are written to `optimize.nc` every `output.freq` accepted iterations.

2. **Retraining phases** (optional, repeated `optimization.retrain_iter` times) — after each DA phase, fine-tune the shared iceflow network emulator on the current glacier geometry, then run another DA phase. This alternation keeps the emulator consistent with the inverted fields as they evolve.

The cost function is assembled from terms listed in `objective`:

| Group | Term | Formula |
|-------|------|---------|
| Misfit | `gaussian` | $\frac{1}{2} \displaystyle\int_{\Omega} \frac{(\mathbf{u}_\text{obs} - \mathbf{u}_\text{model})^2}{\sigma^2} \, \frac{dA}{|\Omega|}$ |
| Regularization | `squared_laplacian` | $\frac{\lambda}{2} \displaystyle\int_{\Omega} (\nabla^2 \theta)^2 \, \frac{dA}{|\Omega|}$ |
| Regularization | `l2` | $\frac{\lambda}{2} \displaystyle\int_{\Omega} (\theta - \theta_\text{ref})^2 \, \frac{dA}{|\Omega|}$ |

Integrals are evaluated as discrete sums over grid cells inside the relevant mask. NaN observation values are automatically excluded from misfit integrals.

The default configuration inverts for `thk` using a surface-velocity Gaussian misfit against `uvelsurfobs`/`vvelsurfobs` and a squared-Laplacian regularization on `thk`.

**Initial field construction** — when `thk` is listed as a control variable, the module initialises it from a blend of an SIA-based thickness estimate (reliable where speeds are high) and a distance-from-margin estimate (reliable near the margin), blended smoothly by surface speed magnitude.

### Retraining losses

When `optimization.retrain_iter > 0`, each retraining phase fine-tunes the emulator by minimising a weighted combination of:

- **Local physics loss** — energy-functional residual on the current glacier inputs.
- **Anchor loss** (`retrain_anchor_weight`) — L2 distance between the current network weights and a snapshot of the pretrained weights, preventing large drift.
- **Replay data loss** (`retrain_replay_data_weight`) — supervised loss against a TFRecord dataset of reference velocity examples (requires `replay_data_dir`).
- **Replay physics loss** (`retrain_replay_phys_weight`) — physics residual evaluated on the replay samples.

Loss scales for the local and replay terms are normalised at the start of each retraining phase to prevent any single term from dominating.

## Module ordering

`field_inversion` must appear in the `assimilations` list. It initialises the `iceflow` forward model internally at startup (before the normal processes pass), so `iceflow` must also be present in `processes`.

```yaml
defaults:
  - override /assimilations:
    - field_inversion
  - override /processes:
    - iceflow
```

## Inputs

The module reads the following state fields at each call (they must have been initialised by other modules or loaded from file before `field_inversion.update` is called):

| Field | Description |
|-------|-------------|
| `usurf` | Surface elevation (m) |
| `thk` | Ice thickness (m) — also a control variable in the default config |
| `icemask` | Ice extent mask (1 = ice, 0 = no ice) |
| `uvelsurfobs` | Observed surface velocity, x-component (m yr⁻¹) |
| `vvelsurfobs` | Observed surface velocity, y-component (m yr⁻¹) |

Additional control variables (e.g. `tau_ref`, `arrhenius`) may be declared in `variables`; they are initialised from the relevant `iceflow` physics defaults.

## Output

At each write (iteration 0, then every `output.freq` accepted optimiser iterations), the module writes a NetCDF file `optimize.nc` containing:

- The 2D fields listed in `output.vars_to_save`. The computed quantities `velbase_mag`, `velsurf_mag`, `velsurfobs_mag`, and `sliding_ratio` are derived automatically when requested.
- Cost-function diagnostics: total cost, data misfit, regularization cost, and the full per-iteration cost history up to that snapshot.
- The current `retrain_iter_num` counter.

## Example usage

### Minimal inversion for ice thickness

```yaml
defaults:
  - override /assimilations:
    - field_inversion
  - override /processes:
    - iceflow

assimilations:
  field_inversion:
    optimization:
      nbitmax: 1000
      minimizer_patience: 20
    output:
      freq: 200
      vars_to_save: [usurf, thk, icemask, velsurf_mag, velsurfobs_mag]
    variables:
      - { name: thk, transform: identity, lower_bound: 0.0, upper_bound: 1000.0, mask: icemask }
    objective:
      misfit:
        - { name: velsurf, kind: gaussian, components: [uvelsurf, vvelsurf],
            obs: [uvelsurfobs, vvelsurfobs], std: 1.0 }
      regularization:
        - { name: thk, penalty: squared_laplacian, lam: 100000.0 }
```

### Inversion with emulator retraining

```yaml
assimilations:
  field_inversion:
    optimization:
      nbitmax: 1000
      minimizer_patience: 20
      retrain_iter: 5
      retrain_lr: 1.0e-5
      retrain_steps: 500
      retrain_anchor_weight: 0.01
    variables:
      - { name: thk, transform: identity, lower_bound: 0.0, upper_bound: 1000.0, mask: icemask }
    objective:
      misfit:
        - { name: velsurf, kind: gaussian, components: [uvelsurf, vvelsurf],
            obs: [uvelsurfobs, vvelsurfobs], std: 1.0 }
      regularization:
        - { name: thk, penalty: squared_laplacian, lam: 100000.0 }
```

<!-- REVIEW CHECKLIST — sections a complete tooling/assimilation module page usually has,
     not generated because the source did not ground them:
     - Coupling with iceflow: describe more precisely how the DA mapping shares the network
       instance with state.iceflow.mapping and what contract that implies for run order.
     - Penalty names: the default conf uses `penalty: biharmonic` but PenaltyRegistry
       registers `squared_laplacian` and `l2`; clarify whether `biharmonic` is an alias
       or whether the conf default should be updated to `squared_laplacian`.
     - Convergence guidance: practical advice on choosing lam, std, and minimizer_patience
       for typical inversions.
     - Replay data format: the replay TFRecord layout mirrors the pretraining dataset —
       confirm and cross-reference, or add a brief description here.
     Fill these in or delete this block. -->

## Parameters

The complete default configuration file can be found here: [field_inversion.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/assimilations/field_inversion.yaml).

{% set config = load_yaml('../igm/conf/assimilations/field_inversion.yaml') %}
{% set help = load_yaml('../igm/conf_help/assimilations/field_inversion.yaml') %}
{% set header = load_yaml('../igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_tree.j2" %}

{{ render_contributors("field_inversion") }}
