# Module `thk`

This IGM module solves the mass conservation of ice to update the thickness from ice flow (computed from module `iceflow`) and surface mass balance (given any module that update `smb`). The mass conservation equation is solved using an explicit first-order upwind finite-volume scheme on the 2D working grid. With this scheme mass of ice is allowed to move from cell to cell (where thickness and velocities are defined) from edge-defined fluxes (inferred from depth-averaged velocities, and ice thickness in upwind direction). The resulting scheme is mass conservative and parallelizable (because fully explicit). However, it is subject to a CFL condition. This means that the time step (defined in module `time`) is controlled by parameter parameter `processes.time.cfl`, which is the maximum number of cells crossed in one iteration (this parameter cannot exceed one), see the documentation of module `time`. A bit more details on the scheme are given in the following paper.

Jouvet, G., Cordonnier, G., Kim, B., Lüthi, M., Vieli, A., & Aschwanden, A. (2022). Deep learning speeds up ice flow modelling by several orders of magnitude. Journal of Glaciology, 68(270), 651-664.

## Contributors

Guillaume Cordonnier, Guillaume Jouvet

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/thk.yaml" %}
~~~

## Arguments
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

## Example Usage