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

The `iceflow` module supports four modes:

| Mode | Description | When to use |
|---|---|---|
| `emulated` | Pre-trained neural network (fast) | Standard forward simulations |
| `solved` | Direct energy minimisation (accurate) | Benchmarking, small domains |
| `unified` | Emulated + periodic re-training | Long runs where flow evolves significantly |
| `diagnostic` | Single velocity solve, no time loop | Checking initial state |

The emulated solver is orders of magnitude faster than the direct solver. For most applications it is accurate enough, but it is good practice to validate it against `solved` for at least one short test case.

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

The vertical profile of the ice velocity is expanded in a set of basis functions (Lagrange, Legendre, MOLHO, or SSA). For most alpine glaciers the default **Lagrange** discretisation with a modest number of layers (`nz ≈ 10–20`) is sufficient. SSA (depth-averaged) is the cheapest option and appropriate when shear deformation is small relative to sliding.

---

## Data assimilation and inversion

- Always check the cost function convergence. Residuals should decrease monotonically (at least on average).
- Use regularisation (`regu_arrhenius`, `regu_slidingco`) to avoid over-fitting noisy observations.
- A small number of inversion steps (`niter`) is usually sufficient for a good initialisation; the forward run is more sensitive to the initial conditions than to the exact inversion accuracy.

---

## GPU memory

GPU memory is the most common bottleneck on large domains. If you run out of memory:

1. Reduce grid resolution.
2. Reduce `nz` (vertical layers).
3. Reduce `nbit` (fewer iceflow iterations).
4. Enable patching (`iceflow.patching: True`) to split the domain into subgrids — this caps memory per training step at the cost of slightly more training time.

---

## Reproducibility of random initialisation

The emulated iceflow solver initialises its neural-network weights randomly. For reproducible results, set a fixed random seed:

```yaml
processes:
  iceflow:
    seed: 42
```
