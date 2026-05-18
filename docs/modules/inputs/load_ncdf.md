# Module `load_ncdf`

!!! warning "Deprecated"
    Prefer the [`local`](local.md) module, which handles both NetCDF and GeoTIFF through a single interface and is actively maintained. `load_ncdf` remains functional but will not receive new features.

This IGM module is designed to load spatial 2D raster data from a NetCDF file specified by the `input_file` parameter. The module converts all existing 2D fields into TensorFlow variables. At a minimum, the module is expected to import basal topography represented by the `topg` variable. Additionally, it completes the data, such as deriving basal topography from ice thickness and surface topography. Other fields present in the NetCDF file will also be converted to TensorFlow variables, allowing them to be accessed in the code via `state.myvar`. For example, providing the `icemask` variable can be useful in defining an accumulation area, which is beneficial for modeling individual glaciers and preventing overflow into neighboring catchments.

The module offers functions for resampling the data, where the `coarsen` parameter can be set to values like 2, 3, or 4 (with a default value of 1 indicating no coarsening). It also provides functionality for cropping the data by setting the `crop` parameter to `True` and specifying the desired bounds.

Additionally, by setting `icemask_invert` to `True`, an ice mask can be generated from an ESRI Shapefile specified by the `icemask_shapefile` parameter. This mask can identify areas that should contain glaciers or areas that should remain glacier-free, based on the `icemask_include` parameter.

For marine / tidewater simulations, the `water_level` sub-config creates a 2D `state.water_level` field consumed downstream by the iceflow `floating` energy component (and by `thk` calving-front schemes). Set `water_level.include: True` to fill the domain with a uniform value (`water_level.value`, in metres). If a 2D `water_level` variable is already present in the input NetCDF, it takes precedence and the uniform fill is skipped — letting you prescribe a spatially-varying water level (e.g. a fjord geometry). If `water_level` is left absent, the flotation term is disabled (the lower surface follows the bed). Note: this used to live in the `thk` module as `default_sealevel` and has moved to the input phase, so that `state.water_level` is available before any process module runs.

The module also supports restarting an IGM run using a NetCDF file produced from a previous IGM run. To achieve this, provide the output NetCDF file from the previous run as input to IGM. The module will seek data corresponding to the starting time defined by `processes.time.start` and initialize the simulation at that time.

This module depends on `netCDF4`.

**Contributors:** G. Jouvet, A. Henz (icemask add-on).

## Parameters

Default configuration file ([load_ncdf.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/inputs/load_ncdf.yaml)):
~~~yaml
{% include  "../../../../igm/conf/inputs/load_ncdf.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/inputs/load_ncdf.yaml') %}
{% set help = load_yaml('../igm/conf_help/inputs/load_ncdf.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
