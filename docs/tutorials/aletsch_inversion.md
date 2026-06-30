# Aletsch: ice-thickness inversion

Where [parameter calibration](aletsch_da.md) tunes a few scalars, this tutorial recovers a full **spatial field** — the ice thickness — from surface observations.

This is **Part C** of the Aletsch example: ice-thickness data assimilation with IGM's `data_assimilation` module. The inversion optimises the thickness field so that modelled surface velocities (Blatter–Pattyn physics) best match observed velocities, while regularisation keeps the solution physically plausible.

!!! note "Newer alternatives exist"
    `data_assimilation` is IGM's current inversion. Two further strategies — `field_inversion` (Part D, a lighter route set to replace it) and `time_relaxation` (Part E) — are documented in the [`igm-examples` repository](https://github.com/instructed-glacier-model/igm-examples/tree/main/aletsch). Parts C and D recover a single field (`thk`); Part E nudges several fields jointly inside a transient forward run.

---

## Setup

```bash
git clone https://github.com/instructed-glacier-model/igm-examples.git
cd igm-examples/aletsch
```

Geometry and observations (surface velocities `uvelsurfobs/vvelsurfobs`, GPR thickness `thkobs`, `icemask`) ship in `data/input.nc`. Steps 1–3 use `params_C_offline.yaml` (off-line trained emulator); Step 4 uses `params_C_online.yaml` (on-line retrained solver). Both share the same assimilation setup:

- **Ice flow** — the `unified` iceflow stack (off-line emulator in Steps 1–3, on-line solver in Step 4)
- **Control variable** — ice thickness (`thk`)
- **Cost function** — surface-velocity misfit (`velsurf`) + ice-mask penalty (`icemask`)
- **Optimiser** — ADAM with learning-rate decay, up to 1000 iterations
- **Regularisation** — gradient penalty on `thk` (weight `regularization.thk`)

```yaml
# experiment/params_C_offline.yaml (excerpt)
assimilations:
  data_assimilation:
    control_list: [thk]
    cost_list:    [velsurf, icemask]
    optimization:
      nbitmax: 1000
      retrain_iceflow_model: false   # frozen emulator (Steps 1–3)
    regularization:
      thk: 300.0
      to_regularize: thk
    output:
      save_result_in_ncdf: geology-optimized.nc
      save_iterat_in_ncdf: true
```

---

## Step 1: Single inversion (off-line emulator)

```bash
igm_run +experiment=params_C_offline hydra.run.dir=outputs/DA_step1
```

This takes ~15 min on a GPU. Key result files in `outputs/DA_step1/`:

- `geology-optimized.nc` — final ice thickness, velocities and other fields
- `optimize.nc` — optimisation history (per iteration)

---

## Step 2: L-curve analysis

The regularisation weight controls the trade-off between fitting the data and keeping the thickness smooth. The **L-curve** method plots data misfit against solution roughness for several weights and looks for the "elbow". Sweep with Hydra multirun, run in parallel via the joblib launcher (one-off `pip install hydra-joblib-launcher`, not bundled with IGM):

```bash
igm_run -m +experiment=params_C_offline \
    assimilations.data_assimilation.regularization.thk=1,3,10,30,100,300,1000,3000,10000 \
    hydra/launcher=joblib hydra.launcher.n_jobs=3 \
    hydra.sweep.dir=outputs/DA_step2

python tools/analyze_step1.py outputs/DA_step2
```

This produces `lcurve_step1.png` (L-curve + misfit-vs-regularisation). The elbow — typically reg ≈ 10–30 for Aletsch — indicates the best balance.

---

## Step 3: Sliding-coefficient sweep with thickness validation

When thickness observations (GPR) are available, they can validate the inversion and constrain the sliding coefficient. Sweep `physics.sliding.tau_ref` with the regularisation weight fixed:

```bash
igm_run -m +experiment=params_C_offline \
    processes.iceflow.physics.sliding.tau_ref=0.05,0.075,0.1,0.15,0.2,0.25,0.3,0.35,0.4 \
    hydra/launcher=joblib hydra.launcher.n_jobs=3 \
    hydra.sweep.dir=outputs/DA_step3

python tools/analyze_step2.py outputs/DA_step3 --param processes.iceflow.physics.sliding.tau_ref
```

This produces `sweep_tau_ref.png` (velocity RMSE, thickness RMSE vs GPR, and ice volume as functions of `tau_ref`). The best coefficient minimises thickness RMSE while keeping velocity RMSE acceptable.

---

## Step 4: Single inversion (on-line retrained solver)

Exactly the same inversion as Step 1, but the ice flow uses the **on-line retrained solver** (`params_C_online`) instead of the frozen emulator. Here `data_assimilation` keeps **retraining the network during the inversion** (`retrain_iceflow_model: true`), so the ice-flow physics is continually re-fitted to the thickness as it evolves — more faithful than Step 1, at the cost of being slower.

```bash
igm_run +experiment=params_C_online hydra.run.dir=outputs/DA_step4
```

---

## Next steps

- **Tune scalar parameters instead of a field**: [Parameter calibration with Optuna](aletsch_da.md)
- **Newer / alternative inversions** (`field_inversion`, `time_relaxation`) — see the [`igm-examples` repository](https://github.com/instructed-glacier-model/igm-examples/tree/main/aletsch)
