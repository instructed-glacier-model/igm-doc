# Using IGM with Hydra + Optuna + GPU Cluster Distribution

This guide explains how to use **IGM** with the **Hydra Optuna Sweeper** to optimize parameters across a GPU-based cluster, storing all trials centrally in a **single Optuna study** and supporting visualization via the [Optuna Dashboard](https://optuna.github.io/optuna-dashboard/).

---

## Requirements

Install the necessary Hydra plugins:

```bash
pip install hydra-optuna-sweeper
pip install hydra-joblib-launcher
```

These enable Optuna optimization and distributed job launching across your cluster.

---

## Optimization Logic (User Module)

To optimize a model, you must define a floating-point variable in your Python module:

```python
state.score = <your computed float metric>
```

Hydra will read this value and log it as the trial result.

Only **single-objective optimization** is currently supported.

---

## 📁 Directory Layout

All runs are stored under:

```
multirun/trial_<trial_id>/
```

This keeps all trials together — even when run from different GPUs or nodes.

An SQLite database stores the Optuna study:

```
optuna.db
```

You can visualize the study with:

```bash
optuna-dashboard optuna.db
```

---

## ⚙️ Parameter Sweep Config (`params_sweep.yaml`)

```yaml
# @package _global_

hydra:
  sweep:
    dir: multirun
    subdir: trial_${optuna_trial_number}
  sweeper:
    _target_: hydra_plugins.hydra_optuna_sweeper.optuna_sweeper.OptunaSweeper
    custom_search_space: igm.utils.optuna_hooks.configure
    study_name: myglacier
    storage: sqlite:///optuna.db
    direction: minimize
    n_trials: 25
    n_jobs: 1
    sampler:
      _target_: optuna.samplers.TPESampler
    params:
      processes.data_assimilation.regularization.thk: tag(log, interval(1.0e3, 1.0e4))
      processes.data_assimilation.regularization.slidingco: tag(log, interval(1.0e9, 1.0e10))
      processes.iceflow.physics.init_slidingco: interval(0.025, 0.045)

core:
  url_data: ''
  check_compat_params: False
  hardware:
    visible_gpus:
      - ${core.hardware.gpu_id}
    gpu_id: 0
```

---

## Launch Script (`run.sh`)

```bash
#!/bin/bash
  
igm_run -m +experiment=params_sweep \
  hydra/launcher=joblib hydra/sweeper=optuna \
  hydra.sweeper.n_trials=$2  
  core.hardware.gpu_id=$1
```

---

## Cluster Submission Script (on Octopus)

This script launches jobs on different nodes and GPUs using `tmux` and `ssh`.

```bash
#!/bin/bash

NB=20 

for GPU in 0 1 2 3; do
  for A in 01 02 03; do
    SESSION="node${A}_GPU${GPU}"
    echo "Starting tmux session $SESSION on node$A"
    ssh node$A "tmux new-session -d -s $SESSION 'cd $T && ./run.sh $GPU $NB'"
    sleep 15
  done
done
```

This ensures:
- Each GPU runs `NB` trials
- All trials contribute to the same Optuna database
- Easy monitoring via `tmux attach -t <session_name>` per node

---

## 📊 Dashboard

To visualize the optimization progress and find the `trial_000123` name for any run:

```bash
optuna-dashboard optuna.db
```

If you don't want (or have issues) to install locally, you may use the [Optuna Dashboard](https://optuna.github.io/optuna-dashboard/), just drop you `optuna.db` file in th browser.

The dashboard shows:
- Best parameters
- Objective value per trial
- Parameter importance
- Parallel coordinate plots
- ID of the run to retrieve where outputs are stored

---

## ⚠️ Notes

- **Multi-objective optimization is NOT supported** with the current `TPESampler`. Only `direction: minimize` or `maximize` (single-objective) works.
- `optuna_trial_number` in the `hydra.sweep.subdir` ensures each trial has a unique, identifiable folder like `trial_000001`, `trial_000002`, etc.
- **Parallelization** is achieved using `hydra/launcher=joblib` and dispatching jobs manually via SSH+tmux.


---

## Example Folder Structure (After Run)

```
multirun/
├── trial_0/
│   └── .hydra/
│   └── log.txt
│   └── result.json
├── trial_1/
│   └── ...
optuna.db
```

 