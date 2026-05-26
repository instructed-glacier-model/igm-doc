# Module `rockflow`

This module extends the ice flow beyond glaciated areas by assigning a constant speed and along-slope flow direction. It is designed to track rock-like particles (using the `particles` module) in both ice-free and ice-covered regions. Particles are either advected at a constant speed (controlled by the parameter `processes.rockflow.speed`) following the steepest gradient of the ice-free terrain in 2D or transported by ice flow in 3D.
## Parameters

Default configuration file ([rockflow.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/rockflow.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/rockflow.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/rockflow.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/rockflow.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}

{{ render_contributors("rockflow") }}
