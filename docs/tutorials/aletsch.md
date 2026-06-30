# Aletsch: forward modelling

The Great Aletsch Glacier (Swiss Alps) is the largest glacier in the Alps and one of the best-observed glaciers in the world, with DEMs, velocity fields, and meteorological records spanning more than a century. This makes it an ideal testbed for learning IGM.

This page covers **Part A — standard forward modelling**: running the glacier forward in time. It is built up in **five steps** of increasing realism, from a simple ELA-based mass balance to a realistic climate/SMB pipeline with particle tracking. Steps 1–4 use the fast **off-line trained iceflow emulator**; Step 5 repeats Step 1 with the **on-line retrained solver** to contrast the two.

!!! info "This is one part of a larger example"
    The same Aletsch example also includes **Parts B–E** — four alternative strategies for **data assimilation** (parameter tuning and inversion). Those are not reproduced here; see [Beyond forward modelling](#beyond-forward-modelling-parts-be) at the bottom and the [`igm-examples` repository](https://github.com/instructed-glacier-model/igm-examples/tree/main/aletsch).

---

## Setup

Clone the examples repository and move into the Aletsch folder:

```bash
git clone https://github.com/instructed-glacier-model/igm-examples.git
cd igm-examples/aletsch
```

All input data ships with the repository in `data/` (geometry, surface velocities, climate records, historical DEMs) — no manual preparation is needed. Every configuration lives in `experiment/` and is run with `igm_run +experiment=<name>`. The folder layout is:

```
aletsch/
  data/                # input data (input.nc, climate records, observed DEMs, …)
  experiment/          # one params_A_stepN.yaml per step (+ common/ fragments)
  user/                # custom process modules
    code/processes/    # Python source files
    conf/processes/    # Hydra config stubs
  tools/               # post-processing scripts
```

!!! tip
    Prefix any command with `TF_CPP_MIN_LOG_LEVEL=3` to silence verbose TensorFlow logging. Results are written to a timestamped subfolder under `outputs/` (or to the directory passed via `hydra.run.dir=`).

---

## Step 1: Simple ELA-based SMB

The simplest setup: simulate the evolution of Aletsch over 100 years (1900–2000) using the built-in `smb` module (method `simple`) with a time-varying equilibrium-line altitude (ELA). No climate data is required.

### How it works

The `smb` module with `method: simple` computes a piecewise-linear mass-balance profile at each grid point based on surface elevation, described by:

- **`ela`** — elevation at which SMB = 0
- **`gradabl`** — ablation gradient below the ELA (m w.e. m⁻¹ yr⁻¹)
- **`gradacc`** — accumulation gradient above the ELA (m w.e. m⁻¹ yr⁻¹)
- **`accmax`** — cap on accumulation (m yr⁻¹)

These values are given at key years; IGM interpolates linearly in between. Steps 1–4 load the off-line trained iceflow emulator through the `common: iceflow_offline` fragment, which requires no knowledge of IGM's iceflow machinery (see [Step 5](#step-5-off-line-emulator-vs-on-line-solver) for the emulator-vs-solver distinction).

### Configuration

```yaml
# experiment/params_A_step1.yaml
# @package _global_

defaults:
  - common: iceflow_offline   # off-line trained iceflow emulator (no tuning needed)
  - override /inputs:
    - local
  - override /processes:
    - smb
    - iceflow
    - time
    - thk
  - override /outputs:
    - local
    - live_dashboard          # live view of the model state during the run

inputs:
  local:
    filename: input.nc

processes:
  smb:
    method: simple
    simple:
      array:
        - ["time", "gradabl", "gradacc", "ela", "accmax"]
        - [1900, 0.009, 0.005, 2800, 2.0]
        - [2000, 0.009, 0.005, 2900, 2.0]
        - [2100, 0.009, 0.005, 3300, 2.0]
  time:
    start: 1900.0
    end:   2000.0
    save:  10.0
  iceflow:
    physics:
      sliding:
        tau_ref: 0.325   # basal shear stress (MPa) required ...
        u_ref:   100.0   # ... to reach this basal sliding speed (m/yr)
```

The ELA rises from 2800 m in 1900 to 3300 m by 2100, thinning the glacier as the climate warms. The process order matters: `smb` runs before `iceflow` (which needs the SMB field), and `iceflow` before `thk` (which needs the velocity field to evolve thickness).

### Run

```bash
igm_run +experiment=params_A_step1
```

The run takes a few seconds to a minute depending on your hardware, and shows the evolving ice-thickness and speed fields live in the dashboard. Output lands in `outputs/<date>_<time>/output.nc`:

```bash
ncview outputs/*/output.nc
```

---

## Step 2: Custom user-defined SMB module

This step replaces `smb` (in `simple` mode) with a **custom user module** (`mysmb`) that computes SMB from a sinusoidal ELA signal. The physics are simple; the point is the workflow — how to write, register, and plug in your own process module.

Custom modules live in `user/code/processes/`; a Hydra config stub in `user/conf/processes/` makes the module visible to IGM. The `defaults` list registers the stub (`- /user/conf/processes@processes: mysmb`), after which the module is used like any built-in:

```yaml
# experiment/params_A_step2.yaml (excerpt)
defaults:
  - common: iceflow_offline
  - /user/conf/processes@processes: mysmb   # register the custom module
  - override /processes:
    - mysmb        # replaces smb
    - iceflow
    - time
    - thk
```

The module source is in `user/code/processes/mysmb.py` — a minimal but complete example of the IGM module interface (`initialize`, `update`, `finalize`). This run extends to 2300 to show the full sinusoidal advance–retreat cycle.

```bash
igm_run +experiment=params_A_step2
```

See [User Modules](../modules/user_modules.md) for a full guide to writing your own modules.

---

## Step 3: Realistic climate and accumulation/melt SMB

Steps 1–2 use toy mass-balance models. Step 3 replaces them with a physically realistic pipeline driven by actual meteorological data (1880–2020), via three custom modules:

- **`clim_aletsch`** — loads the daily temperature and precipitation record for the Aletsch region.
- **`smb_accmelt`** — a temperature-index model converting temperature and precipitation into accumulation and melt.
- **`track_usurf_obs`** — compares the modelled surface elevation against 7 observed DEMs (1880, 1926, 1957, 1980, 1999, 2009, 2017) and writes the misfit into `state.score`.

```yaml
# experiment/params_A_step3.yaml (excerpt)
processes:
  smb_accmelt:
    weight_accumulation: 1.84   # calibrated scale factor on accumulation
    weight_ablation:     2.01   # calibrated scale factor on melt
  time:
    start: 1880.0
    end:   2020.0
    save:  1.0                  # annual snapshots
```

```bash
igm_run +experiment=params_A_step3
```

The new modules add a daily climate/SMB time step, making this run a few times more expensive. During the simulation, IGM reports the mismatch against the observed DEMs; the goal is to minimise its standard deviation, which is what the parameter calibration of **Part B** achieves — the `weight_accumulation = 1.84` / `weight_ablation = 2.01` values used here are its optimised result.

---

## Step 4: With particle tracking

Same as Step 3, but adds the `particles` module to visualise ice-flow paths (it also pulls in `rockflow`). A user-defined particle seeding highlights the two regions responsible for debris production, which build the two legendary moraines of the Aletsch Glacier.

```yaml
# experiment/params_A_step4.yaml (excerpt)
defaults:
  - override /processes:
    - track_usurf_obs
    - clim_aletsch
    - smb_accmelt
    - iceflow
    - time
    - thk
    - rockflow    # required for particle tracking
    - particles   # particle tracking
processes:
  particles:
    seeding:
      method: "user"   # custom seeding map (user/code/processes/particles)
      frequency: 500
      density: 1
    tracking:
      method: simple
```

```bash
igm_run +experiment=params_A_step4
```

---

## Step 5: Off-line emulator vs on-line solver

Identical to Step 1 (the same simple-ELA run, 1900–2000) **except for the iceflow component**: it loads `common: iceflow_online` (the on-line retrained solver) instead of `iceflow_offline`. Run it and compare with Step 1 to see the effect. The two differ in what the neural network actually does:

- **Off-line trained emulator** (Steps 1–4, `iceflow_offline`): a network pretrained beforehand and used **frozen** — it *emulates* the ice-flow physics learned offline, with no training during the run. Easiest and fastest for "standard" mountain glaciers, but trustworthy only near its training regime (50–250 m resolution, 2-layer MOLHO vertical basis).
- **On-line retrained solver** (this step, and Parts B–E, `iceflow_online`): a fresh network is trained from scratch at initialisation and **retrained on the fly** every few steps to minimise the actual ice-flow energy — so it *solves* the physics for the current state, adapting to the evolving geometry and to whatever sliding/rheology you set. The most generic option (ice sheets, marine-terminating ice, surging glaciers, …), at the cost of extra numerical parameters to tune and slower runs.

```bash
igm_run +experiment=params_A_step5
```

---

## Inspecting outputs

All steps write results to `outputs/<date>_<time>/`:

| File | Contents |
|---|---|
| `output.nc` | Time series of all saved fields (`thk`, `usurf`, `velsurf_mag`, …) |
| `.hydra/config.yaml` | Complete merged configuration for this run |
| `.hydra/overrides.yaml` | Any command-line overrides applied |

Quick exploration in Python:

```python
import xarray as xr
ds = xr.open_dataset("outputs/.../output.nc")
print(ds)                                    # list all variables
ds["thk"].isel(time=-1).plot()               # ice thickness at end
(ds["thk"] > 0).sum(dim=["x", "y"]).plot()   # glacierized area over time
```

For Step 3, compare the modelled surface against the observed DEMs in `data/past_surf.nc`.

---

## Beyond forward modelling: Parts B–E

The same example continues with four alternative strategies for **data assimilation** — constraining model parameters or state from observations. Parts B and C have dedicated tutorials here; Parts D and E are documented in the [`igm-examples` repository](https://github.com/instructed-glacier-model/igm-examples/tree/main/aletsch):

| Part | Strategy | IGM module / tool | What it does |
|------|----------|-------------------|--------------|
| **B** | Hyperparameter tuning | Optuna sweeper | Searches scalar parameters (SMB weights, friction) that best reproduce observed DEMs and velocities. → [Parameter calibration](aletsch_da.md) |
| **C** | Control optimisation | `data_assimilation` | Inverts the ice thickness from surface velocities. → [Ice-thickness inversion](aletsch_inversion.md) |
| **D** | Control optimisation | `field_inversion` | Inverts the ice thickness from surface velocities; newer, set to replace `data_assimilation` in the long term. |
| **E** | Time relaxation | `time_relaxation` | Nudges several fields jointly inside a transient forward run until model and observations are mutually consistent. |
