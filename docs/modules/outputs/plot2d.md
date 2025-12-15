# Module `plot2d`

This IGM module generates 2D plan-view plots of a variable specified by the parameter `var` (e.g., `var` can be set to `thk`, `ubar`, etc.). The saving frequency is determined by the parameter `processes.time.save` defined in the `time` module. The color bar's scale range is controlled by the parameter `varmax`.

By default, the plots are saved as PNG files in the working directory. However, you can display the plot "live" by setting `live` to `True`. 

If the `particles` module is activated, you can overlay particles on the plot by setting `particles` to `True`, or exclude them by setting it to `False`.

## Parameters

Default configuration file ([plot2d.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/outputs/plot2d.yaml)):
~~~yaml
{% include  "../../../../igm/conf/outputs/plot2d.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/outputs/plot2d.yaml') %}
{% set help = load_yaml('../igm/conf_help/outputs/plot2d.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
