# Module `enthalpy`

This IGM module models the ice enthalpy, which permits to jointly model the ice temperature, as well as the water content created when the temperature hits the pressure melting points, and therefore energy conservation, which is not the case when modelling the sole temperature variable. The model is described in [(Aschwanden and al, JOG, 2012)](https://www.cambridge.org/core/journals/journal-of-glaciology/article/an-enthalpy-formulation-for-glaciers-and-ice-sheets/605D2EC3DE03B82F2A8289220E76EB27). 

**Contributors:** G. Jouvet

This implementation is largely inspired from the one implemented in [PISM](https://www.pism.io/). Other references that have helped are [(Kleiner and al, TC, 2015)](https://tc.copernicus.org/articles/9/217/2015/) and [(Wang and al, 2020)](https://www.sciencedirect.com/science/article/abs/pii/S0098300419311458).

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/enthalpy.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/processes/enthalpy.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/enthalpy.yaml') %}
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
      <td><span class={{module_help[key].Type}}_table>{{ module_help[key].Type}}</span></td>
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