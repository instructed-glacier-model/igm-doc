# Module `calving_rate`

!!! info "Brief summary"

    The `calving_rate` module computes the **lateral ablation rate at a marine or lacustrine ice front**: the calving rate `state.calving_rate` $c$ and the frontal melt rate `state.frontal_melt_rate` $m_\mathrm{cf}$ (both m yr⁻¹, ≥ 0). They are consumed by the calving front of the `thk` module (`thk.front.method`), which moves the front, normal to itself, at $u_\mathrm{cf} = \mathbf{u}\cdot\mathbf{n} - c - m_\mathrm{cf}$. The **parameters** of the module are described [here](#parameters).

{{ render_module_io("calving_rate") }}

Rules that prescribe the front *position* rather than a rate — a minimum front thickness, a fixed front — are options of the front itself (`thk.front.min_thickness`, `thk.front.fixed`), not of this module.

## Calving laws

The calving rate $c$ is given by `law`:

| Law | Rate | Reference |
|-----|------|-----------|
| `zero` | $c = 0$ | — |
| `constant` | $c = $ `constant.value` | — |
| `water_depth` | $c = k\,\max(z_\mathrm{wl} - z_\mathrm{b}, 0)$, with $k$ = `water_depth.k` and $z_\mathrm{wl} - z_\mathrm{b}$ the water depth at the front | Brown et al. (1982) |
| `eigen` | $c = K\,\max(\dot\varepsilon_1, 0)\,\max(\dot\varepsilon_2, 0)$ on floating ice, with $\dot\varepsilon_{1,2}$ the principal strain rates and $K$ = `eigen.K` | Levermann et al. (2012) |
| `von_mises` | $c = \lvert\mathbf{u}\rvert\,\sigma / \sigma_\max$, with the tensile von Mises stress $\sigma = \sqrt{3}\,B\,\dot\varepsilon_\mathrm{e}^{1/n}$ and $\sigma_\max$ = `von_mises.sigma_max_floating` or `sigma_max_grounded` | Morlighem et al. (2016) |
| `ice_speed` | $c = \max(f\,\lvert\mathbf{u}\rvert - W, 0)$, with $f$ = `ice_speed.factor` and $W$ = `ice_speed.front_velocity` the prescribed front velocity relative to the grid ($W = 0$: a stationary front; $W > 0$ an advance, $W < 0$ a retreat) | CalvingMIP-style |

The `water_depth` law is a tidewater-glacier law applied wherever the front stands, floating ice included (on a uniform bed it is then the constant law). For `von_mises`, the hardness $B = A^{-1/n}$ uses the ice-flow rate factor `arrhenius` and exponent, and $\lvert\mathbf{u}\rvert$ is the ice speed at the last ice node, as in PISM and ISSM. The `eigen` rate is zero on grounded ice.

A law is evaluated on the ice nodes that carry velocity and carried to the other cells of the **front band** (within `band` cells of the front, on both sides) by the mean over their neighbours; the principal strain rates use one-sided differences that do not cross the front. The `ice_speed` law, which prescribes the front velocity relative to the ice at the front, is instead evaluated on the whole band with the ice speed at the front. The rate is zero outside the band, on land, and — with `ocean_connected_only: true` — at ice fronts not facing the open ocean (holes and rifts enclosed in a shelf do not calve); it is capped at `max_rate`.

## Frontal melt

`frontal_melt.method` adds a frontal (submarine) melt rate $m_\mathrm{cf}$ to the calving rate: `none`, `constant` (`frontal_melt.value`) or `field` (the state variable named by `frontal_melt.field`).

## Module ordering

The `time` module includes $c + m_\mathrm{cf}$ in its CFL condition. Run `calving_rate` after `iceflow` and before `time` and `thk`:

```yaml
override /processes:
  - iceflow
  - calving_rate
  - time
  - thk
```

## Example usage

Von Mises calving on a sub-grid front:

```yaml
# @package _global_

processes:
  calving_rate:
    law: von_mises
    von_mises:
      sigma_max_floating: 0.15   # MPa
      sigma_max_grounded: 1.0    # MPa
  thk:
    front:
      method: sub_grid
```

A prescribed front retreat of 500 m yr⁻¹:

```yaml
processes:
  calving_rate:
    law: ice_speed
    ice_speed:
      front_velocity: -500.0     # m/yr
```

<!-- REVIEW: cite? Brown et al. (1982), Levermann et al. (2012, eigencalving), Morlighem et al. (2016, von Mises):
     add the entries to refs.bib and replace the author-year mentions above by bracketed citation keys. -->

## Parameters

The complete default configuration file can be found here: [calving_rate.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/calving_rate.yaml).

{% set config = load_yaml('../igm/conf/processes/calving_rate.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/calving_rate.yaml') %}
{% set header = load_yaml('../igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_tree.j2" %}

{{ render_contributors("calving_rate") }}
