# Module `vert_flow`

This IGM module computes the vertical component of the velocity (`state.W`) from the horizontal components (`state.U` and `state.V`). These horizontal components are derived from an emulation of the Blatter-Pattyn model in the `iceflow` module. The computation is performed by integrating the incompressibility condition layer-wise. This module is typically used before invoking the `particle` module for 3D particle trajectory integration or the `enthalpy` module for computing 3D advection-diffusion of enthalpy.

**Contributors:** Guillaume Jouvet, Claire-Mathile Stücki.

## Parameters

Default configuration file ([vert_flow.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/vert_flow.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/vert_flow.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/vert_flow.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/vert_flow.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
