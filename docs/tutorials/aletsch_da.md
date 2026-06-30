# Aletsch: parameter calibration with Optuna

A glacier model is only as good as its parameters. For the realistic Aletsch setup of [forward modelling, Step 3](aletsch.md#step-3-realistic-climate-and-accumulationmelt-smb), the key unknowns are the accumulation and ablation scale factors (`weight_accumulation`, `weight_ablation`) and the basal friction (`tau_ref`). Choosing them by hand is tedious; letting an optimiser search automatically is faster and more rigorous.

This is **Part B** of the Aletsch example — data assimilation by **hyperparameter tuning**. Rather than inverting a spatial field, it treats a few **scalar parameters** as unknowns and uses **Optuna** to search the values that best reproduce observations. The forward model is the realistic climate/SMB pipeline of Part A (`clim_aletsch` + `smb_accmelt` + observation tracking), run from 1880 to 2020.

---

## Setup

```bash
git clone https://github.com/instructed-glacier-model/igm-examples.git
cd igm-examples/aletsch
```

Input data (the observed DEMs and the surface-velocity field) ships in `data/`. The Optuna sweeper is bundled with IGM; the interactive **Optuna dashboard** is a separate web app installed on demand (`pip install optuna-dashboard`).

## How the calibration works

Two custom modules turn the forward simulation into a calibration objective:

- **`track_usurf_obs`** — compares the modelled surface elevation against 7 observed DEMs (1880–2017) and writes the **mean standard deviation** across all years into `state.score` as `cost_usurf`.
- **`track_velsurf_obs`** — at the final time step (2020) computes the **RMSE between modelled and observed surface speeds** where observations exist, written as `cost_velsurf` (used in Step 2 only).

Optuna calls `igm_run` repeatedly, proposing new parameter values each trial based on previous results, and records every trial in an SQLite database.

---

## Step 1: Single-objective optimisation

Finds the `weight_accumulation` and `weight_ablation` that minimise the DEM misfit (`cost_usurf`).

| Parameter | Meaning | Search range | Sampler |
|---|---|---|---|
| `processes.smb_accmelt.weight_accumulation` | Scale factor on accumulation | 0.5 – 3.0 | TPE |
| `processes.smb_accmelt.weight_ablation` | Scale factor on melt | 0.5 – 3.0 | TPE |

The optimisation settings live in `optuna/optuna_1obj_params.yaml` (50 trials, 4 in parallel, **TPE** sampler — a Tree-structured Parzen Estimator that models the objective from completed trials and samples promising regions, far more efficient than random search).

```bash
# Single run (no optimisation), to verify the setup:
igm_run +experiment=params_B_1obj

# With Optuna optimisation (50 trials, 4 in parallel):
igm_run -m +experiment=params_B_1obj \
        hydra/sweeper=igm_optuna \
        hydra.sweeper.optuna_config=optuna/optuna_1obj_params.yaml
```

Results are stored under `multirun/`, and the study is persisted in `optuna_1obj.db` so you can resume or inspect it any time. Explore it interactively:

```bash
pip install optuna-dashboard          # one-off install
optuna-dashboard sqlite:///optuna_1obj.db
```

**Best parameters found:** `weight_accumulation = 1.84`, `weight_ablation = 2.01`. These optimised values are the defaults used in the realistic forward runs (Part A, Steps 3–4).

---

## Step 2: Multi-objective optimisation

Same model as Step 1, but optimises **two** objectives simultaneously:

- `cost_usurf` — mean STD between modelled and observed DEMs (as in Step 1)
- `cost_velsurf` — RMSE between modelled and observed surface **speeds** at 2020 (from `track_velsurf_obs`)

The config `optuna/optuna_2obj_params.yaml` declares both objectives, switches the sampler from TPE to **NSGA-II** (a genetic algorithm suited to Pareto-front exploration), and adds a third free parameter:

| Parameter | Meaning | Search range |
|---|---|---|
| `processes.iceflow.physics.sliding.tau_ref` | Basal shear stress (MPa) at `u_ref = 100 m/yr` | 0.08 – 0.50 |

With `u_ref = 100 m/yr`, `tau_ref` *is* the basal shear stress at a typical Aletsch trunk speed, so fitting velocities well requires tuning it alongside the SMB weights.

```bash
# Single run (no optimisation):
igm_run +experiment=params_B_2obj

# With NSGA-II multi-objective optimisation (200 trials, 4 in parallel):
igm_run -m +experiment=params_B_2obj \
        hydra/sweeper=igm_optuna \
        hydra.sweeper.optuna_config=optuna/optuna_2obj_params.yaml
```

The study is persisted in `optuna_2obj.db` (study `aletsch_2obj`).

### Analyse and visualise

A Pareto-front plot reads the database directly:

```bash
python tools/plot_pareto_front.py
# or with explicit arguments:
python tools/plot_pareto_front.py --storage sqlite:///optuna_2obj.db \
                                  --study   aletsch_2obj \
                                  --out     pareto_front.png --show
```

The Pareto front reveals the trade-off: trials that fit surface elevation best tend to fit velocities less well, and vice versa — choosing a point on it is a modelling decision. To inspect the **spatial** misfit of a chosen trial (each trial writes `output.nc` + `output_ts.nc`):

```bash
# a single run saved under outputs/<timestamp>:
python tools/plot_misfit_maps.py --run outputs/<timestamp>

# a Pareto-optimal trial from the optimisation:
python tools/plot_misfit_maps.py --run multirun/<date>/<trial_number>
```

---

## Next steps

- **Recover a spatial field instead of scalars** — invert the ice thickness from surface velocities: [Ice-thickness inversion](aletsch_inversion.md)
- **Scale the search to a cluster**: [Optimization with Optuna](../hydra/optuna_cluster.md)
