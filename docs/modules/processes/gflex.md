# Module `gflex`

This IGM module permits to model the isostasy or upward motion of the lithosphere when loaded with thick ice, it uses the 
[gflex](https://gmd.copernicus.org/articles/9/997/2016/) python module writen by Andy Wickert.
 
Parameters are the update frequency `gflex_update_freq` and the Elastic thickness [m] (Te) `gflex_default_Te`.

This module only runs on CPU, which may be an issue for treating very large arrays. On the other hand, we do not expect a frequent update, therefore, this module should not be overall too consuming.

**Contributors:** Jürgen Mey

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/gflex.yaml" %}
~~~

## Arguments

{% set config = load_yaml('igm/igm/conf/processes/gflex.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/gflex.yaml') %}
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