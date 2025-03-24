# load_ncdf

This IGM module loads spatial 2D raster data from a NetCDF file (parameter `lncd_input_file`, default: input.nc) and transform all existing 2D fields into tensorflow variables. It is expected here to import at least basal topography (variable `topg`). It also complete the data, e.g. the basal topography from ice thickness and surface topography. However, any other field present in NetCDF file will be passed as tensorflow variables, and will therefore be available in the code through `state.myvar` (e.g. variable `icemask` can be provided, and served to define an accumulation area -- this is usefull for modelling an individual glaciers, and prevent overflowing in neighbouring catchements). The module also contains the two functions for resampling (parameter `lncd_coarsen` should be increased to 2,3,4 ..., default 1 value means no coarsening) and cropping the data (parameter `lncd_crop` should be set to True, and the bounds must be definined as wished).

It is possible to restart an IGM run by reading data in an nNetCDF file obtained as a previous IGM run. To that aim, one needs to provide the NETcdf output file as input to IGM. IGM will look for the data that corresponds to the starting time `params.time_start`, and then intialize it with this time.

This module depends on `netCDF4`.

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