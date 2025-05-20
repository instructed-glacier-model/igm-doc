# Module `flow_accumulation`

This modules uses the calculated ice surface elevation, together with basal topography, to compute the hydraulic potential and hydraulic head and the associated flow accumulation area. For the later, we use the simple subglacial hydrology of the `enthalpy` module.  

This module depends on the [pyshed](https://mattbartos.com/pysheds/) library.

Ref: Cohen, Denis, et al. "Subglacial hydrology from high-resolution ice-flow simulations of the Rhine Glacier during the Last Glacial Maximum: A proxy for glacial erosion." E&G Quaternary Science Journal 72.2 (2023): 189-201.

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/flow_accumulation.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/processes/flow_accumulation.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/flow_accumulation.yaml') %}
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
