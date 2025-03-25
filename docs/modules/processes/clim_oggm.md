# Module `clim_oggm`

The `clim_oggm` module processes monthly historical climate data from the GSWP3_W5E5 dataset obtained through the `oggm_shop` module. It generates monthly 2D raster fields that include corrected precipitation, mean temperature, and temperature variability. The process involves applying a multiplicative correction factor to precipitation (specified by the `prcp_fac` parameter) and a bias correction to temperature (specified by the `temp_bias` parameter). Temperature data is then extrapolated across the glacier surface using a reference height and a constant lapse rate, determined by the `temp_default_gradient` parameter. Conversely, precipitation and temperature variability data are distributed across the entire domain without additional corrections. The `oggm_shop` module provides all necessary calibrated parameters. These resultant fields are designed for use in surface mass balance or enthalpy modeling.

## Contributors

Guillaume Jouvet, Fabien Maussion

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
We can run a simulation with a higher frequency of avalanches by changing the ... argument. We can either do this in our config file.

```yaml linenums="1", title="params.yaml", hl_lines="19-24"
# @package _global_

core:
  url_data: https://www.dropbox.com/scl/fo/kd7dix5j1tm75nj941pvi/h?rlkey=q7jtmf9yn3a970cqygdwne25j&dl=0
  
modules:
  load_ncdf:
    lncd_input_file: data/input.nc
  smb_simple:
    smb_simple_array:
      - ["time", "gradabl", "gradacc", "ela", "accmax"]
      - [1900, 0.009, 0.005, 2800, 2.0]
      - [2000, 0.009, 0.005, 2900, 2.0]
      - [2100, 0.009, 0.005, 3300, 2.0]
  time_igm:
    time_start: 1900.0
    time_end: 2000.0
    time_save: 10.0
  clim_oggm:
	smb_oggm_file: my_smb_oggm_param.txt
	clim_oggm_clim_trend_array:
		- ["time", "delta_temp", "prec_scal"]
		- [1500, 0.0, 1.0]
		- [2720, 0.0, 1.0]
```
Alternatively, we can do it over the command line
```bash
igm_run +experiment/params modules.avalanche.smb_oggm_file=my_smb_oggm_param.txt
```
### Climate outside the time frame of available data
In addition, this module can generate climate outside the time frame of available data. To that aim, we define a reference period with parameter `clim_oggm_ref_period` to pick randomly years within this interval (usually taken to be a climate-neutral period), and apply a biais in temperature and a scaling of precipitation. These parameters may be given in file (file name given in `clim_oggm_file` parameter), which look like this (this example gives an linear increase of temperature of 4 degrees by the end of 2100 (with respect to the period 1960-1990):

```dat
time   delta_temp  prec_scal
1900          0.0        1.0
2020          0.0        1.0
2100          4.0        1.0
```

 or directly as parameter in the config `params.json` file:

```json
"clim_oggm_clim_trend_array": [ 
                     ["time", "delta_temp", "prec_scal"],
                     [ 1900,           0.0,         1.0],
                     [ 2020,           0.0,         1.0],
                     [ 2100,           4.0,         1.0]
                              ],  
```

If parameter `clim_oggm_clim_trend_array` is set to empty list `[]`, then it will read the file `clim_oggm_file`, otherwise it read the array `clim_oggm_clim_trend_array` (which is here in fact a list of list).