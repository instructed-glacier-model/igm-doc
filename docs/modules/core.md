# Core Parameters

These parameters control IGM's workflow, hardware configuration, and logging. They are set under the `core` key and apply globally to every run.

## Config Structure

~~~yaml
{% include  "../../../igm/conf/core.yaml" %}
~~~

## Parameters

{% set config = load_yaml('../igm/conf/core.yaml') %}
{% set help = load_yaml('../igm/conf_help/core.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
