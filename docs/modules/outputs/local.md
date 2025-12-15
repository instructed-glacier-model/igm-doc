# Module `local`

This IGM module writes 2D field variables defined in the parameter list `vars_to_save` into the NetCDF output file specified by the parameter `output_file` (default: `output.nc`). The saving frequency is determined by the parameter `processes.time.save` defined in the `time` module.

This module depends on `xarray`.

## Parameters

Default configuration file ([local.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/outputs/local.yaml)):
~~~yaml
{% include  "../../../../igm/conf/outputs/local.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/outputs/local.yaml') %}
{% set help = load_yaml('../igm/conf_help/outputs/local.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
