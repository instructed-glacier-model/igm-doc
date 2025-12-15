# Module `thk`

This IGM module solves the mass conservation equation for ice to update the thickness based on ice flow (computed by the `iceflow` module) and surface mass balance (provided by any module that updates `smb`). The equation is solved using an explicit first-order upwind finite-volume scheme on the 2D working grid. This scheme allows ice mass to move between cells (where thickness and velocities are defined) using edge-defined fluxes (calculated from depth-averaged velocities and ice thickness in the upwind direction). 

The scheme is mass-conservative and parallelizable due to its fully explicit nature. However, it is subject to a CFL condition, meaning the time step (defined in the `time` module) is constrained by the parameter `processes.time.cfl`. This parameter represents the maximum number of cells crossed in one iteration and cannot exceed one. For more details, refer to the documentation of the `time` module. Additional information about the scheme can be found in the following paper: [@Jouvet2021].

**Contributors:** Guillaume Cordonnier, Guillaume Jouvet.

## Parameters

Default configuration file ([thk.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/thk.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/thk.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/thk.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/thk.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
