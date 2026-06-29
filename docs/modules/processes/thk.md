# Module `thk`

This IGM module solves the mass conservation equation for ice to update the thickness based on ice flow (computed by the `iceflow` module) and surface mass balance (provided by any module that updates `smb`). The equation is solved using an explicit upwind finite-volume scheme on the 2D working grid. Ice transport is computed from edge-defined fluxes derived from depth-averaged velocities and ice thickness in the upwind direction. To reduce numerical diffusion while preserving monotonicity, a piecewise-linear reconstruction of the ice thickness at cell edges is performed using the **Superbee slope limiter** [@Roe1986], which satisfies the total variation diminishing property.

The scheme is mass-conservative and parallelizable due to its fully explicit nature. However, it is subject to a CFL condition, meaning the time step (defined in the `time` module) is constrained by the parameter `processes.time.cfl`. This parameter represents the maximum number of cells crossed in one iteration and cannot exceed one. For more details, refer to the documentation of the `time` module. Additional information about the scheme can be found in the following paper: [@Jouvet2021].
{{ render_module_io("thk") }}

## Parameters

~~~yaml
thk:

  slope_type: superbee                 # limiter used in stock mode (calving_front: false)
  ratio_density: 0.910                 # rho_ice / rho_water for flotation
~~~

{% set config = load_yaml('../igm/conf/processes/thk.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/thk.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set full_module = config[module_key] %}
{% set module = {'slope_type': full_module.slope_type, 'ratio_density': full_module.ratio_density} %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}

{{ render_contributors("thk") }}
