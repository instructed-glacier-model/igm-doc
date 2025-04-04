# Module `vert_flow`

This IGM module computes the vertical component of the velocity (`state.W`) from the horizontal components (`state.U` and `state.V`). These horizontal components are derived from an emulation of the Blatter-Pattyn model in the `iceflow` module. The computation is performed by integrating the incompressibility condition layer-wise. This module is typically used before invoking the `particle` module for 3D particle trajectory integration or the `enthalpy` module for computing 3D advection-diffusion of enthalpy.

**Contributors:** Guillaume Jouvet, Claire-Mathile Stücki

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/vert_flow.yaml" %}
~~~

## Arguments
{% set config = load_yaml('igm/igm/conf/processes/vert_flow.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/vert_flow.yaml') %}
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
