# Module `gflex`

This IGM module models isostasy or the upward motion of the lithosphere when loaded with thick ice. It utilizes the [gflex](https://gmd.copernicus.org/articles/9/997/2016/) Python module developed by Andy Wickert [@Wickert2016].

The key parameters are the update frequency `processes.gflex.update_freq` and the Elastic Thickness (Te) in meters, specified as `processes.gflex.default_Te`.

This module operates exclusively on the CPU, which may pose challenges when processing very large arrays. However, since updates are not expected to occur frequently, the overall computational demand of this module should remain manageable.
## Parameters

Default configuration file ([gflex.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/gflex.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/gflex.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/gflex.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/gflex.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}

{{ render_contributors("gflex") }}
