# Module `plot2d`

This IGM module generates 2D plan-view plots of a variable specified by the parameter `var` (e.g., `var` can be set to `thk`, `ubar`, etc.). The saving frequency is determined by the parameter `processes.time.save` defined in the `time` module. The color bar's scale range is controlled by the parameter `varmax`.

By default, the plots are saved as PNG files in the working directory. However, you can display the plot "live" by setting `live` to `True`. 

If the `particles` module is activated, you can overlay particles on the plot by setting `particles` to `True`, or exclude them by setting it to `False`.

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/outputs/plot2d.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/outputs/plot2d.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/outputs/plot2d.yaml') %}
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
</script>

## Example Usage