# Module `bmb`

!!! info "Brief summary"

    The `bmb` module computes the **basal mass balance** `state.bmb` (m ice eq. yr⁻¹, positive for a gain, like `smb`), the basal source term of the thickness equation $\partial_t h + \nabla\cdot(h\,\bar{\mathbf{u}}) = \mathrm{smb} + \mathrm{bmb}$ solved by the `thk` module. Under grounded ice it is minus the thermodynamic basal melt of the `enthalpy` module; under floating ice exposed to the ocean it is minus the **sub-shelf melt rate** of the selected law (`prescribed`, `quadratic`, `pico`, `picop` or `plume`), which reads the ocean properties of the `ocean` module. The **parameters** of the module are described [here](#parameters).

{{ render_module_io("bmb") }}

The module is opt-in: a land-terminated glacier does not need it. With `method: zero` and `include_grounded_melt: true` it only forwards the enthalpy melt (`bmb = -basal_melt_rate`).

## Melt laws

The sub-shelf melt rate $m$ (m ice eq. yr⁻¹, positive for melt) is given by `method`:

- **`zero`** — no ocean melt.
- **`prescribed`** — `prescribed.form` selects a uniform rate (`constant`, `prescribed.value`), a 2-D state variable (`field`, named by `prescribed.field`), or the MISMIP+ Ice1 melt (`mismip_plus`, Asay-Davis et al., 2016): $m = \Omega \tanh(H_c/H_0)\,\max(z_0 - z_d, 0)$, with $H_c$ the water-column thickness and $z_d$ the ice draft.
- **`quadratic`** — the quadratic thermal-forcing law $m = \gamma_0 \left(\frac{\rho_w c_o}{\rho_i L}\right)^2 (\mathrm{TF} + \delta T)\,|\langle \mathrm{TF}\rangle + \delta T|$, with the thermal forcing TF of the `ocean` module at the ice base and $\langle \mathrm{TF}\rangle$ its `averaging`: `local` (TF itself), `shelf` (mean over each ice shelf) or `basin` (mean over the shelves of each basin of the `basins` state variable, the ISMIP6 non-local form of Jourdain et al., 2020). With `water_equivalent: true` (the default) $\gamma_0$ gives a melt in m w.e., as in ISMIP6, converted to ice.
- **`pico`** — the box model of Reese et al. (2018): each ice shelf is divided into up to `n_boxes` boxes by distance from the grounding line, and the ocean water of the continental shelf (bed above `continental_shelf_depth`) is carried box by box with the overturning strength $C$ and the heat-exchange velocity $\gamma_T$; the freezing point is the PICO potential-temperature form $T_f = aS + b - cp$. `reference_distance` sets the grounding-line distance at which a shelf has `n_boxes` boxes (0: the largest distance in the domain), and grounded areas smaller than `maximum_ice_rise_area` are ice rises rather than grounding line.
- **`picop`** — the box properties of PICO with the plume melt of Lazeroms et al. (2018) (Pelle et al., 2019).
- **`plume`** — the buoyant-plume melt of Lazeroms et al. (2019), fed by the ocean properties at the grounding-line depth of each shelf node.

For `picop` and `plume`, the grounding-line depth feeding each shelf node is carried along the ice flow from the grounding line (`grounding_line_depth`, a diffusion-regularized advection solved by Jacobi sweeps), so these two laws need `iceflow` to have run.

The law is evaluated every `update_freq` years (0: every step); the geometry, the grounding-line weights and `bmb` are updated every step. Between two evaluations, a node that has become floating takes the melt of its shelf neighbours at the last evaluation. The result is multiplied by `melt_enhancer`; negative rates (refreezing, e.g. in the outer PICO boxes) are clipped at zero unless `allow_refreezing: true`. With `ocean_connected_only: true` (the default), ocean melt is applied only under floating ice connected, through water, to the open ocean (a domain side with a zero thickness boundary, or else the ice-free water), not over subglacial lakes.

## Grounding line

Across the grounding line the grounded and ocean melts are weighted by the grounded fraction $g$ of each node's cell, estimated from `grounding_line.sub_samples` samples of the bilinear flotation function (published as `state.grounded_fraction`):

$$
\mathrm{bmb} = -\left(g\, m_\mathrm{grounded} + w\, m_\mathrm{ocean}\right) \quad \text{where there is ice, 0 elsewhere,}
$$

with the ocean weight $w$ set by `grounding_line.treatment`: **`nmp`** no ocean melt in the cells crossed by the grounding line, **`fmp`** full ocean melt in every cell containing floating ice (both after Seroussi and Morlighem, 2018), **`pmp`** ocean melt weighted by the floating fraction (Leguy et al., 2021).

## Module ordering

Run `bmb` after `enthalpy` (for the grounded melt), after `ocean` (for the ocean properties), after `iceflow` for `picop` and `plume`, and right before `thk`:

```yaml
override /processes:
  - time
  - ocean
  - iceflow
  - bmb
  - thk
```

## Example usage

ISMIP6-like quadratic melt from an ocean profile, with the melt scaled by the floating fraction near the grounding line:

```yaml
# @package _global_

processes:
  ocean:
    method: profile
  bmb:
    method: quadratic
    quadratic:
      averaging: shelf
      gamma0: 1.4477e+4
    grounding_line:
      treatment: pmp
  thk:
    front:
      method: sub_grid
```

MISMIP+ Ice1 melt, no melt in the grounding-line cells:

```yaml
processes:
  bmb:
    method: prescribed
    prescribed:
      form: mismip_plus
    grounding_line:
      treatment: nmp
```

<!-- REVIEW: cite? Asay-Davis et al. (2016, MISMIP+/ISOMIP+), Jourdain et al. (2020, ISMIP6 melt), Reese et al. (2018, PICO),
     Lazeroms et al. (2018, 2019, plume), Pelle et al. (2019, PICOP), Seroussi and Morlighem (2018), Leguy et al. (2021):
     add the entries to refs.bib and replace the author-year mentions above by bracketed citation keys. -->

## Parameters

The complete default configuration file can be found here: [bmb.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/bmb.yaml).

{% set config = load_yaml('../igm/conf/processes/bmb.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/bmb.yaml') %}
{% set header = load_yaml('../igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_tree.j2" %}

{{ render_contributors("bmb") }}
