# clim_oggm

Module `clim_oggm` reads monthly time series of historical GSWP3_W5E5 climate data collected by the `oggm_shop` module, and generates monthly 2D raster fields of corrected precipitation, mean temperature, and temperature variability. To achieve this, we first apply a multiplicative correction factor for precipitation (parameter `prcp_fac`) and a biais correction for temperature (parameter `temp_bias`). Then, the module extrapolates temperature data to the entire glacier surface using a reference height and a constant lapse rate (parameter `temp_default_gradient`). In constrast, the point-wise data for precipitation and temperature variablity are extended to the entire domain without further correction. Module `oggm_shop` provides all calibrated parameters. The resulting fields are intended to be used to force the surface mass balance or enthalpy models.

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/modules/clim_oggm.yaml" %}
~~~

## Parameters
Here we store a table with

{% set config = load_yaml('igm/igm/conf/modules/clim_oggm.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/modules/clim_oggm.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help[module_key] %}

<table>
  <thead>
    <tr>
      <th>Name</th>
      {% for key in help.header %}
      <th>{{ key }}</th>
      {% endfor %}
      <th>Default Value</th>
    </tr>
  </thead>
  <tbody>
    {% for key, value in module.items() %}
    <tr>
      <td>{{ key }}</td>
      <td>{{ module_help[key].type }}</td>
      <!-- <td>{{ module_help[key].units | safe }}</td> -->
      <td><span class="math">{{ module_help[key].units }}</span></td>
      <td>{{ module_help[key].description }}</td>
      <td>{{ value }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>

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