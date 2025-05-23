# Module `smb_accpdd`

Module `smb_accpdd` implements a combined accumulation and temperature-index model [Hock, 2003]. In this model, surface accumulation equals solid precipitation when the temperature is below a threshold and decreases linearly to zero in a transition zone. Conversely, surface ablation is computed proportionally to the number of Positive Degree Days (PDD). The model also tracks snow layer depth and applies different PDD proportionality factors for snow and ice. 

The computation of PDD uses the expectation integration formulation [Calov and Greve, 2005]. Additionally, the computation of the snowpack and refreezing parameters is adapted from the PyPDD and PISM implementations.

### Input
- `state.precipitation` [Unit: $kg \, m^{-2} \, y^{-1}$ water equivalent]
- `state.air_temp` [Unit: $^{\circ}C$]

### Output
- `state.smb` [Unit: $m \, ice \, eq. \, y^{-1}$]

### References
- Hock, R. (2003). Temperature index melt modelling in mountain areas. *Journal of Hydrology*.
- Calov, R., & Greve, R. (2005). A semi-analytical solution for the positive degree-day model with stochastic temperature variations. *Journal of Glaciology*.

**Contributors:** G. Jouvet

Note: This implementation is a TensorFlow re-implementation inspired by the one used in the Aletsch 1880–2100 example. It has been adapted to closely align (though not strictly) with the Positive Degree Day model implemented in PyPDD [Seguinot, 2019], which is utilized in the Parallel Ice Sheet Model (PISM) [Khroulev and the PISM Authors, 2020].

- Seguinot, J. (2019). PyPDD: A positive degree day model for glacier surface mass balance (v0.3.1). *Zenodo*. [https://doi.org/10.5281/zenodo.3467639](https://doi.org/10.5281/zenodo.3467639)

- Khroulev, C., & the PISM Authors. (2020). PISM, a Parallel Ice Sheet Model v1.2: User’s Manual. [www.pism-docs.org](http://www.pism-docs.org)

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/smb_accpdd.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/processes/smb_accpdd.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/smb_accpdd.yaml') %}
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
