# rockflow

This module extends the ice flow outside the glaciated area, by giving a constant speed and along-slope flow direction. This modules serves to track rock-like particles (with module `particles`) everywhere in ice-free and ice-filled areas, particles being either advected at constant steep (controlled by parameter `rock_flow_speed`) following the stepest gradient of the ice-free terrain in 2D, or by ice flow in 3D.

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/rockflow.yaml" %}
~~~

## Arguments

{% set config = load_yaml('igm/igm/conf/processes/rockflow.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/rockflow.yaml') %}
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
      <!-- <td>{{ module_help[key].Units}}</td> -->
      <td><span class="math">{{ module_help[key].Units }}</span></td>
      <td>{{ module_help[key].Description}}</td>

      <td>{{ value }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>

<script type="text/javascript">
  MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
</script>

## Example Usage