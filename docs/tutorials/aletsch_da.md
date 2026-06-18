# Aletsch: parameter calibration with Optuna

A glacier model is only as good as its parameters. For the Aletsch temperature-index setup, the key unknowns are the accumulation and ablation scale factors (`weight_accumulation`, `weight_ablation`) and the basal sliding coefficient (`init_slidingco`). Choosing them by hand is tedious; letting an optimiser search automatically is faster and more rigorous.

This tutorial uses **Optuna** — a hyperparameter optimisation library — to find the parameter values that minimise the mismatch between the modelled glacier surface and 7 historical observed DEMs (1880–2017). A second part extends this to a two-objective problem that simultaneously fits observed surface velocities.

---

## Setup

Clone the examples repository:

```bash
git clone https://github.com/instructed-glacier-model/igm-examples.git
cd igm-examples/aletsch
```

Input data (including the observed DEMs in `past_surf.nc` and the InSAR velocity field) is downloaded automatically on first run. Optuna is included with IGM; no extra installation is required.

---

## How the calibration works

Two custom modules turn the forward simulation into a calibration objective:

- **`track_usurf_obs`** — at each time step, compares the modelled surface elevation against the nearest observed DEM. At the end of the run it writes the **mean standard deviation across all 7 observation years** into `state.score` as `cost_usurf`. This is the quantity Optuna minimises.
- **`track_velsurf_obs`** — at the final time step, computes the **RMSE between modelled and InSAR surface speeds** at pixels where observations are available. This is written as `cost_velsurf` (used in Part 2 only).

Optuna calls `igm_run` repeatedly, proposing new parameter values each trial based on the results of previous ones, and records all trials in an SQLite database.

---

## Part 1: Single-objective calibration

### What is optimised

| Parameter | Meaning | Search range |
|---|---|---|
| `smb_accmelt.weight_accumulation` | Scale factor on raw accumulation | 0.5 – 2.0 |
| `smb_accmelt.weight_ablation` | Scale factor on raw melt | 0.5 – 2.0 |

**Objective:** minimise `cost_usurf` (mean STD between modelled surface and 7 observed DEMs).

### Run configuration

```yaml
# experiment/params_1obj.yaml

defaults:
  - /user/conf/processes@processes:
      - smb_accmelt
      - clim_aletsch
      - track_usurf_obs

  - override /inputs:
    - local
  - override /processes:
    - track_usurf_obs
    - clim_aletsch
    - smb_accmelt
    - iceflow
    - time
    - thk

inputs:
  local:
    filename: input.nc

processes:
  smb_accmelt:
    weight_accumulation: 1.062   # starting point; Optuna overrides this
    weight_ablation:     1.304
  iceflow:
    physics:
      init_slidingco: 0.0595
  time:
    start: 1880.0
    end:   2020.0
    save:  10.0
```

### Optuna sweep configuration

```yaml
# optuna_1obj.yaml

objectives:
  - name: cost_usurf
    direction: minimize

n_trials: 50
n_jobs:   4            # trials run in parallel
storage:  sqlite:///optuna.db
study_name: aletsch

sampler:
  method: TPESampler   # Tree-structured Parzen Estimator

parameters:
  - name: processes.smb_accmelt.weight_accumulation
    type: float
    low:  0.5
    high: 2.0

  - name: processes.smb_accmelt.weight_ablation
    type: float
    low:  0.5
    high: 2.0
```

The **TPE sampler** builds a probabilistic model of the objective function from completed trials and proposes new candidates in promising regions — far more efficient than random search.

### Run

Single forward run to verify the setup:

```bash
igm_run +experiment=params_1obj
```

Full optimisation (50 trials, 4 in parallel):

```bash
igm_run -m +experiment=params_1obj \
    hydra/sweeper=igm_optuna \
    hydra.sweeper.optuna_config=optuna_1obj.yaml
```

Results are stored in `multiruns/`, one subfolder per trial. The study is persisted in `optuna.db` so you can resume or inspect it at any time.

### Inspect results

```bash
pip install optuna-dashboard
optuna-dashboard sqlite:///optuna.db
```

This opens a web dashboard with trial histories, parameter importances, and convergence plots.

**Best parameters found:**

The optimisation converges to `cost_usurf ≈ 30.6 m` (mean STD across all 7 DEMs), with:

- `weight_accumulation = 1.062`
- `weight_ablation = 1.304`

---

## Part 2: Multi-objective calibration

Part 2 simultaneously optimises **two objectives**:

1. **`cost_usurf`** — surface elevation misfit (same as Part 1)
2. **`cost_velsurf`** — RMSE between modelled and InSAR surface speeds at 2020

A third free parameter is added:

| Parameter | Meaning | Search range |
|---|---|---|
| `iceflow.physics.init_slidingco` | Basal sliding coefficient (MPa) | 0.08 – 0.50 |

Adding `init_slidingco` to the search space is physically motivated: basal sliding is the dominant control on surface speed, so fitting velocities well requires tuning it alongside the SMB weights.

### Run configuration

```yaml
# experiment/params_2obj.yaml

defaults:
  - /user/conf/processes@processes:
      - smb_accmelt
      - clim_aletsch
      - track_usurf_obs
      - track_velsurf_obs

  - override /processes:
    - track_usurf_obs
    - track_velsurf_obs
    - clim_aletsch
    - smb_accmelt
    - iceflow
    - time
    - thk

processes:
  smb_accmelt:
    weight_accumulation: 1.062
    weight_ablation:     1.304
  iceflow:
    physics:
      init_slidingco: 0.15   # starting point; Optuna overrides this
  time:
    start: 1880.0
    end:   2020.0
    save:  10.0
```

### Optuna sweep configuration

```yaml
# optuna_2obj.yaml

objectives:
  - name: cost_usurf
    direction: minimize
  - name: cost_velsurf
    direction: minimize

n_trials: 200
n_jobs:   4
storage:  sqlite:///optuna_2obj.db
study_name: aletsch_2obj

sampler:
  method: NSGAIISampler   # genetic algorithm for Pareto-front exploration

parameters:
  - name: processes.smb_accmelt.weight_accumulation
    type: float
    low:  0.5
    high: 2.0

  - name: processes.smb_accmelt.weight_ablation
    type: float
    low:  0.5
    high: 2.0

  - name: processes.iceflow.physics.init_slidingco
    type: float
    low:  0.08
    high: 0.50
```

**NSGA-II** is a genetic algorithm that evolves a population of solutions toward the Pareto front — the set of trials where improving one objective necessarily worsens the other. It is well suited to multi-objective problems where no single best solution exists.

### Run

Single forward run:

```bash
igm_run +experiment=params_2obj
```

Full multi-objective optimisation (200 trials, 4 in parallel):

```bash
igm_run -m +experiment=params_2obj \
    hydra/sweeper=igm_optuna \
    hydra.sweeper.optuna_config=optuna_2obj.yaml
```

---

## Analyse and visualise results

### Pareto front

```bash
optuna-dashboard sqlite:///optuna_2obj.db
```

The dashboard shows the Pareto front interactively. Alternatively, use Python directly:

```python
import optuna

study = optuna.load_study(
    study_name="aletsch_2obj",
    storage="sqlite:///optuna_2obj.db",
)

pareto = optuna.visualization.plot_pareto_front(study)
pareto.show()
```

The Pareto front reveals the trade-off: trials that fit the surface elevation very well tend to fit velocities less well, and vice versa. Choosing a point on the front is a modelling decision — it depends on which observation you trust more or which quantity matters for your application.

### High-resolution replay

To re-run a chosen Pareto-optimal trial at annual output resolution, override `time.save` on the command line:

```bash
igm_run +experiment=params_2obj \
  processes.smb_accmelt.weight_accumulation=1.08 \
  processes.smb_accmelt.weight_ablation=1.31 \
  processes.iceflow.physics.init_slidingco=0.07 \
  processes.time.save=1.0
```

---

## Next steps

- Use the calibrated parameters as input to the particle tracking tutorial: [Particle tracking](aletsch_particles.md)
- Scale the optimisation to a cluster: [Optimization with Optuna](../hydra/optuna_cluster.md)
- Explore parameter sensitivity manually: [Ensemble run with Hydra](aletsch_ensemble.md)
