# Module `time_relaxation`

!!! info "Brief summary"
    The `time_relaxation` module performs **data assimilation by forward time relaxation**.
    It runs an inner forward simulation (typically `iceflow`) in which one or more
    **control fields** — such as the surface mass balance, basal sliding coefficient,
    bed topography, or ice thickness — are nudged at each time step so that the modelled
    state converges toward observations. The entire inner loop runs inside `initialize()`;
    once it returns, the outer IGM loop is signalled to exit, so `time_relaxation`
    *replaces* the usual `time` module rather than running alongside it.

    The driver is fully generic: a relaxation run is described as a list of independent
    **steps**, each step being an orthogonal triple `(residual, update law, control)`
    with optional modifiers. The same driver, with different parameters, reproduces
    several classical relaxation methods used in glacier and ice-sheet modelling.

    The **parameters** of the module are described [here](#parameters).

{{ render_module_io("time_relaxation") }}

## Physical model

The forward dynamics solved at every iteration is the standard mass-conservation equation for ice thickness $h$:

$$\frac{\partial h}{\partial t} \;+\; \nabla\cdot(\bar{\mathbf u}\,h) \;=\; \mathrm{SMB},$$

where $\bar{\mathbf u}$ is the depth-averaged velocity (from the `iceflow` solver), $\mathrm{SMB}$ is the surface mass balance, and $\nabla\cdot(\bar{\mathbf u} h)$ is the flux divergence (`divflux`).

**Time-relaxation data assimilation** modifies this forward simulation by *nudging* one or more **control fields** $C \in \{\mathrm{SMB},\, h,\, z_b,\, z_s,\, C_{\text{slid}}, \dots\}$ so that a **residual** $r$ between modelled and observed quantities is driven toward zero:

$$C^{n+1} = \Phi\bigl(C^n,\; r,\; \alpha,\; \Delta t\bigr)$$

with four built-in choices for the update law $\Phi$:

$$\begin{aligned}
\text{additive:}              \quad & C \leftarrow C + \alpha\, r\, \Delta t \\
\text{multiplicative:}        \quad & C \leftarrow C \exp(\alpha\, r\, \Delta t) \quad\text{(exact ODE integral)} \\
\text{multiplicative\_linear:}\quad & C \leftarrow C \,(1 + \alpha\, r\, \Delta t) \quad\text{(linearised)} \\
\text{replace:}               \quad & C \leftarrow \alpha\, r \quad\text{(absolute write; } \Delta t \text{ ignored)}
\end{aligned}$$

and three built-in residual forms:

$$\begin{aligned}
\text{linear:}     \quad & r = T - M \\
\text{relative:}   \quad & r = (T - M) / \max(|T|, \varepsilon) \\
\text{log\_ratio:} \quad & r = \log\!\bigl(\max(M,\varepsilon)/\max(T,\varepsilon)\bigr)
\end{aligned}$$

where $T$ is the *target* (observed) state field and $M$ is the *current* (modelled) state field.

## Numerical set-up

### Inner loop structure

Each iteration proceeds as:

```
1. pre_processes.update          (e.g. effective_pressure, smb)
2. forward_model.update          (default: iceflow)
3. ensure derived fields         (velsurf_mag, divflux, amb)
4. advance time                  (CFL-limited dt + save-time alignment)
5. for each due step:
       r = residual(state)
       r = smooth(r * mask) if smoother active
       C_new = update_law(C, r, alpha, dt_eff)
       C_new = clip(C_new, bounds, floor_at, ceil_at, outside_mask)
       apply geometry_policy if writing thk/topg/usurf
6. post_processes.update         (e.g. thk for mass conservation)
7. snapshot                      (output hooks + misfit CSV)
```

`pre_processes` produce fields the forward model reads (effective pressure, SMB); `post_processes` consume the controls just written and use the save-aligned `state.dt` (typically `thk` for mass conservation when steps wrote `smb`).

### Time stepping

The time step is CFL-limited whenever any step or post-process module evolves a geometry field (`thk`, `topg`, or `usurf`). Otherwise it uses the user-specified maximum `time.step`. Save times are aligned so that `state.dt` is adjusted to land exactly on multiples of `time.save`.

### Step schema

Each step is an independent `(residual, update, control)` triple with optional modifiers:

| Component | Options |
|---|---|
| `residual.kind` | `linear` $r = T-M$ · `relative` $r = (T-M)/\max(\lvert T\rvert, \varepsilon)$ · `log_ratio` $r = \log(\max(M,\varepsilon)/\max(T,\varepsilon))$ |
| `update.kind` | `additive` · `multiplicative` · `multiplicative_linear` · `replace` |
| `update.apply` | `per_step` (uses `state.dt`) · `per_application` (uses $\Delta t = 1$; default when `cadence > 0`) |
| `control.field` | any state attribute (`smb`, `slidingco`, `topg`, `thk`, `usurf`, ...) |
| `geometry_policy` | `none` · `recompute_usurf` ($z_s = z_b + h$) · `recompute_topg` ($z_b = z_s - h$, then $h$ re-clipped) |

The control field can be *anything* on `state` that the forward model reads — typically `smb`, `slidingco`, `topg`, `thk`, or `usurf`. The driver itself is identical across all methods; only the YAML changes.

Each step has the mandatory pieces (`residual`, `update`, `control`, plus a `name`) and an arbitrary number of optional modifiers. None are needed for the simplest cases; each is added when a real method demands it:

| Modifier | What it solves |
|---|---|
| `mask: <state attr>` | apply only on the icemask (or a derived mask) — zero residual elsewhere |
| `cadence: <years>` | apply only every N years (typical for friction inversions on a slow clock) |
| `start_time` / `end_time` | activate the step only during a time window (e.g. start friction at $t = 10$ yr after geometry has stabilised) |
| `update.r_max` | clip the residual to a stable range — prevents large steps in noisy regions |
| `update.apply: per_step \| per_application` | $\Delta t =$ outer-loop dt vs. $\Delta t = 1$ — selects whether $\alpha$ is a per-time rate or a per-application gain |
| `smoother.sigma` | mask-aware Gaussian low-pass on the residual — useful when the observation is noisy (e.g. velocity log-ratio for friction inversions) |
| `control.bounds: [lo, hi]` | scalar clip on the resulting control |
| `control.floor_at` / `ceil_at: <state attr>` | per-pixel clip against another state field — e.g. `floor_at: topg` enforces $z_s \geq z_b$ |
| `control.outside_mask: <c>` | constant fill outside the mask (legacy `out_of_mass_smb = -10`) |
| `geometry_policy` | when the control is one of `(thk, topg, usurf)`: how to restore $z_s = z_b + h$ after writing one of them |
| `shares_residual_with: <other step>` | reuse a residual already computed by another step (saves recomputing `divflux` or `velsurf_mag`) |

Steps are independent: a single config can run **several steps in parallel** in the same time loop — typically a geometry-inversion step plus a friction-inversion step — sharing the time clock and the forward-model call. Two steps can share a residual via `shares_residual_with` so the divergence (or velocity, etc.) is computed only once per iteration.

### Derived fields

At every iteration, `time_relaxation` recomputes:

- `state.velsurf_mag` from `uvelsurf` and `vvelsurf` (if present)
- `state.divflux` from `ubar`, `vbar`, and `thk` (if present)
- `state.amb = state.smb − state.dhdt_obs` (apparent mass balance, masked by `icemask`; requires an SMB module in `pre_processes` and a `dhdt` field in the input NetCDF)

## Module ordering

`time_relaxation` must appear in the `assimilations` list. It initialises the forward model (`iceflow` by default) and any auxiliary modules internally, so these must also be listed in `processes` for Hydra to load their configs:

```yaml
defaults:
  - override /processes:
    - iceflow
  - override /assimilations:
    - time_relaxation
```

### Observation snapshots

At startup, the module snapshots standard observation fields if they are not already on state: `usurf_obs`, `thk_obs`, `dhdt_obs`, and `velsurf_magobs`. This allows residuals like `usurf_obs − usurf` to work without explicit preparation.

## Recovering classical methods

Because each step is an orthogonal `(residual, update, control)` triple, the same generic driver reproduces a range of classical **relaxation / nudging** data-assimilation methods used in glacier and ice-sheet modelling — each obtained by changing only the YAML, with no code change. For example:

- **Apparent-mass-balance bed inversion** (Frank & van Pelt, 2025) — perturb thickness and surface elevation jointly to drive the flux divergence toward the apparent mass balance (*detailed [below](#apparent-mass-balance-bed-inversion-frank-van-pelt-2025)*).
- **Surface-mass-balance force-to-thickness** (PISM) — drift `smb` (update `replace`) so that ice thickness relaxes toward a target; a `post_processes: [thk]` mass-conservation step performs the actual relaxation, giving the closed form $H(t) = H_\text{target} + (H_0 - H_\text{target})\exp(-\alpha t)$. 
- **Sliding-coefficient inversion to surface elevation** (Pollard & DeConto, 2012) — nudge the basal sliding coefficient from the surface-elevation misfit ($r = z_s^\text{obs} - z_s$).
- **Sliding-coefficient inversion to ice thickness** (Pattyn, 2017) — iteratively adjust the basal sliding coefficient to minimise the modelled–observed ice-thickness misfit at steady state.
- **Sliding-coefficient inversion to surface velocity** (Le clec'h et al., 2019) — nudge `slidingco` from the relative surface-velocity mismatch, e.g. multiply by $(1 + \mathrm{clip}(r))$ with $\alpha = -1$.

Several steps can run together in the same time loop — for instance a bed inversion (two steps writing `thk` and `usurf`) plus a friction-inversion step writing `slidingco`, all sharing the time clock and the same `iceflow` solve.

We detail one fully worked example — the apparent-mass-balance bed inversion of Frank & van Pelt — below.

### Apparent-mass-balance bed inversion (Frank & van Pelt, 2025)

Drive the flux divergence toward `amb = smb − dhdt_obs` by perturbing thickness and surface elevation jointly. Two geometry steps share one residual (`shares_residual_with`): `amb_thk` writes `thk` with gain $\beta$, and `amb_usurf` writes `usurf` with gain $\theta\beta$ (see the [example below](#apparent-mass-balance-bed-inversion)). The target `amb` is recomputed every iteration by `_ensure_derived` as `state.amb = state.smb − state.dhdt_obs` (masked by `icemask`), with `state.dhdt_obs` snapshotted from the input `dhdt` field at startup. The legacy combined parameter $\theta$ is no longer a free knob — it is simply the ratio `alpha_usurf / alpha_thk`.


```yaml
defaults:
  - override /processes:
    - iceflow
    - smb
  - override /assimilations:
    - time_relaxation

processes:
  smb:
    method: simple
    simple:
      update_freq: 1.0
      array:
        - ["time", "gradabl", "gradacc", "ela", "accmax"]
        - [0, 0.007, 0.004, 3050, 2.0]

assimilations:
  time_relaxation:
    forward_model: iceflow
    pre_processes: [smb]
    time:
      start: 0.0
      end: 100.0
      step: 1.0
      save: 10.0
      cfl: 0.3
    steps:
      - name: amb_thk
        residual: { kind: linear, target: amb, current: divflux }
        update:   { kind: additive, alpha: 0.138 }
        control:  { field: thk, bounds: [0.0, 2000.0] }
        mask: icemask
        geometry_policy: recompute_topg

      - name: amb_usurf
        shares_residual_with: amb_thk
        residual: { kind: linear, target: amb, current: divflux }
        update:   { kind: additive, alpha: 0.0422 }
        control:  { field: usurf, floor_at: topg }
        mask: icemask
        geometry_policy: recompute_topg
    outputs:
      misfits:
        path: misfits.csv
        track:
          - { step: amb_thk, kind: rmse }
```

## Diagnostics

A CSV log of step-level residual norms (`rmse` or `mae`) is written at every save time when `outputs.misfits.path` is set. Standard IGM output modules (`write_ncdf`, `write_ts`, `write_vtp`) are also called at every save time inside the inner loop.

<!-- REVIEW CHECKLIST — sections a complete physics/PDE module page usually has,
     not generated because the source did not ground them:
     - Practical guidance: advice on choosing alpha values, cadence settings,
       smoother sigma, and convergence diagnostics for typical inversions.
     - Coupling with iceflow: details on how the forward model instance is shared
       and what iceflow settings (e.g. vertical_velocity) affect the relaxation.
     Fill these in or delete this block. -->

## Parameters

The complete default configuration file can be found here: [time_relaxation.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/assimilations/time_relaxation.yaml).

{% set config = load_yaml('../igm/conf/assimilations/time_relaxation.yaml') %}
{% set help = load_yaml('../igm/conf_help/assimilations/time_relaxation.yaml') %}
{% set header = load_yaml('../igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_tree.j2" %}

{{ render_contributors("time_relaxation") }}
