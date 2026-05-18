# Module `effective_pressure`

This IGM module computes and maintains `state.effective_pressure` (in MPa), the basal effective pressure $N = p_i - p_w$ consumed by the Budd and Coulomb sliding laws of the `iceflow` module (read as `fieldin["effective_pressure"]`). It is the single source of truth for $N$: when active, it overrides any prior value of `state.effective_pressure` at every update.

{{ render_module_io("effective_pressure") }}

The module is opt-in. If the only sliding law in use is Weertman, $N$ cancels out of the cost and the module should not be activated. Conversely, when Budd or Coulomb is active, `effective_pressure` is required — the iceflow energy validator refuses to run without it.

## Closure modes

The `mode` parameter selects how $N$ is computed at each update:

- **`constant_one`** — $N = 1$ MPa everywhere. Useful as a sanity check, or to recover a Weertman-like behaviour with the Budd cost when paired with `N_ref = 1`.
- **`percentage`** — $N = (1 - \texttt{percentage}) \cdot \rho_i\, g\, h$. A fixed fraction of the ice-overburden pressure (the legacy IGM behaviour).
- **`ocean_connected`** — $N = \rho_i g h - \rho_w g \max(w - b,\, 0)$, where $w$ is the local water level (`state.water_level`) and $b$ is the bedrock elevation (`state.topg`). This assumes the basal hydraulic system is connected to the ocean / proglacial water body and is the recommended mode for marine / tidewater settings. Requires `state.water_level` to be defined — see the `local` and `load_ncdf` input modules.
- **`from_input`** — leave `state.effective_pressure` as it was loaded from the input data (e.g. an inversion product). The module then acts as a pass-through that keeps the field on state but does not modify it.

After the chosen formula, $N$ is clamped from below by `N_min` (default 1 kPa) to avoid the singularity in the sliding-law cost when $N \to 0$.

## Unit convention

$N$ is stored in **MPa** to match the rest of the iceflow stress quantities (`slidingco`, viscosity costs, surface stress). Literature reference values for $N_\text{ref}$ are typically $\mathcal{O}(1\,\text{MPa})$ — see [@Brondex2019], [@Pollard2012], [@Pattyn2017].

## Module ordering

`effective_pressure` must run before `iceflow` so that the field is up to date when the sliding cost is assembled. When `mode: ocean_connected` is used, it must also run after whichever input module created `state.water_level` (typically the `local` or `load_ncdf` input phase, which runs before any process).

**Contributors:** IGM authors.

## Parameters

Default configuration file ([effective_pressure.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/effective_pressure.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/effective_pressure.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/effective_pressure.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/effective_pressure.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}

## Example usage

Marine glacier with ocean-connected basal pressure, paired with a Budd sliding law:

```yaml
# @package _global_

inputs:
  local:
    filename: input.nc
    water_level:
      include: True
      value: 0.0          # uniform sea level at 0 m

processes:
  effective_pressure:
    mode: ocean_connected
    N_min: 1.0e-3
  iceflow:
    physics:
      sliding_law:
        name: budd
        budd:
          N_ref: 1.0      # MPa
          q_exponent: 1.0
  thk: {}
  time:
    start: 2000.0
    end: 2100.0
    save: 5.0
```

Or override on the command line:

```bash
igm_run +experiment/params processes.effective_pressure.mode=percentage processes.effective_pressure.percentage=0.96
```
