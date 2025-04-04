# Core

These core parameters are organized under a specific configuration structure designed to manage essential aspects of IGM's workflow, hardware preferences, and logging options. 

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/core.yaml" %}
~~~

## Parameters

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
    {% for key, value in module.items() %}
    <tr>
      <td>{{ key }}</td>
      <td>{{ module_help[key].Type}}</td>
      <td>{{ module_help[key].Units}}</td>
      <td>{{ module_help[key].Description}}</td>

      <td>{{ value }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>


      
<script type="text/javascript">
  MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
</script> -->
