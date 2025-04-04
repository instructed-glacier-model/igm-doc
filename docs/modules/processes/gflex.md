# Module `gflex`

This IGM module models isostasy or the upward motion of the lithosphere when loaded with thick ice. It utilizes the [gflex](https://gmd.copernicus.org/articles/9/997/2016/) Python module developed by Andy Wickert.

The key parameters are the update frequency `processes.gflex.update_freq` and the Elastic Thickness (Te) in meters, specified as `processes.gflex.default_Te`.

This module operates exclusively on the CPU, which may pose challenges when processing very large arrays. However, since updates are not expected to occur frequently, the overall computational demand of this module should remain manageable.

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
