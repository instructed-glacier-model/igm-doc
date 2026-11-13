# Module `thk`

!!! info "Brief summary"

    The `thk` module solves the **mass conservation equation** $\partial_t h + \nabla\cdot(h\,\bar{\mathbf{u}}) = \mathrm{smb} + \mathrm{bmb}$ to update the ice thickness `thk` from the depth-averaged velocity of the `iceflow` module and the mass balances of the `smb` (and, for marine glaciers, `bmb`) modules, and recomputes the surfaces `usurf` and `lsurf` with flotation. The transport is solved by an explicit slope-limited finite-volume scheme [@Jouvet2021] (the default) or by the alternative schemes below; for marine- and lake-terminated glaciers it can track a **calving front** at sub-grid scale. The **parameters** of the module are described [here](#parameters).

{{ render_module_io("thk") }}

## Transport schemes

The scheme is selected by `scheme`:

- **`explicit`** (default) — explicit upwind finite volumes on the 2D grid. Edge fluxes are computed from the depth-averaged velocity and the upwind thickness, with a piecewise-linear reconstruction of the thickness at the cell edges by the **Superbee slope limiter** [@Roe1986] (`slope_type`: `superbee`, `minmod` or `godunov`), which keeps the scheme monotone (total variation diminishing). The scheme is mass-conservative and fully parallel, but subject to a CFL condition: the time step of the `time` module is bounded by `processes.time.cfl`, the maximum number of cells crossed in one step. With `divflux_smooth_sigma > 0` the staggered fluxes are Gaussian-filtered before the divergence (conservative flux smoothing).
- **`ffsl`** — conservative, monotone flux-form semi-Lagrangian transport with swept fluxes, which allows arbitrary CFL numbers; internal substeps are controlled by the velocity deformation (`ffsl.max_deformation`, `ffsl.max_substeps`, `ffsl.limit_policy`).
- **`implicit`** — the diffusive first-order upwind theta method in 2D (`implicit.theta`: 1 backward Euler, 0.5 Crank–Nicolson), solved by a matrix-free, Jacobi-preconditioned BiCGSTAB (`implicit.solver`).
- **`implicit_x`** — independent x-flowlines solved directly with one batched tridiagonal solve, without y transport.

The schemes `ffsl`, `implicit` and `implicit_x` are opt-in; `adi` is an experimental alternating-direction method.

## Domain and boundaries

`boundary.{left,right,top,bottom}` set the transport boundary of each side of the grid: `zero` (alias `open`, zero exterior ice, outflow permitted), `symmetric` (aliases `closed`, `no_flux`, `reflective`), `dirichlet` (alias `inflow`, the exterior thickness held at the initial thickness of the edge cells, so that ice enters with the edge velocity) or `periodic` (paired sides). The explicit scheme and the calving fronts support `zero`, `symmetric` and `dirichlet`; FFSL and implicit support `zero`, `symmetric` and `periodic`; `implicit_x` supports `zero` and `symmetric` in x.

`domain.constraints` restricts the active cells (e.g. `grounded`, `initial_ice`, `interior`, `state_mask`); internal faces between active and inactive cells carry zero flux.

With `remove_rigid_body_modes: true`, floating ice without a mechanical anchor to grounded ice (icebergs, i.e. ice not connected through full cells to a cell with a grounded corner) is removed after every update and once at initialization, because its velocity is not determined by the force balance. Grounded ice is never removed; the removed ice is counted in `calved_thk`.

## Flotation

The lower surface is $\mathrm{lsurf} = \max(\mathrm{topg},\ \mathrm{water\_level} - h\,\rho_\mathrm{i}/\rho_\mathrm{w})$ with the density ratio `ratio_density`, and $\mathrm{usurf} = \mathrm{lsurf} + h$; ice is grounded where its base rests on the bed. The water level `water_level` (sea or lake level) is read from the input; without an ocean it takes a "no ocean" default and all ice is grounded.

## Calving front

For marine and lake termini, `front.method` tracks the position of the calving front within the grid cells, so that the front stays sharp instead of spreading over the ocean as a thin diffusive tongue:

- **`none`** (default) — the front is left to the transport scheme.
- **`sub_grid`** — the front is tracked from the volume of the partial cells, after Albrecht et al. (2011) as in PISM: ice flowing into an ice-free cell next to the front accumulates in a reservoir `Href` until the cell is full; the cell then joins the ice at the full thickness and the residual volume is redistributed to its ice-free neighbours (`sub_grid.residual: redistribute`, up to `sub_grid.max_iterations` passes) or discarded (`discard`, counted in `calved_thk`).
- **`level_set`** — the front is tracked by a level-set function `psi` advected at $\mathbf{u} - (c + m_\mathrm{cf})\,\mathbf{n}$ (after Bondzio et al., 2016), with the ice following it exactly (mass-consistent); the function is re-distanced every `level_set.reinit_freq` steps, and the ice velocity is extended `level_set.band` cells beyond the ice.

In both methods `thk` is the physical thickness seen by the ice flow: the stress-balance front is sharp on the boundary of full cells, while the partial cells keep their volume in `Href` and their fill fraction in `ice_area_fraction`. The thickness a filling cell takes is given by `front.threshold`: `flux` (from the flux into it, i.e. thickness continuity) or `mean` (the mean of its neighbours, as in PISM). `front.first_order` uses first-order upwind fluxes out of the cells next to the front (Albrecht et al., 2011, Eq. 2).

The calving rate $c$ and the frontal melt rate $m_\mathrm{cf}$ come from the [`calving_rate`](calving_rate.md) module. Two rules prescribe the front position directly: `front.min_thickness` calves floating front cells thinner than this (the thickness rule of Albrecht et al., 2011, and PISM's `thickness_calving`), and `front.fixed` keeps the front from advancing beyond its initial position. The calved volume is accumulated in `calved_thk`. Both methods require `scheme: explicit` and no active-domain constraints.

## Module ordering

`thk` runs after `iceflow` (and after `smb`, `bmb` and `calving_rate` when used) and before `time` advances; the usual order is `[time, smb, iceflow, thk]`, or for a marine glacier `[time, ocean, iceflow, calving_rate, bmb, thk]`.

## Example usage

A marine glacier with a sub-grid front, minimum front thickness and icebergs removed:

```yaml
# @package _global_

processes:
  thk:
    front:
      method: sub_grid
      min_thickness: 50.0      # m
    remove_rigid_body_modes: true
  calving_rate:
    law: water_depth
    water_depth:
      k: 2.0                   # 1/yr
```

<!-- REVIEW: cite? Albrecht et al. (2011, sub-grid front), Bondzio et al. (2016, level set): add the entries to refs.bib
     and replace the author-year mentions above by bracketed citation keys. -->

## Parameters

The complete default configuration file can be found here: [thk.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/thk.yaml).

{% set config = load_yaml('../igm/conf/processes/thk.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/thk.yaml') %}
{% set header = load_yaml('../igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_tree.j2" %}

{{ render_contributors("thk") }}
