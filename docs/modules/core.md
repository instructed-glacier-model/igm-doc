# Core

These core parameters are organized under a specific configuration structure designed to manage essential aspects of IGM's workflow, hardware preferences, and logging options. 

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/core.yaml" %}
~~~

## Parameters

{% macro flatten_config(config, help, prefix='') %}
  {% for key, value in config.items() %}
    {% set full_key = prefix ~ key if prefix == '' else prefix ~ '.' ~ key %}
    {% set help_entry = help.get(key, {}) %}
    {% if value is mapping %}
      {{ flatten_config(value, help_entry, full_key) }}
    {% else %}
      <tr>
        <td>{{ full_key }}</td>
        <td>
          {% if help_entry.Type %}
            <span class="{{ help_entry.Type }}_table">{{ help_entry.Type }}</span>
          {% endif %}
        </td>
        <td>
          {% if help_entry.Units %}
            <span class="math">\( {{ help_entry.Units }} \)</span>
          {% endif %}
        </td>
        <td>{{ help_entry.Description or '' }}</td>
        <td>{{ value }}</td>
      </tr>
    {% endif %}
  {% endfor %}
{% endmacro %}

{% set config = load_yaml('igm/igm/conf/core.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/core.yaml') %}
{% set header = load_yaml('igm/igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

<table>
  <thead>
    <tr>
      <th>Name</th>
      {% for key in header %}
      <th>{{ key }}</th>
      {% endfor %}
      <th>Default Value</th>
    </tr>
  </thead>
  <tbody>
    {{ flatten_config(module, module_help) }}
  </tbody>
</table>

<!-- Load MathJax v3 -->
<script>
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']]
    }
  };
</script>

<script type="text/javascript">
  MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
</script>