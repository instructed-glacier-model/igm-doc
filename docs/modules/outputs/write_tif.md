# Module `write_tif`

This IGM module writes 2D field variables listed in the parameter `vars_to_save` into TIFF output files. The files are named using the variable name and the time step (e.g., `thk-000040.tif`, `usurf-000090.tif`) and are saved in the working directory. The saving frequency is determined by the parameter `processes.time.save` defined in the `time` module. 

If the input files were loaded using the `load_tif` module, the TIFF metadata is preserved and included in the output files.

This module requires the `rasterio` library.

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/outputs/write_tif.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/outputs/write_tif.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/outputs/write_tif.yaml') %}
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