# Module `time`

This IGM modules computes time step such that i) it satisfy the CFL condition (controlled by parameter `cfl`) ii) it is lower than a given maximum time step (controlled by parameter `processes.time.step_max`) iii) it hits exactly given saving times (controlled by parameter `processes.time.save`). The module additionally updates the time $t$ in addition to the time step.

Indeed, for stability reasons of the transport scheme for the ice thickness evolution, the time step must respect a CFL condition, controlled by parameter `processes.time.cfl`, which is the maximum number of cells crossed in one iteration (this parameter cannot exceed one). By default, we take `processes.time.cfl` to 0.3. We additionally request time step to be upper-bounded by a user-defined parameter `processes.time.save` (default: 1 year).
 
Among the parameters of this module `processes.time.start` and `processes.time.end` defines the simulation starting and ending times, while `processes.time.save` defines the frequency at which results must be saved (default: 10 years).

A bit more details on the time step stability conditionsis given in the following paper.

Jouvet, G., Cordonnier, G., Kim, B., Lüthi, M., Vieli, A., & Aschwanden, A. (2022). Deep learning speeds up ice flow modelling by several orders of magnitude. Journal of Glaciology, 68(270), 651-664.

## Contributors

G. Jouvet

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/time.yaml" %}
~~~

## Arguments
{% set config = load_yaml('igm/igm/conf/processes/time.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/time.yaml') %}
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