# Aletsch: forward run

The Great Aletsch Glacier (Swiss Alps) is the largest glacier in the Alps and one of the best-observed glaciers in the world, with DEMs, velocity fields, and meteorological records spanning more than a century. This makes it an ideal testbed for learning IGM.

This tutorial walks through **four progressive setups** for the same glacier, each adding physical realism. You can follow all four in order or jump directly to whichever setup matches your needs.

---

## Setup

Clone the examples repository:

```bash
git clone https://github.com/instructed-glacier-model/igm-examples.git
cd igm-examples/aletsch
```

Input data (bedrock topography, ice thickness, surface velocities, climate records, historical DEMs) is downloaded automatically on first run from a hosted archive. No manual data preparation is needed.

The folder layout is:

```
aletsch/
  experiment/          # one params_stepN.yaml per step
  user/                # custom process modules
    code/processes/    # Python source files
    conf/processes/    # Hydra config stubs
  tools/               # post-processing scripts
```

---

## Step 1 — Simple ELA-based SMB

The simplest possible glacier simulation: ice flow driven by a built-in surface mass balance model whose equilibrium-line altitude (ELA) shifts linearly with time to represent a warming climate. No climate data is required.

### How it works

The `smb_simple` module computes a piecewise-linear mass-balance profile at each grid point based on surface elevation. The profile is described by three numbers:

- **ELA** — elevation at which SMB = 0
- **`gradabl`** — ablation gradient below the ELA (m w.e. m⁻¹ yr⁻¹)
- **`gradacc`** — accumulation gradient above the ELA (m w.e. m⁻¹ yr⁻¹)

These values are specified at key years; IGM interpolates linearly in between.

### Configuration

```yaml
# experiment/params_step1.yaml

defaults:
  - override /inputs:
    - local
  - override /processes:
    - smb_simple
    - iceflow
    - time
    - thk
  - override /outputs:
    - local
    - live_dashboard

inputs:
  local:
    filename: input.nc

processes:
  smb_simple:
    array:
      - ["time", "gradabl", "gradacc", "ela", "accmax"]
      - [1900,    0.009,     0.005,    2800,   2.0]
      - [2000,    0.009,     0.005,    2900,   2.0]
      - [2100,    0.009,     0.005,    3300,   2.0]
  time:
    start: 1900.0
    end:   2000.0
    save:  10.0
```

The ELA rises from 2800 m in 1900 to 3300 m by 2100, thinning the glacier as the climate warms. `accmax` caps accumulation at 2 m yr⁻¹ to prevent unrealistic build-up at high elevations.

The process order matters: `smb_simple` must run before `iceflow` (which needs the SMB field), and `iceflow` before `thk` (which needs the velocity field to evolve thickness).

### Run

```bash
igm_run +experiment=params_step1
```

Output lands in `outputs/<date>_<time>/`. The main file is `output.nc`, with snapshots of ice thickness and surface elevation every 10 years.

```bash
ncview outputs/*/output.nc
```

---

## Step 2 — Custom SMB module

This step replaces `smb_simple` with a **user-defined module** (`mysmb`) that computes SMB from a sinusoidal ELA signal. The physics are simple, but the point is the workflow: how to write, register, and use your own process module.

### How custom modules work

Custom modules live in `user/code/processes/`. A Hydra config stub in `user/conf/processes/` makes the module visible to IGM. The `defaults` list in `params.yaml` registers the stub, after which the module is used like any built-in.

### Configuration

```yaml
# experiment/params_step2.yaml

defaults:
  - /user/conf/processes@processes.mysmb: mysmb   # register the custom module

  - override /inputs:
    - local
  - override /processes:
    - mysmb        # replaces smb_simple
    - iceflow
    - time
    - thk
  - override /outputs:
    - local
    - live_dashboard

inputs:
  local:
    filename: input.nc

processes:
  time:
    start: 1900.0
    end:   2000.0
    save:  10.0
```

The `mysmb` module source is in `user/code/processes/mysmb.py`. Read through it — it is a minimal but complete example of the IGM module interface (`initialize`, `update`, `finalize`).

### Run

```bash
igm_run +experiment=params_step2
```

See [User Modules](../modules/user_modules.md) for a full guide to writing your own modules.

---

## Step 3 — Realistic climate and temperature-index SMB

Steps 1 and 2 use toy mass-balance models. Step 3 replaces them with a physically realistic pipeline driven by actual meteorological data:

1. **`clim_aletsch`** — reads a daily temperature and precipitation record for the Aletsch region (1880–2020).
2. **`smb_accmelt`** — a temperature-index model that converts temperature and precipitation into accumulation and melt using calibrated scale factors.
3. **`track_usurf_obs`** — at each time step, compares the modelled surface elevation against 7 observed DEMs (1880, 1926, 1957, 1980, 1999, 2009, 2017) and writes the misfit into `state.score`.

This step also adds `rockflow` (bedrock flexure/erosion coupling) and `vert_flow` (vertical velocity field from incompressibility).

### Configuration

```yaml
# experiment/params_step3.yaml

defaults:
  - /user/conf/processes@processes.smb_accmelt:     smb_accmelt
  - /user/conf/processes@processes.clim_aletsch:    clim_aletsch
  - /user/conf/processes@processes.track_usurf_obs: track_usurf_obs

  - override /inputs:
    - local
  - override /processes:
    - track_usurf_obs   # loads observations and computes misfit
    - clim_aletsch      # reads temperature and precipitation
    - smb_accmelt       # computes SMB from climate
    - iceflow
    - time
    - thk
    - rockflow
    - vert_flow
  - override /outputs:
    - local
    - live_dashboard

inputs:
  local:
    filename: input.nc

processes:
  smb_accmelt:
    weight_accumulation: 1.062   # calibrated scale factor on accumulation
    weight_ablation:     1.304   # calibrated scale factor on melt
  iceflow:
    physics:
      init_slidingco: 0.0595     # basal sliding coefficient (MPa m⁻¹/³ yr¹/³)
  time:
    start: 1880.0
    end:   2020.0
    save:  1.0                   # annual snapshots
```

The `weight_accumulation` and `weight_ablation` parameters were calibrated against the 7 observed DEMs using Optuna (see the [calibration tutorial](aletsch_da.md)). The best fit achieved a mean surface elevation misfit of 30.6 m across all observation years.

`init_slidingco` is the Weertman sliding coefficient. Larger values produce faster sliding and thinner ice; the chosen value of 0.0595 reproduces the observed present-day glacier geometry.

### Run

```bash
igm_run +experiment=params_step3
```

With annual output over 140 years, this run produces a richer dataset than Steps 1–2. Compare the modelled surface against the observed DEMs in `past_surf.nc`:

```python
import xarray as xr
import matplotlib.pyplot as plt

ds  = xr.open_dataset("outputs/.../output.nc")
obs = xr.open_dataset("data/past_surf.nc")

# modelled vs. observed surface in 1957
fig, axes = plt.subplots(1, 2, figsize=(12, 5))
ds["usurf"].sel(time=1957, method="nearest").plot(ax=axes[0], title="Modelled 1957")
obs["usurf"].sel(time=1957, method="nearest").plot(ax=axes[1], title="Observed 1957")
plt.tight_layout()
plt.savefig("comparison_1957.png", dpi=150)
```

---

## Inspecting outputs

All steps write results to `outputs/<date>_<time>/`:

| File | Contents |
|---|---|
| `output.nc` | Time series of all saved fields (`thk`, `usurf`, `ubar`, `vbar`, …) |
| `.hydra/config.yaml` | Complete merged configuration for this run |
| `.hydra/overrides.yaml` | Any command-line overrides applied |

Quick exploration in Python:

```python
import xarray as xr
ds = xr.open_dataset("outputs/.../output.nc")
print(ds)                                    # list all variables
ds["thk"].isel(time=-1).plot()               # ice thickness at end
(ds["thk"] > 0).sum(dim=["x", "y"]).plot()  # glacierized area over time
```

---

## Next steps

- **Sweep parameters** — run the same simulation with multiple ELA or sliding values in one command: [Ensemble run with Hydra](aletsch_ensemble.md)
- **Add particle tracking** — visualise ice flow paths through the glacier: [Particle tracking](aletsch_particles.md)
- **Calibrate automatically** — use Optuna to find the best `weight_accumulation` and `weight_ablation`: [Parameter calibration with Optuna](aletsch_da.md)
