# Numerical Tips

Practical guidance for getting the best results from IGM's numerical solvers.

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

## Iceflow solver modes

The `iceflow` module supports several modes. `solved` and `emulated` are **legacy modes** — they remain functional but are no longer actively developed. The recommended approach is the **`unified` mode**, which covers both use cases through the `mapping` parameter:

| `method` | `mapping` | Equivalent to | Description |
|---|---|---|---|
| `unified` | `identity` | `solved` | Direct energy minimisation; accurate, slower |
| `unified` | `network` | `emulated` | Neural-network emulator; fast, requires pre-trained weights |

!!! warning "Learning rates differ significantly between mappings"
    Always set **both** `lr` and `lr_init` explicitly — relying on defaults when switching mappings is a common source of problems.

    - `mapping: identity` — use `lr` / `lr_init` ≈ **0.9**
    - `mapping: network` — use `lr` / `lr_init` in the range **1e-5 – 1e-3**

    A learning rate that is too high can cause numerical instabilities or a fully diverging run. If you observe velocities blowing up or NaN values in the output, reducing the learning rate is the first thing to try.

### The `nbit` parameter

`nbit` controls how many optimisation iterations are used per iceflow solve. Increasing it improves accuracy at the cost of compute time. A practical check: double `nbit` and verify that the resulting velocities change by less than ~5%.

### Checkerboard artefacts in identity-mapping mode

When using the direct solver (`mapping: identity`), the default single-point cell-centred horizontal quadrature can admit **checkerboard zero-energy modes** — spurious oscillations in the velocity field where neighbouring cells move in opposite directions without contributing to the energy.

If you observe a checkerboard pattern in the velocity output, switch to a higher-order horizontal integration scheme via `numerics.basis_horizontal`:

| Value | Scheme | Cost |
|---|---|---|
| `central` | Single cell-centred evaluation point (default) | Lowest, but susceptible to checkerboard modes |
| `q1` | 2×2 Gaussian quadrature on bilinear (Q1) elements | Eliminates checkerboard modes |
| `p1` | P1 triangulation (each cell split into two triangles) | Eliminates checkerboard modes |
| `mac` | Marker-and-cell staggered-grid scheme | Eliminates checkerboard modes |

Example configuration:

```yaml
processes:
  iceflow:
    method: unified
    unified:
      mapping: identity
      numerics:
        basis_horizontal: q1   # or p1
```

!!! note
    This issue is specific to the direct solver (`mapping: identity`). The neural-network emulator (`mapping: network`) is not affected because the network weights parameterize the velocity field globally, which inherently suppresses such spurious modes.

---

## Vertical discretisation

The vertical profile of the ice velocity is expanded in a set of basis functions controlled by `basis_vertical` and `Nz` under `processes.iceflow.unified.numerics`. Two options cover most use cases:

**MOLHO** (MOno-Layer Higher-Order) uses exactly two layers and is the recommended choice for most applications — it captures the essential shear-sliding partition at low computational cost:

```yaml
processes:
  iceflow:
    method: unified
    unified:
      numerics:
        basis_vertical: molho
        Nz: 2
```

**Lagrange** with 4–10 layers is better suited when a more detailed vertical velocity profile is needed (e.g. studies of englacial flow or vertical strain):

```yaml
processes:
  iceflow:
    method: unified
    unified:
      numerics:
        basis_vertical: Lagrange
        Nz: 6   # anywhere from 4 to 10 is typical
```

!!! tip
    Start with MOLHO. Only switch to Lagrange if you have a specific reason to resolve the vertical velocity structure in detail — the added layers increase memory and compute time proportionally.

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
