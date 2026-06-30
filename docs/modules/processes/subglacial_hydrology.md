# Module `subglacial_hydrology`

This IGM module is the single source of truth for subglacial hydrology. It computes and maintains `state.effective_pressure` (MPa) — the basal effective pressure $N = p_i - p_w$ consumed by the Budd, regularized Coulomb, and Mohr-Coulomb sliding laws — and, when `mode: till_storage` is selected, also evolves the **subglacial till water layer** $W$ (`state.h_water_till`, m water) forward in time.

{{ render_module_io("subglacial_hydrology") }}

The module is opt-in. If the only sliding law in use is Weertman, $N$ cancels out of the cost and the module should not be activated. Conversely, when Budd, regularized Coulomb, or Mohr-Coulomb is active, `subglacial_hydrology` is required — the iceflow energy validator refuses to run without `effective_pressure` in its input list.

## Closure modes

The `mode` parameter selects how $N$ is computed at each update:

- **`constant_one`** — $N = 1$ MPa everywhere. Useful as a sanity check, or to recover Weertman-like behaviour with the Budd cost when paired with `N_ref = 1`.
- **`percentage`** — $N = (1 - \texttt{percentage}) \cdot \rho_i\, g\, h$. A fixed fraction of the ice-overburden pressure.
- **`ocean_connected`** — $N = \rho_i g h - \rho_w g \max(w - b,\, 0)$, where $w$ is the local water level (`state.water_level`) and $b$ is the bedrock elevation (`state.topg`). Assumes the basal hydraulic system is connected to the ocean / proglacial water body. Recommended for marine / tidewater settings. Requires `state.water_level` — see the `local` and `load_ncdf` input modules.
- **`from_input`** — leave `state.effective_pressure` as it was loaded from the input data (e.g. an inversion product). The module acts as a pass-through.
- **`till_storage`** — full Tulaczyk till hydrology: evolves `state.h_water_till` each time step and derives $N$ from the resulting saturation. See the physical model below. Requires `enthalpy` to run before `subglacial_hydrology`.

After the chosen formula, $N$ is clamped from below by `N_min` (default 1 kPa) to avoid the singularity in the sliding-law cost when $N \to 0$.

## Physical model (`mode: till_storage`)

At every time step the module first integrates the till water ODE:

$$W^{n+1} = \text{clip}\!\left(W^n + \Delta t \left(\frac{\rho_i}{\rho_w}\,\dot{m}_b - d_r\right),\; 0,\; W_{\max}\right)$$

where $\dot{m}_b$ is the basal melt rate (m ice yr⁻¹) from `state.basal_melt_rate`, $\rho_i / \rho_w$ converts ice melt to water-equivalent volume, $d_r$ is the constant drainage rate (`till_storage.drainage_rate`), and $W_{\max}$ is the till capacity (`till_storage.h_water_till_max`). The result is zeroed where ice thickness is zero.

The saturation $s = W / W_{\max}$ then drives the Tulaczyk (2000) effective-pressure parameterisation:

$$N = \min\!\left(p_i,\; N_\text{ref} \left(\frac{\delta\, p_i}{N_\text{ref}}\right)^s \cdot 10^{e_\text{ref}(1-s)/C_c}\right)$$

## Unit convention

$N$ is stored in **MPa** to match the rest of the iceflow stress quantities (`slidingco`, viscosity costs, surface stress). Literature reference values for $N_\text{ref}$ are typically $\mathcal{O}(1\,\text{MPa})$ — see [@Brondex2019], [@Pollard2012], [@Pattyn2017].

## Module ordering

`subglacial_hydrology` must run **before** `iceflow` so that `state.effective_pressure` is up to date when the sliding cost is assembled. When `mode: ocean_connected` is used it must also run after the input module that created `state.water_level`. When `mode: till_storage` is used it must run **after** `enthalpy` so that `state.basal_melt_rate` is fresh:

```yaml
override /processes:
  - time
  - iceflow
  - thk
  - enthalpy           # provides state.basal_melt_rate (needed for till_storage)
  - arrhenius
  - subglacial_hydrology   # after enthalpy, before iceflow
```

## Parameters

Default configuration file ([subglacial_hydrology.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/subglacial_hydrology.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/subglacial_hydrology.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/subglacial_hydrology.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/subglacial_hydrology.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_tree.j2" %}

## Example usage

### Ocean-connected basal pressure with Budd sliding

```yaml
# @package _global_

inputs:
  local:
    filename: input.nc
    water_level:
      include: True
      value: 0.0          # uniform sea level at 0 m

processes:
  subglacial_hydrology:
    mode: ocean_connected
    N_min: 1.0e-3
  iceflow:
    physics:
      sliding:
        law: budd
        N_ref: 1.0      # MPa
        q_exponent: 1.0
  thk: {}
  time:
    start: 2000.0
    end: 2100.0
    save: 5.0
```

### Till hydrology with Mohr-Coulomb sliding

```yaml
# @package _global_

processes:
  enthalpy: {}
  arrhenius: {}
  subglacial_hydrology:
    mode: till_storage
    till_storage:
      h_water_till_max: 2.0      # m — till capacity
      drainage_rate: 0.001       # m/yr — basal drainage
      N_ref: 1.0e-3              # MPa
      e_ref: 0.69
      C_c: 0.12
      delta: 0.02
  iceflow:
    physics:
      sliding:
        law: mohr_coulomb
```

Or override on the command line:

```bash
igm_run +experiment/params processes.subglacial_hydrology.mode=percentage processes.subglacial_hydrology.percentage=0.96
```

{{ render_contributors("subglacial_hydrology") }}
