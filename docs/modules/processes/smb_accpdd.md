# Module `smb_accpdd`

Module `smb_accpdd` implements a combined accumulation / temperature-index model [Hock, 2003].  In this model, surface accumulation equals solid precipitation when the temperature is below a threshold and decreases linearly to zero in a transition zone. Conversely, the surface ablation is computed proportionally to the number of PDD, however, we track the snow layer depth, and different PDD proportionality factors or ice. The computation of the PDD using the expectation integration formulation (Calov and Greve, 2005), the computation of the snowpack, and the refereezing parameters are taken from PyPDD / PISM implementation.

Input:
 - state.precipitation [Unit: $kg m^{-2} y^{-1}$ water eq]
 - state.air_temp      [Unit: $^{\circ}C$          ]

Output:
 -   state.smb           [Unit: m ice eq. / y]

References:

Hock R. (2003). Temperature index melt modelling in mountain areas, J. Hydrol.

Calov and Greve (2005), A semi-analytical solution for the positive degree-day model with stochastic temperature variations, JOG.

**Contributors:** G. Jouvet

Note: It is a TensorFlow re-implementation similar to the one used in the aletsch-1880-2100 example but adapted to fit as closely as possible (thought it is not a strict fit) the Positive Degree Day model implemented in PyPDD (Seguinot, 2019) used for the Parralel Ice Sheet Model (PISM, Khroulev and the PISM Authors, 2020).

Seguinot J. (2019). PyPDD: a positive degree day model for glacier surface mass balance (v0.3.1). Zenodo. https://doi.org/10.5281/zenodo.3467639

Khroulev C. and the PISM Authors. PISM, a Parallel Ice Sheet Model v1.2: User’s Manual. 2020. www.pism-docs.org

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/smb_accpdd.yaml" %}
~~~

## Arguments
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

## Example Usage