# Module `write_ncdf`

!!! warning "Deprecated"
    Prefer the [`local`](local.md) module, which writes both NetCDF and GeoTIFF through a single interface (via `file_format_list`) and is actively maintained. `write_ncdf` remains functional but will not receive new features.

This IGM module writes 2D field variables specified in the parameter list `vars_to_save` into the NetCDF output file defined by the parameter `output_file` (default: `output.nc`). The saving frequency is determined by the parameter `processes.time.save` in the `time` module.

This module requires the `netCDF4` library.

## Parameters

Default configuration file ([write_ncdf.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/outputs/write_ncdf.yaml)):
~~~yaml
{% include  "../../../../igm/conf/outputs/write_ncdf.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/outputs/write_ncdf.yaml') %}
{% set help = load_yaml('../igm/conf_help/outputs/write_ncdf.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
