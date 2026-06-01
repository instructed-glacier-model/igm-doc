# Module `h_water_till`

This IGM module integrates the **subglacial till water layer** $W$ forward in time using the Tulaczyk (2000) drainage ODE. The melt rate produced by the `enthalpy` module drives water accumulation; a constant drainage term represents groundwater loss. When paired with `effective_pressure` in `mode: till_storage`, the till saturation $s = W / W_{\max}$ controls the basal effective pressure and therefore the sliding speed.

{{ render_module_io("h_water_till") }}

## Physical model

At every time step the module applies:

$$W^{n+1} = \text{clip}\!\left(W^n + \Delta t \left(\frac{\rho_i}{\rho_w}\,\dot{m}_b - d_r\right),\; 0,\; W_{\max}\right)$$

where:

- $\dot{m}_b$ is the basal melt rate (m ice yr⁻¹) from `state.basal_melt_rate`
- $\rho_i / \rho_w$ converts ice melt to water-equivalent volume
- $d_r$ is the constant drainage rate (`drainage_rate`, m water yr⁻¹)
- $W_{\max}$ is the till capacity (`h_water_till_max`, m water)

The result is additionally zeroed where the ice thickness is zero, so ice-free cells always have $W = 0$.

## Module ordering

`h_water_till` must run **after** `enthalpy` so that `state.basal_melt_rate` is up to date, and **before** `effective_pressure` when using `mode: till_storage` so that the saturation field is fresh before the effective-pressure computation:

```yaml
override /processes:
  - time
  - iceflow
  - thk
  - enthalpy
  - arrhenius
  - h_water_till        # after enthalpy, before effective_pressure
  - effective_pressure  # reads state.h_water_till when mode: till_storage
```

## Parameters

Default configuration file ([h_water_till.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/h_water_till.yaml)):

~~~yaml
{% include "../../../../igm/conf/processes/h_water_till.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/h_water_till.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/h_water_till.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}

## Example usage

Till hydrology coupled to Coulomb sliding:

```yaml
# @package _global_

processes:
  enthalpy: {}
  arrhenius: {}
  h_water_till:
    h_water_till_max: 2.0      # m — till capacity
    drainage_rate: 0.001       # m/yr — basal drainage
  effective_pressure:
    mode: till_storage
    till_storage:
      N_ref: 1.0e-3            # MPa
      e_ref: 0.69
      C_c: 0.12
      delta: 0.02
  iceflow:
    physics:
      sliding_law:
        name: coulomb
```

{{ render_contributors("h_water_till") }}
