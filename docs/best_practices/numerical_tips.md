# Numerical Tips

Practical guidance for getting the best results from IGM's numerical solvers.

!!! info "Iceflow-specific guidance"
    For solver mode selection, learning rates, checkerboard artefacts, and vertical basis choice, see [Practical guidance](../modules/processes/iceflow.md#practical-guidance) in the `iceflow` module doc.

---

## Time stepping and the CFL condition

IGM uses an explicit upwind finite-volume scheme for ice thickness evolution ([`thk`](../modules/processes/thk.md)). This scheme is subject to the **Courant–Friedrichs–Lewy (CFL) condition**:

$$\frac{\|\bar{u}\|_\infty \, \Delta t}{\Delta x} \leq C$$

where $C$ is the CFL number (set by `processes.time.cfl`, default ≈ 0.5). The time step $\Delta t$ is chosen adaptively to satisfy this bound.

**Practical consequences:**

- Fast-flowing glaciers (e.g. outlet glaciers, tidewater) require smaller time steps.
- Finer grids also require smaller time steps for the same velocity.
- If the simulation is very slow, the flow speed may be unrealistically high — investigate the SMB or iceflow parameters.

---

## Grid resolution

All IGM fields live on a **regular rectangular grid** with uniform spacing $\Delta x$. Choose the resolution based on the feature you want to resolve:

| Application | Typical $\Delta x$ |
|---|---|
| Alpine valley glacier | 50–200 m |
| Large icefield / ice cap | 200–500 m |
| Ice sheet domain | 1–10 km |
| Palaeo-glaciation (Alps scale) | 500 m – 2 km |

!!! tip
    Halving the grid spacing roughly quadruples the memory requirement and reduces the maximum time step proportionally. Start coarse, then refine.

---

## Data assimilation and inversion

### Calibrating scalar parameters

For calibrating uniform scalar parameters (e.g. a uniform sliding coefficient, Arrhenius factor, ELA), we recommend using **Hydra parameter sweeps** combined with **Optuna** for Bayesian optimisation. This is a robust and easy-to-use approach that requires no modifications to the model code — see the [Parameter Sweeps](../hydra/distributed_computing.md) and [Optimization with Optuna](../hydra/optuna_cluster.md) pages.

### Spatially distributed inversion (control method)

The control method — which optimises spatially distributed fields such as basal sliding or ice rheology from surface observations — is currently being **heavily reworked** and a significantly improved version is expected to be available in the coming months.

!!! warning
    We currently recommend the control method only to users who are already familiar with IGM or who have prior experience with PDE-constrained optimisation in ice-sheet modelling. If you are new to IGM, start with the scalar parameter calibration approach above.

---

## GPU memory

GPU memory is the most common bottleneck on large domains. If you run out of memory:

1. Reduce grid resolution.
2. Reduce `nz` (vertical layers).
3. Reduce `nbit` (fewer iceflow iterations).
4. Enable patching (`iceflow.patching: True`) to split the domain into subgrids — this caps memory per training step at the cost of slightly more training time.
