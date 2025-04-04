# Module `clim_oggm`

The `clim_oggm` module processes monthly historical climate data from the GSWP3_W5E5 dataset, obtained via the `oggm_shop` module. It generates monthly 2D raster fields for corrected precipitation, mean temperature, and temperature variability. The module applies a multiplicative correction factor to precipitation (`prcp_fac`) and a bias correction to temperature (`temp_bias`). Temperature data is extrapolated across the glacier surface using a reference height and a constant lapse rate (`temp_default_gradient`). In contrast, precipitation and temperature variability data are distributed across the entire domain without additional corrections. All necessary calibrated parameters are provided by the `oggm_shop` module. These outputs are intended for use in surface mass balance or enthalpy modeling.

The module also supports generating climate data beyond the observational time frame. This is achieved by defining a reference period (`ref_period`) to randomly select years within this interval (typically a climate-neutral period). A temperature bias and a precipitation scaling are then applied. These parameters can be specified in a file (`file` parameter), as shown in the example below. The example illustrates a linear temperature increase of 4 degrees by 2100 (relative to the 1960–1990 period):

```dat
time   delta_temp  prec_scal
1900          0.0        1.0
2020          0.0        1.0
2100          4.0        1.0
```

If the `clim_trend_array` parameter is set to an empty list (`[]`), the module reads the data from the specified `file`. Otherwise, it uses the `clim_trend_array` parameter, which must be a list of lists.

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
 