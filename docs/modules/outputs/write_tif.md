# Module `write_tif`

!!! warning "Deprecated"
    Prefer the [`local`](local.md) module, which writes both NetCDF and GeoTIFF through a single interface (set `file_format_list: ['tif']` or `['netcdf', 'tif']`) and is actively maintained. `write_tif` remains functional but will not receive new features.

This IGM module writes 2D field variables listed in the parameter `vars_to_save` into TIFF output files. The files are named using the variable name and the time step (e.g., `thk-000040.tif`, `usurf-000090.tif`) and are saved in the working directory. The saving frequency is determined by the parameter `processes.time.save` defined in the `time` module. 

If the input files were loaded using the `load_tif` module, the TIFF metadata is preserved and included in the output files.

This module requires the `rasterio` library.

## Parameters

Default configuration file ([write_tif.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/outputs/write_tif.yaml)):
~~~yaml
{% include  "../../../../igm/conf/outputs/write_tif.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/outputs/write_tif.yaml') %}
{% set help = load_yaml('../igm/conf_help/outputs/write_tif.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
