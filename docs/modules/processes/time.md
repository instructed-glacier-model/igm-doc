# time_igm

This IGM modules computes time step such that i) it satisfy the CFL condition (controlled by parameter `clf`) ii) it is lower than a given maximum time step (controlled by parameter `time_step_max`) iii) it hits exactly given saving times (controlled by parameter `time_save`). The module additionally updates the time $t$ in addition to the time step.

Indeed, for stability reasons of the transport scheme for the ice thickness evolution, the time step must respect a CFL condition, controlled by parameter `time_cfl`, which is the maximum number of cells crossed in one iteration (this parameter cannot exceed one). By default, we take `time_cfl` to 0.3. We additionally request time step to be upper-bounded by a user-defined parameter `time_save` (default: 1 year).
 
Among the parameters of this module `time_start` and `time_end` defines the simulation starting and ending times, while `time_save` defines the frequency at which results must be saved (default: 10 years).

A bit more details on the time step stability conditionsis given in the following paper.

```
@article{jouvet2022deep,
  author =        {Jouvet, Guillaume and Cordonnier, Guillaume and
                   Kim, Byungsoo and L{\"u}thi, Martin and
                   Vieli, Andreas and Aschwanden, Andy},
  journal =       {Journal of Glaciology},
  number =        {270},
  pages =         {651--664},
  publisher =     {Cambridge University Press},
  title =         {Deep learning speeds up ice flow modelling by several
                   orders of magnitude},
  volume =        {68},
  year =          {2022},
  doi =           {10.1017/jog.2021.120},
}
```

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