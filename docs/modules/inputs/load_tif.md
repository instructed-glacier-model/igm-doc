# Module `load_tif`

**Warning: we advise to use instead module `local`**

This IGM module is designed to load spatial 2D raster data from any `.tif` file present in the working directory (`folder`) and transform each of them into TensorFlow variables. The name of the file becomes the name of the variable. For example, the file `topg.tif` will yield the variable `topg`. At a minimum, the module is expected to import basal topography represented by the `topg` variable. Additionally, it can derive basal topography from ice thickness and surface topography. Other fields present in the folder will also be converted to TensorFlow variables, allowing them to be accessed in the code via `state.myvar`. For instance, providing the `icemask` variable can help define an accumulation area, which is useful for modeling individual glaciers and preventing overflow into neighboring catchments.

The module provides functionality for resampling the data using the `coarsen` parameter, which can be set to values like 2, 3, or 4 (with a default value of 1 indicating no coarsening). It also supports cropping the data by setting the `crop` parameter to `True` and specifying the desired bounds.

Additionally, by setting `icemask_invert` to `True`, an ice mask can be generated from an ESRI Shapefile specified by the `icemask_shapefile` parameter. This mask can identify areas that should contain glaciers or remain glacier-free, based on the `icemask_include` parameter.

This module depends on `rasterio`.

**Contributors:** G. Jouvet, A. Henz (icemask add-on)

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/inputs/load_tif.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/inputs/load_tif.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/inputs/load_tif.yaml') %}
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
</script>

## Example Usage