# Module `thk`

This IGM module solves the mass conservation equation for ice to update the thickness based on ice flow (computed by the `iceflow` module) and surface mass balance (provided by any module that updates `smb`). The equation is solved using an explicit first-order upwind finite-volume scheme on the 2D working grid. This scheme allows ice mass to move between cells (where thickness and velocities are defined) using edge-defined fluxes (calculated from depth-averaged velocities and ice thickness in the upwind direction). 

The scheme is mass-conservative and parallelizable due to its fully explicit nature. However, it is subject to a CFL condition, meaning the time step (defined in the `time` module) is constrained by the parameter `processes.time.cfl`. This parameter represents the maximum number of cells crossed in one iteration and cannot exceed one. For more details, refer to the documentation of the `time` module. Additional information about the scheme can be found in the following paper:

**Reference:** Jouvet, G., Cordonnier, G., Kim, B., Lüthi, M., Vieli, A., & Aschwanden, A. (2022). Deep learning speeds up ice flow modelling by several orders of magnitude. Journal of Glaciology, 68(270), 651-664.

**Contributors:** Guillaume Cordonnier, Guillaume Jouvet

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/thk.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/processes/thk.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/thk.yaml') %}
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