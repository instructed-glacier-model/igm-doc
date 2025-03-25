 Module `glerosion`

This IGM module implements change in basal topography (due to glacial erosion). The bedrock is updated (with a frequency provided by parameter `glerosion_update_freq years`) assuming a power erosion law, i.e. the erosion rate is proportional (parameter `glerosion_cst`) to a power (parameter `glerosion_exp`) of the sliding velocity magnitude. 

By default, we use the parameters from [1].
 
[1] Herman, F. et al., Erosion by an Alpine glacier. Science 350, 193-195, 2015.

## Contributors

G. Jouvet

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/glerosion.yaml" %}
~~~

## Arguments
{% set config = load_yaml('igm/igm/conf/processes/glerosion.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/glerosion.yaml') %}
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

Hi