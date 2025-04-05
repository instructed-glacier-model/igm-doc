# Module `enthalpy`

**Warning: this rather complex module was not much tested so far, use it with care!**

# Description:

This IGM module models the ice enthalpy, which permits to jointly model the ice temperature, as well as the water content created when the temperature hits the pressure melting points, and therefore energy conservation, which is not the case when modelling the sole temperature variable. The model is described in [(Aschwanden and al, JOG, 2012)](https://www.cambridge.org/core/journals/journal-of-glaciology/article/an-enthalpy-formulation-for-glaciers-and-ice-sheets/605D2EC3DE03B82F2A8289220E76EB27). **Check at the IGM technical paper for further details [1].**

[1] Concepts and capabilities of the Instructed Glacier Model 3.X.X, Jouvet and al.

The enthalpy module builds upon the `iceflow` module. To ensure proper functionality, follow these requirements:

- Activate the `vertical_iceflow` module to provide the vertical velocity.
- Set `params.dim_arrhenius = 3`.
- Set `params.new_friction_param = true`.
- Ensure sufficient retraining by setting `retrain_iceflow_emulator_freq = 1`. Optionally, set `retrain_iceflow_emulator_nbit` to a value greater than 1 for improved performance.

**Contributors:** G. Jouvet

This implementation is largely inspired from the one implemented in [PISM](https://www.pism.io/). Other references that have helped are [(Kleiner and al, TC, 2015)](https://tc.copernicus.org/articles/9/217/2015/) and [(Wang and al, 2020)](https://www.sciencedirect.com/science/article/abs/pii/S0098300419311458).

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/enthalpy.yaml" %}
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


{% set config = load_yaml('igm/igm/conf/processes/enthalpy.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/enthalpy.yaml') %}
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
</script>Processes

    avalanche
