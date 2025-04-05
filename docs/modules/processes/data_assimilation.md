# Module `data_assimilation`
 
A data assimilation module in IGM allows users to determine the optimal ice thickness, top ice surface, and/or ice flow parameters that best match observational data, such as surface ice velocities, ice thickness profiles, and top ice surface elevation, while maintaining consistency with the ice flow emulator (`iceflow`) used in forward modeling. This page provides guidance on using the data assimilation module as a preparatory step for running a forward or prognostic model in IGM. **Check at the IGM technical paper for further details [1].**

[1] Concepts and capabilities of the Instructed Glacier Model 3.X.X, Jouvet and al.

**Note:** The optimization process requires some expertise, and parameter tuning may be necessary to achieve meaningful results. Use this module carefully and be prepared to explore various parameter configurations. Feel free to contact us to verify the consistency of your results.

### Getting the data 
The first step is to gather as much relevant data as possible. The recommended data includes:

* **Observed surface ice velocities** (${\bf u}^{s,obs}$), e.g., from Millan et al. (2022).
* **Surface top elevation** ($s^{obs}$), e.g., from datasets like SRTM or ESA GLO-30.
* **Ice thickness profiles** ($h_p^{obs}$), e.g., from the GlaThiDa database.
* **Glacier outlines and resulting mask**, e.g., from the Randolph Glacier Inventory (RGI).

If you do not have access to all these datasets, it is still possible to proceed with a reduced dataset. However, in such cases, you will need to make assumptions to limit the number of variables to optimize (controls). This ensures that the optimization problem remains well-posed, meaning it has a unique and meaningful solution.

These data can be obtained using the IGM module `oggm_shop` and loaded with the inputs module using convention-based variable names ending with `obs`. For example:

* `usurfobs`: Observed top surface elevation.
* `thkobs`: Observed thickness profiles (use `NaN` or no-value where no data is available).
* `icemaskobs`: Mask derived from RGI outlines to enforce zero ice thickness outside the mask.
* `uvelsurfobs` and `vvelsurfobs`: X- and Y-components of the horizontal surface ice velocity (use `NaN` or no-value where no data is available).
* `thkinit`: Optionally, a previously inferred ice thickness field to initialize the inverse model. If not provided, the model will start with `thk=0`.

**Use the IGM `oggm_shop` to download all the data you need using OGGM.**
 
### General optimization setting

The optimization problem consists of finding spatially varying fields ($h$, $A$, $c$, $s$) that minimize the cost function:

$$\mathcal{J}(h,A,c,s)=\mathcal{C}^u+\mathcal{C}^h+\mathcal{C}^s+\mathcal{C}^{d}+\mathcal{R}^h+\mathcal{R}^A+\mathcal{R}^{c}+\mathcal{P}^h,$$

where:

- $\mathcal{C}^u$: Misfit between modeled and observed surface ice velocities.
- $\mathcal{C}^h$: Misfit between modeled and observed ice thickness profiles.
- $\mathcal{C}^s$: Misfit between modeled and observed top ice surface.
- $\mathcal{C}^d$: Misfit term between modeled and observed flux divergence.
- $\mathcal{R}^h$: Regularization term to enforce smoothness (and possible convexity) on $h$.
- $\mathcal{R}^A$: Regularization term to enforce smoothness (and possible convexity) on $A$.
- $\mathcal{R}^c$: Regularization term to enforce smoothness on $c$.
- $\mathcal{P}^h$: Penalty term to enforce nonnegative ice thickness.

This formulation ensures that the optimization problem is well-posed by balancing data fidelity terms ($\mathcal{C}$) with regularization and penalty terms ($\mathcal{R}$ and $\mathcal{P}$). Check at the reference paper for more explanation on each terms of the cost function.

### Define controls and cost components

The above optimization problem is given in the most general case. However, you may select only some components according to your data as follows:

- **Control Variables**: Specify the variables you wish to optimize. For example:
  ```json
  "processes.data_assimilation.control_list": ["thk", "slidingco", "usurf"]  # Optimize ice thickness, sliding coefficient, and surface elevation.
  "processes.data_assimilation.control_list": ["thk", "usurf"]  # Optimize ice thickness and surface elevation only.
  "processes.data_assimilation.control_list": ["thk"]  # Optimize ice thickness only.
  ```

- **Cost Components**: Specify the components of the cost function to minimize. For example:
  ```json
  "processes.data_assimilation.cost_list": ["velsurf", "thk", "usurf", "divfluxfcz", "icemask"]  # General case with multiple components.
  "processes.data_assimilation.cost_list": ["velsurf", "icemask"]  # Fit surface velocity and ice mask only.
  ```

**Recommendation**: Start with a simple optimization setup, such as a single control variable (`thk`) and a few cost components (`velsurf` and `icemask`). Gradually increase the complexity by adding more controls and cost components once the simpler setup yields meaningful results. Ensure a balance between controls and constraints to maintain a well-posed problem and avoid multiple solutions.
 
### Exploring parameters

There are parameters that may need to tune for each application.

First, you may adjust the expected confidence levels (i.e., tolerance to fit the data) $\sigma^u$, $\sigma^h$, $\sigma^s$, and $\sigma^d$ to better match surface ice velocity, ice thickness, surface top elevation, or flux divergence. These parameters can be configured as follows:

```json
"processes.data_assimilation.velsurfobs_std": 5 # unit m/y
"processes.data_assimilation.thkobs_std" : 5 # unit m
"processes.data_assimilation.usurfobs_std" : 5 # unit m
"processes.data_assimilation.divfluxobs_std": 1 # unit m/y
```

Second, you may adjust regularization parameters to control the smoothness and convexity of the optimized fields. These include:

1. **Regularization Weights** ($\alpha^h$, $\alpha^A$): These parameters control the regularization strength for ice thickness and flow parameters. Increasing $\alpha^h$ or $\alpha^A$ will result in smoother spatial fields for these variables.

2. **Convexity weight** ($\gamma$): Adds a convexity constraint to the system. Using a small value for $\gamma$ can help when initializing the inverse model with zero ice thickness or when dealing with margin regions lacking observational data.

These parameters can be configured as follows:

```json
"processes.data_assimilation.regu_param_thk": 10.0           # Regularization weight for ice thickness
"processes.data_assimilation.regu_param_slidingco": 1.0      # Regularization weight for sliding coefficient
"processes.data_assimilation.convexity_weight": 0.002        # Convexity weight (gamma)
```

Lastly, there are a couple of other parameters we may be interest to change e.g.

```json
"processes.data_assimilation.nbitmax": 1000         # Number of it. for the optimization
"processes.data_assimilation.step_size": 1.0        # Step size in the optimization iterative algorithm
"processes.data_assimilation.init_zero_thk": True   # Force init zero ice thk (otherwise take thkinit)
```

### Parameter inference (S. Cook) 

There is also a further option: the convexity weight and the slidingco can be inferred automatically by the model. These values are calibrated only for IGM v2.2.1 and a particular set of costs and controls, and are based on a series of regressions calculated through manual inversions to find the best parameters for 50 glaciers of different types and sizes around the world (see Samuel's forthcoming paper when it's published). In other words, they are purely empirical and are likely to be a bit off for any different set of costs and controls, but should work tolerably well on any glacier anywhere on the planet, at least to give you somewhere to start exploring the parameter space. If this behaviour is desired, you MUST use RGI7.0 (C or G) and the oggm_shop module. If using C, you will also need to set the oggm_sub_entity_mask parameter to True. Within the optimize module, processes.data_assimilation.infer_params must also be set to true.

For small glaciers with no velocity observations, the model will also use volume-area scaling to provide an additional constraint with in the inference framework - this all happens automatically, but note the processes.data_assimilation.vol_std parameter that you can fiddle around with if you want to force it to pay more or less attention to volume (by default, this is 1000.0 - which will give a very small cost - anywhere with velocity data, and 0.001 - which will give a big cost - anywhere lacking velocity data. The parameter only controls the default value where this is other data - the 0.001 where there's no velocity data is hard-coded).

A final parameter - processes.data_assimilation.tidewater_glacier - can also be set to True to force the inference code to treat the glacier as a tidewater-type glacier. If the RGI identifies a glacier as tidewater, it will be treated as such anyway, but this parameter gives you the option to force it (note: setting the parameter to False - its default value - will not cause the model to treat RGI-identified tidewater glaciers as non-tidewater - there is no option to do that).

### Monitoring the Optimization

You can monitor the data assimilation process during inverse modeling in several ways:

- **Cost Components**: Verify that the components of the cost function decrease over time. The cost values are printed during the optimization process, and a graph summarizing the results is generated at the end.
- **Live Monitoring**: Set the parameters `"plot_result": true` and `"plt2d_live": true` to visualize the evolution of the optimized fields (e.g., ice thickness, surface ice speeds) in real-time. Additionally, observe the (hopefully decreasing) standard deviations displayed in the figures.
- **Post-Run Analysis**: After the run, examine the `optimize.nc` file, which contains the results of the optimization. Ensure this file is configured to be written during the process.
- **Flux Divergence Check**: If `divfluxfcz` is included in the parameter list `"processes.data_assimilation.cost"`, inspect the divergence of the flux to ensure it aligns with expectations.

For more information, refer to the relevant documentation or technical references.

[2] Jouvet, Guillaume. "Inversion of a Stokes glacier flow model emulated by deep learning." Journal of Glaciology 69.273 (2023): 13-26.

[3] Jouvet, Guillaume, and Guillaume Cordonnier. "Ice-flow model emulator based on physics-informed deep learning." Journal of Glaciology 69.278 (2023): 1941-1955.

**Contributors:** G. Jouvet, S. Cook (parameter inference functions for global modelling)

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/data_assimilation.yaml" %}
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


{% set config = load_yaml('igm/igm/conf/processes/data_assimilation.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/data_assimilation.yaml') %}
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