## Parameters

Default configuration file ([NAME.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/SECTION/NAME.yaml)):
~~~yaml
{% include  "../../../../igm/conf/SECTION/NAME.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/SECTION/NAME.yaml') %}
{% set help = load_yaml('../igm/conf_help/SECTION/NAME.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}

{{ render_contributors("NAME") }}
