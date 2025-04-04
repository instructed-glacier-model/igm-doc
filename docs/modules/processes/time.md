# Module `time`
This IGM module computes the time step such that:  
i) It satisfies the CFL condition (controlled by the parameter `processes.time.cfl`).  
ii) It is lower than a given maximum time step (controlled by the parameter `processes.time.step_max`).  
iii) It aligns exactly with specified saving times (controlled by the parameter `processes.time.save`).  

The module also updates the current simulation time $t$ in addition to determining the time step.

For stability reasons related to the transport scheme for ice thickness evolution, the time step must adhere to the CFL condition. This condition is governed by the parameter `processes.time.cfl`, which specifies the maximum number of cells that can be crossed in one iteration (this parameter cannot exceed 1). By default, `processes.time.cfl` is set to 0.3. Additionally, the time step is constrained by a user-defined maximum time step, `processes.time.step_max`, and must align with the saving frequency defined by `processes.time.save` (default: 1 year).

Key parameters of this module include:  
- `processes.time.start`: Defines the simulation start time.  
- `processes.time.end`: Defines the simulation end time.  
- `processes.time.save`: Specifies the frequency at which results are saved (default: 10 years).

Further details on the time step stability conditions can be found in the following paper:   

**Reference:** Jouvet, G., Cordonnier, G., Kim, B., Lüthi, M., Vieli, A., & Aschwanden, A. (2022). Deep learning speeds up ice flow modelling by several orders of magnitude. Journal of Glaciology, 68(270), 651-664.

**Contributors:** G. Jouvet

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