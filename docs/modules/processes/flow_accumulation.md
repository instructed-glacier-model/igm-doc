# Module `flow_accumulation`

This modules uses the calculated ice surface elevation, together with basal topography, to compute the hydraulic potential and hydraulic head and the associated flow accumulation area [@Cohen2023]. For the later, we use the simple subglacial hydrology of the `enthalpy` module.  

This module depends on the [pyshed](https://mattbartos.com/pysheds/) library.

## Parameters

Default configuration file ([flow_accumulation.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/flow_accumulation.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/flow_accumulation.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/flow_accumulation.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/flow_accumulation.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
