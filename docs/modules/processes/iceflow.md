# Module `iceflow`

This IGM module models ice flow dynamics in 3D using a Convolutional Neural Network based on Physics Informed Neural Network as described in this [paper](https://eartharxiv.org/repository/view/5335/). In more details, we train a CNN to minimise the energy associated with high-order ice flow equations within the time iterations of a glacier evolution model. As a result, our processes.iceflow.emulator is a computationally-efficient alternative to traditional solvers, it is capable to handle a variety of ice flow regimes and memorize previous solutions.
 
## Iceflow
 
Pre-trained emulators are provided by defaults (parameter `processes.iceflow.emulator`). However, a from scratch processes.iceflow.emulator can be requested with `processes.iceflow.emulator=""`. The most important parameters are:

- physical parameters 

```json 
"processes.iceflow.init_slidingco": 0.045    # Init slid. coeff. ($Mpa y^{1/3} m^{-1/3}$)
"processes.iceflow.init_arrhenius": 78.0     # Init Arrhenius cts ($Mpa^{-3} y^{-1}$)
"processes.iceflow.exp_glen": 3              # Glen's exponent
"processes.iceflow.exp_weertman":  3         # Weertman's sliding law exponent
```

- related to the vertical discretization:

```json 
"processes.iceflow.Nz": 10                 # number of vertical layers
"processes.iceflow.vert_spacing": 4.0     # 1.0 for equal vertical spacing, 4.0 otherwise
```

- learning rate and frequency of retraining:

```json 
"processes.iceflow.retrain_emulator_lr": 0.00002 
"processes.iceflow.retrain_emulator_freq": 5     
```

While this module was targeted for deep learning emulation, it important parameters for solving are :

is possible to
use the solver (`processes.iceflow.type='solved'`) instead of the default processes.iceflow.emulator (`processes.iceflow.type='emulated'`), or use the two together (`processes.iceflow.type='diagnostic'`) to assess the emaultor against the solver. Most important parameters for solving are :

```json 
"processes.iceflow.solve_step_size": 0.00002 
"processes.iceflow.solve_nbitmax": 5     
```

One may choose between 2D arrhenius factor by changing parameters between `processes.iceflow.dim_arrhenius=2` or `processes.iceflow.dim_arrhenius=3` -- le later is necessary for the enthalpy model.

When treating ery large arrays, retraining must be done sequentially patch-wise for memory reason. The size of the pathc is controlled by parameter `processes.iceflow.multiple_window_size=750`.

For mor info, check at the following reference:

```
@article{jouvet2023ice,
  title={Ice flow model emulator based on physics-informed deep learning},
  author={Jouvet, Guillaume and Cordonnier, Guillaume},
  year={2023},
}
```
 
## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/iceflow.yaml" %}
~~~

## Parameters

{% macro flatten_config(config, help, prefix='') %}
  {% for key, value in config.items() %}
    {% set full_key = prefix ~ key if prefix == '' else prefix ~ '.' ~ key %}
    {% set help_entry = help.get(key, {}) %}
    {% if value is mapping %}
      {{ flatten_config(value, help_entry, full_key) }}
    {% else %}
      <tr>
        <td>{{ full_key }}</td>
        <td>
          {% if help_entry.Type %}
            <span class="{{ help_entry.Type }}_table">{{ help_entry.Type }}</span>
          {% endif %}
        </td>
        <td>
          {% if help_entry.Units %}
            <span class="math">\( {{ help_entry.Units }} \)</span>
          {% endif %}
        </td>
        <td>{{ help_entry.Description or '' }}</td>
        <td>{{ value }}</td>
      </tr>
    {% endif %}
  {% endfor %}
{% endmacro %}


{% set config = load_yaml('igm/igm/conf/processes/iceflow.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/iceflow.yaml') %}
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
    {{ flatten_config(module, module_help) }}
  </tbody>
</table>

<!-- Load MathJax v3 -->
<script>
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']]
    }
  };
</script>

<script type="text/javascript">
  MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
</script>
