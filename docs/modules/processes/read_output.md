# Module `read_output`

This module enables the reading of a previously generated NetCDF output file, allowing IGM to operate as though these quantities were freshly computed. It is particularly useful for testing the postprocessing module in isolation.

**Contributors:** G. Jouvet.

## Parameters

Default configuration file ([read_output.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/read_output.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/read_output.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/read_output.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/read_output.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}