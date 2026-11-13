# Module `ocean`

!!! info "Brief summary"

    The `ocean` module maintains the **ocean properties in contact with the ice** — the potential temperature `state.ocean_temp` (°C), the salinity `state.ocean_salinity` (g kg⁻¹) and the thermal forcing `state.ocean_thermal_forcing` (K) — consumed by the sub-shelf melt laws of the `bmb` module. They are evaluated at the ice base under ice and at the sea floor in open water, from a depth profile (`method: profile`) or from 2-D fields provided by an input module (`method: fields`), plus a uniform temperature anomaly in time. The **parameters** of the module are described [here](#parameters).

{{ render_module_io("ocean") }}

## Methods

At every update the module evaluates the selected method at the depth $z$ relative to the water level (negative below it): $z = \min(\mathrm{lsurf} - \mathrm{water\_level},\, 0)$ under ice (the ice base) and $z = \min(\mathrm{topg} - \mathrm{water\_level},\, 0)$ in open water (the sea floor). It then adds the uniform anomaly $\delta T(t)$ of `anomaly_array` (rows `[time, delta_temp]`, interpolated linearly in time and held constant outside the listed times) and publishes

$$
T_o,\qquad S_o,\qquad \mathrm{TF} = T_o - T_f(S_o, z),
$$

with the linearised freezing point $T_f = \lambda_1 S + \lambda_2 + \lambda_3 z$ (`freezing_point`; the defaults are the ISOMIP+ values of Asay-Davis et al., 2016).

- **`profile`** — horizontally uniform, piecewise-linear $T(z)$ and $S(z)$ given by `profile.array` (rows `[z, temp, salinity]`, interpolated linearly in depth and held constant outside the listed depths). The default is the ISOMIP+ WARM profile; the COLD profile is given as a comment in the configuration file.
- **`fields`** — 2-D state variables provided by an input module (e.g. in the `load_ncdf` input file): the temperature named by `fields.temp` and the salinity named by `fields.salinity` (or the uniform `fields.salinity_ref`). When a thermal forcing is given instead (`fields.thermal_forcing`, e.g. from ISMIP6), the temperature is rebuilt as $\mathrm{TF} + T_f(S, z)$, so that the published thermal forcing equals the input plus the anomaly.

Without an ocean (the "no ocean" water level of the `thk` masks) the depth is clipped at 0 and the fields stay finite; no melt law uses them then.

## Module ordering

`ocean` reads the geometry and the water level of the current step, so it runs after the input modules and before `bmb`:

```yaml
override /processes:
  - time
  - ocean
  - iceflow
  - bmb
  - thk
```

## Example usage

A warm-water profile with +1 K of ocean warming over 50 years:

```yaml
# @package _global_

processes:
  ocean:
    method: profile
    profile:
      array:
        - ["z", "temp", "salinity"]
        - [0.0, -1.9, 33.8]
        - [-720.0, 1.0, 34.7]
    anomaly_array:
      - ["time", "delta_temp"]
      - [2000.0, 0.0]
      - [2050.0, 1.0]
```

An ISMIP6 thermal-forcing field read from the input file:

```yaml
processes:
  ocean:
    method: fields
    fields:
      temp: ""
      thermal_forcing: thermal_forcing
      salinity: ""
      salinity_ref: 34.5
```

<!-- REVIEW: cite? Asay-Davis et al. (2016, ISOMIP+ freezing point and profiles): add the entry to refs.bib and
     replace the author-year mention above by a bracketed citation key. -->

## Parameters

The complete default configuration file can be found here: [ocean.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/ocean.yaml).

{% set config = load_yaml('../igm/conf/processes/ocean.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/ocean.yaml') %}
{% set header = load_yaml('../igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_tree.j2" %}

{{ render_contributors("ocean") }}
