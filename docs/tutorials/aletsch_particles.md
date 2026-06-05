# Aletsch: particle tracking

Ice does not stay where it falls as snow. Accumulating in the upper glacier, it is compressed into ice and slowly transported downhill by flow, eventually melting at the front. **Lagrangian particle tracking** makes this invisible motion visible: passive markers are seeded at the surface and carried by the 3D velocity field, tracing the path each parcel of ice takes through the glacier.

This tutorial shows how to activate particle tracking in IGM, control where particles are seeded, and visualise the resulting trajectories.

---

## Setup

Clone the examples repository:

```bash
git clone https://github.com/instructed-glacier-model/igm-examples.git
cd igm-examples/aletsch
```

Input data is downloaded automatically on first run. This tutorial corresponds to **Step 4** of the Aletsch example; it builds on the realistic climate setup introduced in Step 3.

---

## What particle tracking computes

At each time step the `particles` module moves a set of markers through the ice using the 3D velocity field `(U, V, W)`. Three fields are written to `output.nc` for each particle:

| Variable | Description |
|---|---|
| `xpos` | x-coordinate of the particle (m) |
| `ypos` | y-coordinate of the particle (m) |
| `rhpos` | Relative depth in the ice column: 0 = bed, 1 = surface |

Particles are seeded at the surface (`rhpos = 1`) and sink toward the bed as they are buried by new snowfall and compressed by flow. A particle that started in the accumulation zone 100 years ago will have `rhpos` close to 0 and will be found deep in the glacier trunk.

The vertical velocity `W` must be computed by enabling `iceflow.vertical_velocity` — without it, particles would only move horizontally.

---

## Configuration

```yaml
# experiment/params_step4.yaml

defaults:
  - /user/conf/processes@processes.smb_accmelt:     smb_accmelt
  - /user/conf/processes@processes.clim_aletsch:    clim_aletsch
  - /user/conf/processes@processes.track_usurf_obs: track_usurf_obs

  - override /inputs:
    - local
  - override /processes:
    - track_usurf_obs
    - clim_aletsch
    - smb_accmelt
    - iceflow
    - time
    - thk
    - rockflow
    - particles          # Lagrangian tracer module
  - override /outputs:
    - local
    - plot2d

inputs:
  local:
    filename: input.nc

processes:
  smb_accmelt:
    weight_accumulation: 1.062
    weight_ablation:     1.304
  iceflow:
    physics:
      init_slidingco: 0.0595
    vertical_velocity:
      enabled: true      # required: provides W for particle advection
  time:
    start: 1880.0
    end:   2020.0
    save:  1.0
  particles:
    seeding:
      method: "user"      # read seeding weights from seeding.nc
      frequency: 500      # re-seed every 500 time steps
      density: 1
    tracking:
      method: simple

outputs:
  plot2d:
    live: False
```

**Vertical velocity:** `W` is computed inside `iceflow` (via `iceflow.vertical_velocity.enabled: true`) and is available to `particles` automatically.

---

## Seeding strategies

The `seeding.method` parameter controls where new particles enter the simulation:

| Method | Behaviour |
|---|---|
| `"uniform"` | Seed on a regular grid across the entire glacier surface |
| `"user"` | Read a 2D weight map from `seeding.nc` — concentrate particles in chosen areas |
| `"random"` | Seed at uniformly random positions on the glacier |

The Aletsch dataset includes `seeding.nc`, a map that concentrates seeds in the upper accumulation zone. This ensures trajectories span the full length of the glacier from ice divide to terminus, which is the most informative for visualising englacial transport.

`frequency` controls how often new particles are injected. A value of 500 means every 500 model time steps; lower values give denser coverage at the cost of more memory.

---

## Run

```bash
igm_run +experiment=params_step4
```

The run covers 140 years (1880–2020) with annual output. Particle positions at each year are stored in `output.nc` alongside the standard fields.

---

## Visualise particle positions

### Snapshot at a single year

```python
import xarray as xr
import matplotlib.pyplot as plt

ds = xr.open_dataset("outputs/.../output.nc")

fig, ax = plt.subplots(figsize=(10, 7))

# Background: surface elevation
ds["usurf"].isel(time=-1).plot(
    ax=ax, cmap="terrain", add_colorbar=True,
    cbar_kwargs={"label": "Surface elevation (m)"}
)

# Particles coloured by relative depth
sc = ax.scatter(
    ds["xpos"].isel(time=-1).values,
    ds["ypos"].isel(time=-1).values,
    c=ds["rhpos"].isel(time=-1).values,
    s=1.5, cmap="plasma_r", vmin=0, vmax=1
)
plt.colorbar(sc, ax=ax, label="Relative depth (0 = bed, 1 = surface)")
ax.set_title("Particle positions — 2020")
ax.set_xlabel("x (m)")
ax.set_ylabel("y (m)")
plt.tight_layout()
plt.savefig("particles_2020.png", dpi=150)
```

Particles near the terminus are deep in the ice (`rhpos` close to 0) because they were buried long ago in the accumulation zone. Particles near the upper glacier are shallow (`rhpos` close to 1) because they were recently deposited.

### Animate trajectories

```python
import matplotlib.animation as animation
import numpy as np

fig, ax = plt.subplots(figsize=(10, 7))
ds["usurf"].isel(time=0).plot(
    ax=ax, cmap="terrain", add_colorbar=False, alpha=0.7
)
scat = ax.scatter([], [], s=1.5, c=[], cmap="plasma_r", vmin=0, vmax=1)
title = ax.set_title("")

def update(frame):
    year = int(ds.time[frame].values)
    title.set_text(f"Year {year}")
    x = ds["xpos"].isel(time=frame).values
    y = ds["ypos"].isel(time=frame).values
    r = ds["rhpos"].isel(time=frame).values
    mask = ~np.isnan(x)
    scat.set_offsets(np.c_[x[mask], y[mask]])
    scat.set_array(r[mask])
    return scat, title

ani = animation.FuncAnimation(
    fig, update, frames=len(ds.time), interval=80, blit=True
)
ani.save("particles_aletsch.gif", writer="pillow", dpi=100)
print("Saved particles_aletsch.gif")
```

---

## Compute travel time and ice age

**Travel time** is how long a particle has been in the glacier since it was seeded:

```python
import numpy as np

xpos  = ds["xpos"].values    # shape: (time, n_particles)
years = ds.time.values

# First valid (non-NaN) time index for each particle
first_idx = np.argmax(~np.isnan(xpos), axis=0)
seed_year  = years[first_idx]

# Travel time at each output year
travel_time = years[:, None] - seed_year[None, :]   # (time, n_particles)

# At the final time step, median travel time of surviving particles
final_travel = travel_time[-1]
mask = ~np.isnan(xpos[-1])
print(f"Median travel time (2020): {np.median(final_travel[mask]):.0f} years")
```

**Ice age** is the same quantity — how many years have passed since the ice was deposited at the surface. Deep, slow-moving ice near the bed of the tongue may be centuries old; ice at the equilibrium line is younger.

To map ice age spatially, bin particles by their position and average their travel time:

```python
from scipy.stats import binned_statistic_2d

x  = ds["xpos"].isel(time=-1).values
y  = ds["ypos"].isel(time=-1).values
age = travel_time[-1]
mask = ~np.isnan(x)

stat, xe, ye, _ = binned_statistic_2d(
    x[mask], y[mask], age[mask],
    statistic="mean", bins=80
)

plt.figure(figsize=(10, 7))
plt.pcolormesh(xe, ye, stat.T, cmap="magma")
plt.colorbar(label="Mean ice age (years)")
plt.title("Estimated ice age — 2020")
plt.xlabel("x (m)")
plt.ylabel("y (m)")
plt.tight_layout()
plt.savefig("ice_age_map.png", dpi=150)
```

---

## Next steps

- **Sweep sliding parameters** and see how they change particle trajectories: [Ensemble run with Hydra](aletsch_ensemble.md)
- **Calibrate the velocity field** before running particle tracking so trajectories are physically grounded: [Parameter calibration with Optuna](aletsch_da.md)
