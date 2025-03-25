# Module `read_output`

This IGM module permits to read an output NetCDF file produced previously and to run igm as if these quantities were shortly computed, this is mainly usefull for testing postprocessing module independently.

## Contributors

G. Jouvet

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/read_output.yaml" %}
~~~

## Arguments
{% set config = load_yaml('igm/igm/conf/processes/read_output.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/read_output.yaml') %}
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