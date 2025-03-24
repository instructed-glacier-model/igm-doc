# Iceflow

This IGM module models ice flow dynamics in 3D using a Convolutional Neural Network based on Physics Informed Neural Network as described in this [paper](https://eartharxiv.org/repository/view/5335/). In more details, we train a CNN to minimise the energy associated with high-order ice flow equations within the time iterations of a glacier evolution model. As a result, our iflo_emulator is a computationally-efficient alternative to traditional solvers, it is capable to handle a variety of ice flow regimes and memorize previous solutions.

Pre-trained emulators are provided by defaults (parameter `iflo_emulator`). However, a from scratch iflo_emulator can be requested with `iflo_emulator=""`. The most important parameters are:

- physical parameters 

```json 
"iflo_init_slidingco": 10000.0  # Init slid. coeff. ($Mpa^{-3} y^{-1} m$)
"iflo_init_arrhenius": 78.0     # Init Arrhenius cts ($Mpa^{-3} y^{-1}$)
"iflo_exp_glen": 3              # Glen's exponent
"iflo_exp_weertman":  3         # Weertman's sliding law exponent
```

- related to the vertical discretization:

```json 
"iflo_Nz": 10                 # number of vertical layers
"iflo_vert_spacing": 4.0     # 1.0 for equal vertical spacing, 4.0 otherwise
```

- learning rate and frequency of retraining:

```json 
"iflo_retrain_emulator_lr": 0.00002 
"iflo_retrain_emulator_freq": 5     
```

While this module was targeted for deep learning emulation, it important parameters for solving are :

is possible to
use the solver (`iflo_type='solved'`) instead of the default iflo_emulator (`iflo_type='emulated'`), or use the two together (`iflo_type='diagnostic'`) to assess the emaultor against the solver. Most important parameters for solving are :

```json 
"iflo_solve_step_size": 0.00002 
"iflo_solve_nbitmax": 5     
```

One may choose between 2D arrhenius factor by changing parameters between `iflo_dim_arrhenius=2` or `iflo_dim_arrhenius=3` -- le later is necessary for the enthalpy model.

When treating ery large arrays, retraining must be done sequentially patch-wise for memory reason. The size of the pathc is controlled by parameter `iflo_multiple_window_size=750`.

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/iceflow.yaml" %}
~~~

## Arguments
{% set config = load_yaml('igm/igm/conf/processes/iceflow.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/iceflow.yaml') %}
{% set header = load_yaml('igm/igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module_iceflow = config[module_key].iceflow %}
{% set module_optimize = config[module_key].optimize %}
{% set module_pretraining = config[module_key].pretraining %}
{% set module_help_iceflow = help.iceflow %}
{% set module_help_optimize = help.optimize %}
{% set module_help_pretraining = help.pretraining %}

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
  <th>Iceflow</th>
  <tbody>
    {% for key, value in module_iceflow.items() %}
    <tr>
      <td>{{ key }}</td>
      <td><span class={{module_help_iceflow[key].Type}}_table>{{ module_help_iceflow[key].Type}}</span></td>
      <!-- <td>{{ module_help_iceflow[key].Units}}</td> -->
      <td><span class="math">{{ module_help_iceflow[key].Units }}</span></td>
      <td>{{ module_help_iceflow[key].Description}}</td>
      <td>{{ value }}</td>
    </tr>
    {% endfor %}
  </tbody>
  <th>Optimize</th>
  <tbody>
    {% for key, value in module_optimize.items() %}
    <tr>
      <td>{{ key }}</td>
      <td>{{ module_help_optimize[key].Type}}</td>
      <!-- <td>{{ module_help_optimize[key].Units}}</td> -->
      <td><span class="math">{{ module_help_optimize[key].Units }}</span></td>
      <td>{{ module_help_optimize[key].Description}}</td>
      <td>{{ value }}</td>
    </tr>
    {% endfor %}
  </tbody>
  <th>Pretraining</th>
  <tbody>
    {% for key, value in module_pretraining.items() %}
    <tr>
      <td>{{ key }}</td>
      <td>{{ module_help_pretraining[key].Type}}</td>
      <!-- <td>{{ module_help_pretraining[key].Units}}</td> -->
      <td><span class="math">{{ module_help_pretraining[key].Units }}</span></td>
      <td>{{ module_help_pretraining[key].Description}}</td>
      <td>{{ value }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>

<script type="text/javascript">
  MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
</script>

## Example Usage