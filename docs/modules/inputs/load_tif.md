# load_tif

This IGM module loads spatial 2D raster data from any tif file present in the working directory folder, and transform each of them into tensorflow variables, the name of the file becoming the name of the variable, e.g. the file topg.tif will yield variable topg, ect... It is expected here to import at least basal topography (variable `topg`). It also complete the data, e.g. the basal topography from ice thickness and surface topography. Note that all these variables will therefore be available in the code with `state.myvar` from myvar.tif (e.g. variable `icemask` can be provided, and served to define an accumulation area -- this is usefull for modelling an individual glaciers, and prevent overflowing in neighbouring catchements). The module also contains two functions for resampling (parameter `ltif_coarsen` should be increased to 2,3,4 ..., default 1 value means no coarsening) and cropping the data (parameter `ltif_crop` should be set to True, and the bounds must be definined as wished).

This module depends on `rasterio`.

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