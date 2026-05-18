# Module `load_tif`

!!! warning "Deprecated"
    Prefer the [`local`](local.md) module, which handles both NetCDF and GeoTIFF through a single interface and is actively maintained. `load_tif` remains functional but will not receive new features.

This IGM module is designed to load spatial 2D raster data from any `.tif` file present in the working directory (`folder`) and transform each of them into TensorFlow variables. The name of the file becomes the name of the variable. For example, the file `topg.tif` will yield the variable `topg`. At a minimum, the module is expected to import basal topography represented by the `topg` variable. Additionally, it can derive basal topography from ice thickness and surface topography. Other fields present in the folder will also be converted to TensorFlow variables, allowing them to be accessed in the code via `state.myvar`. For instance, providing the `icemask` variable can help define an accumulation area, which is useful for modeling individual glaciers and preventing overflow into neighboring catchments.

The module provides functionality for resampling the data using the `coarsen` parameter, which can be set to values like 2, 3, or 4 (with a default value of 1 indicating no coarsening). It also supports cropping the data by setting the `crop` parameter to `True` and specifying the desired bounds.

Additionally, by setting `icemask_invert` to `True`, an ice mask can be generated from an ESRI Shapefile specified by the `icemask_shapefile` parameter. This mask can identify areas that should contain glaciers or remain glacier-free, based on the `icemask_include` parameter.

This module depends on `rasterio`.

**Contributors:** G. Jouvet, A. Henz (icemask add-on).

## Parameters

Default configuration file ([load_tif.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/inputs/load_tif.yaml)):
~~~yaml
{% include  "../../../../igm/conf/inputs/load_tif.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/inputs/load_tif.yaml') %}
{% set help = load_yaml('../igm/conf_help/inputs/load_tif.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
