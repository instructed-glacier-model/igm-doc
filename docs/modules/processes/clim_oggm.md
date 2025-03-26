# Module `clim_oggm`

The `clim_oggm` module processes monthly historical climate data from the GSWP3_W5E5 dataset obtained through the `oggm_shop` module. It generates monthly 2D raster fields that include corrected precipitation, mean temperature, and temperature variability. The process involves applying a multiplicative correction factor to precipitation (specified by the `prcp_fac` parameter) and a bias correction to temperature (specified by the `temp_bias` parameter). Temperature data is then extrapolated across the glacier surface using a reference height and a constant lapse rate, determined by the `temp_default_gradient` parameter. Conversely, precipitation and temperature variability data are distributed across the entire domain without additional corrections. The `oggm_shop` module provides all necessary calibrated parameters. These resultant fields are designed for use in surface mass balance or enthalpy modeling.

In addition, this module can generate climate outside the time frame of available data. To that aim, we define a reference period with parameter `_ref_period` to pick randomly years within this interval (usually taken to be a climate-neutral period), and apply a biais in temperature and a scaling of precipitation. These parameters may be given in file (file name given in `file` parameter), which look like this (this example gives an linear increase of temperature of 4 degrees by the end of 2100 (with respect to the period 1960-1990):

```dat
time   delta_temp  prec_scal
1900          0.0        1.0
2020          0.0        1.0
2100          4.0        1.0
```
 
If parameter `clim_trend_array` is set to empty list `[]`, then it will read the file `file`, otherwise it read the array `clim_trend_array` (which is here in fact a list of list).

**Contributors:** Guillaume Jouvet, Fabien Maussion

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/clim_oggm.yaml" %}
~~~

## Parameters
Here we store a table with

{% set config = load_yaml('igm/igm/conf/processes/clim_oggm.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/clim_oggm.yaml') %}
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
