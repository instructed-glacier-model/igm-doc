## Parameters

The complete default configuration file can be found here: [NAME.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/SECTION/NAME.yaml).

{% set config = load_yaml('../igm/conf/SECTION/NAME.yaml') %}
{% set help = load_yaml('../igm/conf_help/SECTION/NAME.yaml') %}
{% set header = load_yaml('../igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_tree.j2" %}

{{ render_contributors("NAME") }}
