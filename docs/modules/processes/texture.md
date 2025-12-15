# Module `texture`

This modules allows you to calculate ...

**Contributors:** Brandon Finley.

## Parameters

Default configuration file ([texture.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/texture.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/texture.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/texture.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/texture.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}