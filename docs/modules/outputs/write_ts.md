# Module `write_ts`

This module writes time series variables, such as ice-glaciated area and volume, into the NetCDF output file specified by the `output_file` parameter (default: `output_ts.nc`). The saving frequency is determined by the `processes.time.save` parameter defined in the `time` module.

## Parameters

Default configuration file ([write_ts.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/outputs/write_ts.yaml)):
~~~yaml
{% include  "../../../../igm/conf/outputs/write_ts.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/outputs/write_ts.yaml') %}
{% set help = load_yaml('../igm/conf_help/outputs/write_ts.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
