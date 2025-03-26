# Module `load_ncdf`

**Warning: we advise to use instead module `local`**

This IGM module is designed to load spatial 2D raster data from a NetCDF file specified by the `input_file` parameter. The module converts all existing 2D fields into TensorFlow variables. At a minimum, the module is expected to import basal topography represented by the `topg` variable. Additionally, it completes the data, such as deriving basal topography from ice thickness and surface topography. Other fields present in the NetCDF file will also be converted to TensorFlow variables, allowing them to be accessed in the code via `state.myvar`. For example, providing the `icemask` variable can be useful in defining an accumulation area, which is beneficial for modeling individual glaciers and preventing overflow into neighboring catchments.

The module offers functions for resampling the data, where the `coarsen` parameter can be set to values like 2, 3, or 4 (with a default value of 1 indicating no coarsening), and for cropping the data, which requires setting the `crop` parameter to True and specifying the desired bounds.

Additionally, by setting `icemask_invert` to True, an ice mask can be generated from an ESRI Shapefile specified by the `icemask_shapefile` parameter. This mask can identify areas that should contain glaciers or areas that should remain glacier-free, based on the `icemask_include` parameter.

The module also supports restarting an IGM run using a NetCDF file produced from a previous IGM run. To achieve this, provide the output NetCDF file from the previous run as input to IGM. The module will seek data corresponding to the starting time defined by `processes.time.start` and initialize the simulation at that time.

This module depends on `netCDF4`.

**Contributors:** G. Jouvet, A. Henz (icemask add-on)

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/inputs/load_ncdf.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/inputs/load_ncdf.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/inputs/load_ncdf.yaml') %}
{% set header = load_yaml('igm/igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

<table>
  <thead>
    <tr>
      <th>Name</th>
      {% for key in header %}
      <th>{{ key }}</th>
      {% endfor %}
      <th>Default Value</th>
    </tr>
  </thead>
  <tbody>
    {% for key, value in module.items() %}
    <tr>
      <td>{{ key }}</td>
      <td>{{ module_help[key].Type}}</td>
      <td>{{ module_help[key].Units}}</td>
      <td>{{ module_help[key].Description}}</td>

      <td>{{ value }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>


      
<script type="text/javascript">
  MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
</script> -->


## Example Usage