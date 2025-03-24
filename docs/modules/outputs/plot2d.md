# plot2d

This IGM module produces 2D plan-view plots of variable defined by parameter `plt2d_var` (e.g. `plt2d_var` can be set to `thk`, or `ubar`, ...). The saving frequency is given by parameter `time_save` defined in module `time`.  The scale range of the colobar is controlled by parameter `plt2d_varmax`.

By default, the plots are saved as png files in the working directory. However, one may display the plot "in live" by setting `plt2d_live` to True. Note that if you use the spyder python editor, you need to turn `plt2d_editor` to 'sp'.
 
If the `particles` module is activated, one may plot particles on the top setting `plt2d_particles` to True, or remove them form the plot seeting it to False.


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