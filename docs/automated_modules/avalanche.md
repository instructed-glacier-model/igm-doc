# Avalanche
This IGM module permits to model redistribution of snow due to avalanches.
This routine move ice/snow downslope until the ice surface is everywhere
at angle of repose. This function was adapted from 
[Mark Kessler's GC2D](https://github.com/csdms-contrib/gc2d)
program and implemented in IGM by Jürgen Mey with support from Guillaume Jouvet.

## Config Structure  
~~~yaml
{% include "../../igm/igm/conf/modules/avalanche.yaml" %}
~~~

## Arguments
Here we store a table with

??? warning "Warning Title Here"

    This is a warning block

{{ read_yaml("../../igm/igm/conf_help/modules/avalanche.yaml") }}

## Example Usage
We can run a simulation with a higher frequency of avalanches by changing the `avalanche_update_freq` argument. We can either do this in our config file.

```yaml linenums="1", title="params.yaml", hl_lines="19 20"
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
  avalanche:
	avalanche_update_freq: 5 # every 5 years
```
Alternatively, we can do it over the command line
```bash
igm_run +experiment/params modules.avalanche.avalanche_update_freq=5
```