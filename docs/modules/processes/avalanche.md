

# Module `avalanche`

This IGM module simulates the redistribution of snow and ice due to gravitational avalanches. The model assumes that when the local surface slope exceeds a specified threshold (angle of repose), mass is redistributed toward lower elevations until the surface slope is reduced below this threshold.

**Contributors:** This function was adapted from [Mark Kessler's GC2D](https://github.com/csdms-contrib/gc2d) program and implemented in IGM by Jürgen Mey with support from Guillaume Jouvet.

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/avalanche.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/processes/avalanche.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/avalanche.yaml') %}
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

We can run a simulation with a higher frequency of avalanches by changing the `processes.avalanche.update_freq` argument. We can either do this in our config file.

```yaml
# @package _global_
  
inputs:
  load_ncdf:
    input_file: data/input.nc

processes:
  smb_simple:
    array:
      - ["time", "gradabl", "gradacc", "ela", "accmax"]
      - [1900, 0.009, 0.005, 2800, 2.0]
      - [2000, 0.009, 0.005, 2900, 2.0]
      - [2100, 0.009, 0.005, 3300, 2.0]
  time:
    start: 1900.0
    end: 2000.0
    save: 10.0
  avalanche:
	  update_freq: 5 # every 5 years
```

Alternatively, we can do it over the command line

```bash
igm_run +experiment/params processes.avalanche.update_freq=5
```