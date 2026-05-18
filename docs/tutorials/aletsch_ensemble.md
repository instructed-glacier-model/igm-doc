# Aletsch: ensemble run with Hydra

A single `igm_run` command can launch a whole family of simulations by varying one or more parameters — no scripting, no file duplication. This is Hydra's **multirun** feature. This tutorial shows how to use it to explore the sensitivity of the Aletsch Glacier to mass-balance and sliding parameters.

---

## Setup

Clone the examples repository and enter the Aletsch folder:

```bash
git clone https://github.com/instructed-glacier-model/igm-examples.git
cd igm-examples/aletsch
```

This tutorial uses `params_step3.yaml` as its base configuration. Input data is downloaded automatically on first run.

---

## How Hydra overrides work

Any parameter in the configuration can be overridden from the command line using dot-path notation:

```bash
igm_run +experiment=params_step3 \
  processes.smb_accmelt.weight_accumulation=1.5
```

This runs a single simulation with `weight_accumulation` set to 1.5. The override is recorded in `.hydra/overrides.yaml` inside the output folder, making the run fully reproducible.

You can override as many parameters as you like in a single command:

```bash
igm_run +experiment=params_step3 \
  processes.smb_accmelt.weight_accumulation=1.5 \
  processes.iceflow.physics.init_slidingco=0.10 \
  processes.time.end=1950
```

---

## 1D sweep: varying one parameter

Add `-m` (multirun) and provide comma-separated values to run one simulation per value:

```bash
igm_run -m +experiment=params_step3 \
  processes.smb_accmelt.weight_accumulation=0.8,1.0,1.062,1.2,1.4
```

This launches **5 sequential runs**. Results land in numbered subdirectories:

```
multirun/
  <date>/
    0/    # weight_accumulation = 0.8
    1/    # weight_accumulation = 1.0
    2/    # weight_accumulation = 1.062   ← calibrated value
    3/    # weight_accumulation = 1.2
    4/    # weight_accumulation = 1.4
```

Each folder contains `output.nc` and `.hydra/overrides.yaml`.

### Comparing glacier volume

```python
import xarray as xr
import matplotlib.pyplot as plt
from pathlib import Path

run_dir = Path("multirun/<date>")
weights = [0.8, 1.0, 1.062, 1.2, 1.4]

fig, ax = plt.subplots(figsize=(9, 5))
for i, w in enumerate(weights):
    ds = xr.open_dataset(run_dir / str(i) / "output.nc")
    dx = float(ds.x[1] - ds.x[0])
    vol = (ds["thk"] * dx**2).sum(dim=["x", "y"]) * 1e-9  # km³
    ax.plot(ds.time, vol, label=f"weight_acc = {w}")

ax.set_xlabel("Year")
ax.set_ylabel("Ice volume (km³)")
ax.legend()
plt.tight_layout()
plt.savefig("volume_sensitivity_acc.png", dpi=150)
```

---

## 2D grid: varying two parameters

Providing two overrides with comma-separated values produces their **Cartesian product**:

```bash
igm_run -m +experiment=params_step3 \
  processes.smb_accmelt.weight_accumulation=0.8,1.0,1.2 \
  processes.smb_accmelt.weight_ablation=1.0,1.2,1.4
```

This launches **9 runs** (3 × 3). The run index increases with the rightmost parameter varying fastest:

| Run | `weight_accumulation` | `weight_ablation` |
|---|---|---|
| 0 | 0.8 | 1.0 |
| 1 | 0.8 | 1.2 |
| 2 | 0.8 | 1.4 |
| 3 | 1.0 | 1.0 |
| … | … | … |
| 8 | 1.2 | 1.4 |

### Reading parameter values reliably

Rather than reconstructing parameters from the run index, read them from the Hydra override file:

```python
import yaml
import xarray as xr
import numpy as np
from pathlib import Path

run_dir = Path("multirun/<date>")
results = []

for run_path in sorted(run_dir.iterdir()):
    overrides_file = run_path / ".hydra" / "overrides.yaml"
    if not overrides_file.exists():
        continue
    with open(overrides_file) as f:
        overrides = yaml.safe_load(f)

    # parse overrides list into a dict
    params = {}
    for entry in overrides:
        key, val = entry.split("=", 1)
        params[key] = float(val)

    ds = xr.open_dataset(run_path / "output.nc")
    dx = float(ds.x[1] - ds.x[0])
    final_vol = float((ds["thk"].isel(time=-1) * dx**2).sum()) * 1e-9
    results.append({**params, "final_volume_km3": final_vol})

import pandas as pd
df = pd.DataFrame(results)
print(df.sort_values("final_volume_km3"))
```

---

## Varying the sliding coefficient

Basal sliding controls ice speed and therefore thickness distribution. Sweep over `init_slidingco` to quantify sensitivity:

```bash
igm_run -m +experiment=params_step3 \
  processes.iceflow.physics.init_slidingco=0.03,0.06,0.10,0.15,0.25
```

Lower values produce faster sliding and thinner ice. The calibrated value (0.0595) sits between the extremes.

---

## Useful overrides

| Goal | Override |
|---|---|
| Shorten the run for testing | `processes.time.end=1920` |
| Increase output frequency | `processes.time.save=1.0` |
| Disable live dashboard | `outputs.live_dashboard.live=False` |
| Custom output folder | `hydra.run.dir=outputs/my_run` |

---

## Next steps

- **Automate the search** — instead of manually choosing values, let Optuna find the optimal parameters: [Parameter calibration with Optuna](aletsch_da.md)
- **Scale to a cluster** — run hundreds of trials in parallel: [Configuration — Parameter Sweeps](../hydra/distributed_computing.md)
- **Add particle tracking** to visualise how flow paths change across the ensemble: [Particle tracking](aletsch_particles.md)
