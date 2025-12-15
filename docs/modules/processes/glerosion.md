 Module `glerosion`

This IGM module implements change in basal topography (due to glacial erosion). The bedrock is updated (with a frequency provided by parameter `processes.glerosion.update_freq years`) assuming a power erosion law, i.e. the erosion rate is proportional (parameter `processes.glerosion.cst`) to a power (parameter `processes.glerosion.exp`) of the sliding velocity magnitude. By default, we use the parameters from [@Herman2015].

**Contributors:** G. Jouvet.

## Parameters

Default configuration file ([glerosion.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/glerosion.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/glerosion.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/glerosion.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/glerosion.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
