

# Module `avalanche`

This IGM module simulates the redistribution of snow and ice due to gravitational avalanches. The model assumes that when the local surface slope exceeds a specified threshold (angle of repose), mass is redistributed toward lower elevations until the surface slope is reduced below this threshold.
## Parameters

Default configuration file ([avalanche.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/avalanche.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/avalanche.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/avalanche.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/avalanche.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}

## Example Usage

We can run a simulation with a higher frequency of avalanches by changing the `processes.avalanche.update_freq` argument. We can either do this in our config file.

```yaml
# @package _global_
  
inputs:
  load_ncdf:
    input_file: data/input.nc

processes:
  smb:
    method: simple
    simple:
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

{{ render_contributors("avalanche") }}
