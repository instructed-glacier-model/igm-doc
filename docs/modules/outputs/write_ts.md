# Module `write_ts`

This IGM module writes time serie variables (ice glaciated area and volume) into the NetCDF output file defined by parameter `output_file` (default output_ts.nc). The saving frequency is given by parameter `processes.time.save` defined in module `time`.

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/outputs/write_ts.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/outputs/write_ts.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/outputs/write_ts.yaml') %}
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