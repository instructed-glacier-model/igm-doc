# Module `data_assimilation`

**Note:** This module will be removed in a future release. New projects should use `field_inversion` instead (still under testing), therefore, we still propose the 2 modules.

!!! warning "IGM 3.2 — changed optimisation defaults & recommended setup"
    Several defaults of this module changed in 3.2, chosen to give more robust inversions out of the box. If you relied on the old defaults, set them explicitly.

    |  | Parameter (`section`) | New default (was) | Why |
    |---|---|---|---|
    | i | `optimization.retrain_iceflow_model` | `false` (was `true`) | Keep the ice-flow emulator **fixed** during the inversion (use an off-line trained emulator). Retraining it on the evolving geometry tends to destabilise the optimisation. |
    | ii | `optimization.fix_opti_normalization_issue` | `true` (was `false`) | A normalisation issue in the cost was found; enabling this fixes it, so it is now on by default. |
    | iii | `regularization.convexity_weight` / `regularization.smooth_anisotropy_factor` | `0.0` / `1.0` (was `0.002` / `0.2`) | Convexity constraint and anisotropic smoothing are now **disabled** by default — advanced knobs you normally do not need. |

    See the [v3.1 → v3.2 migration guide](../../about/transition-IGM-3.1-to-3.2.md) for details.

!!! tip "Recommended setup for robust inversions"
    To keep the `data_assimilation` inversion robust, we strongly advise to:

    1. pick an **off-line trained iceflow emulator** (one that does not retrain over the iterations);
    2. limit the number of **controls to one** to keep the problem well-posed, avoiding multi-control optimisation.

    See the [Aletsch inversion tutorial](../../tutorials/aletsch_inversion.md) to get familiar with the module.

A data assimilation module in IGM allows users to determine the optimal ice thickness, top ice surface, and/or ice flow parameters that best match observational data, such as surface ice velocities, ice thickness profiles, and top ice surface elevation, while maintaining consistency with the ice flow emulator (`iceflow`) used in forward modeling. This page provides guidance on using the data assimilation module as a preparatory step for running a forward or prognostic model in IGM.

{{ render_module_io("data_assimilation") }}

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
- $\mathcal{R}^h$: Regularization term to enforce smoothness on $h$.
- $\mathcal{R}^A$: Regularization term to enforce smoothness on $A$.
- $\mathcal{R}^c$: Regularization term to enforce smoothness on $c$.
- $\mathcal{P}^h$: Penalty term to enforce nonnegative ice thickness.

This formulation ensures that the optimization problem is well-posed by balancing data fidelity terms ($\mathcal{C}$) with regularization and penalty terms ($\mathcal{R}$ and $\mathcal{P}$). Check at the reference paper for more explanation on each terms of the cost function.

### Define controls and cost components

The above optimization problem is given in the most general case. However, you may select only some components according to your data as follows:

- **Control Variables**: Specify the variables you wish to optimize. For example:
  ```json
  "assimilations.data_assimilation.control_list": ["thk", "slidingco", "usurf"]  # Optimize ice thickness, sliding coefficient, and surface elevation.
  "assimilations.data_assimilation.control_list": ["thk", "usurf"]  # Optimize ice thickness and surface elevation only.
  "assimilations.data_assimilation.control_list": ["thk"]  # Optimize ice thickness only.
  ```

- **Cost Components**: Specify the components of the cost function to minimize. For example:
  ```json
  "assimilations.data_assimilation.cost_list": ["velsurf", "thk", "usurf", "divfluxfcz", "icemask"]  # General case with multiple components.
  "assimilations.data_assimilation.cost_list": ["velsurf", "icemask"]  # Fit surface velocity and ice mask only.
  ```

**Recommendation**: Start with a simple optimization setup, such as a single control variable (`thk`) and a few cost components (`velsurf` and `icemask`). Gradually increase the complexity by adding more controls and cost components once the simpler setup yields meaningful results. Ensure a balance between controls and constraints to maintain a well-posed problem and avoid multiple solutions.
 
### Exploring parameters

There are parameters that may need to tune for each application.

First, you may adjust the expected confidence levels (i.e., tolerance to fit the data) $\sigma^u$, $\sigma^h$, $\sigma^s$, and $\sigma^d$ to better match surface ice velocity, ice thickness, surface top elevation, or flux divergence. These parameters can be configured as follows:

```json
"assimilations.data_assimilation.fitting.velsurfobs_std": 2.0 # unit m/y
"assimilations.data_assimilation.fitting.thkobs_std": 5.0     # unit m
"assimilations.data_assimilation.fitting.usurfobs_std": 5.0   # unit m
"assimilations.data_assimilation.fitting.divfluxobs_std": 1.0 # unit m/y
```

Second, you may adjust the **regularization weights** ($\alpha^h$, $\alpha^A$) that control the smoothness of the optimized fields: increasing them produces smoother ice-thickness and flow-parameter fields. These can be configured as follows:

```json
"assimilations.data_assimilation.regularization.thk": 300.0          # Regularization weight for ice thickness
"assimilations.data_assimilation.regularization.slidingco": 1.0      # Regularization weight for sliding coefficient
```

Lastly, there are a couple of other parameters we may be interest to change e.g.

```json
"assimilations.data_assimilation.optimization.nbitmax": 1000        # Number of it. for the optimization
"assimilations.data_assimilation.optimization.step_size": 0.9       # Step size in the optimization iterative algorithm
"assimilations.data_assimilation.optimization.init_zero_thk": True  # Force init zero ice thk (otherwise take thkinit)
```

**Note**: There is a version 2 for the thickness regularization that can be activated by setting `data_assimilation.regularization.thk_version` to 2 (default is 1). By switching to this new version, it adds second-order derivative terms to the minimization in addition to the first-order terms we had before. This "thin plate" approach may have added value over the former "membrane" approach. The consequence is that there are now 2 regularization parameters: `data_assimilation.regularization.thk_2nd_der` and `thk_1st_der`, but the first parameter seems to be the main control. From initial tests, it appears to give at least visually better bedrock results with the default parameters. This also seems to fix the chessboard issue that occurred with version 1 when using anisotropic smoothing. However, all of this needs further testing. Finally, there is one additional parameter `abl_acc_balance` that serves to weight the membrane rigidity more in the accumulation area than in the ablation areas, which are often deeper (at least for mountain glaciers) due to long-term glacial erosion. This is not active by default (i.e., 1 = no imbalance), but you may try setting it to 2.

### Parameter inference (S. Cook) 

There is also a further option: the convexity weight and the slidingco can be inferred automatically by the model. These values are calibrated only for IGM v2.2.1 and a particular set of costs and controls, and are based on a series of regressions calculated through manual inversions to find the best parameters for 50 glaciers of different types and sizes around the world (see Cook et al., forthcoming). In other words, they are purely empirical and are likely to be a bit off for any different set of costs and controls, but should work tolerably well on any glacier anywhere on the planet, as a starting point for parameter exploration. If this behaviour is desired, you MUST use RGI7.0 (C or G) and the oggm_shop module. If using C, you will also need to set the oggm_sub_entity_mask parameter to True. Within the optimize module, assimilations.data_assimilation.infer_params must also be set to true.

For small glaciers with no velocity observations, the model will also use volume-area scaling to provide an additional constraint within the inference framework — this all happens automatically, but note the `assimilations.data_assimilation.vol_std` parameter that you can adjust to control how much weight is given to volume (by default, this is 1000.0 — a very small cost — anywhere with velocity data, and 0.001 — a large cost — anywhere lacking velocity data. The parameter only controls the default value where other data are present; the 0.001 where there is no velocity data is hard-coded).

A final parameter - assimilations.data_assimilation.tidewater_glacier - can also be set to True to force the inference code to treat the glacier as a tidewater-type glacier. If the RGI identifies a glacier as tidewater, it will be treated as such anyway, but this parameter gives you the option to force it (note: setting the parameter to False - its default value - will not cause the model to treat RGI-identified tidewater glaciers as non-tidewater - there is no option to do that).

### Monitoring the Optimization

You can monitor the data assimilation process during inverse modeling in several ways:

- **Cost Components**: Verify that the components of the cost function decrease over time. The cost values are printed during the optimization process, and a graph summarizing the results is generated at the end.
- **Live Monitoring**: Set the parameters `"plot_result": true` and `"plt2d_live": true` to visualize the evolution of the optimized fields (e.g., ice thickness, surface ice speeds) in real-time. Additionally, observe the (hopefully decreasing) standard deviations displayed in the figures.
- **Post-Run Analysis**: After the run, examine the `optimize.nc` file, which contains the results of the optimization. Ensure this file is configured to be written during the process.
- **Flux Divergence Check**: If `divfluxfcz` is included in the parameter list `"assimilations.data_assimilation.cost"`, inspect the divergence of the flux to ensure it aligns with expectations.

### Relaxation

The parameter `data_assimilation.optimization.nb_relaxation_steps` (default value 0, meaning inactive) allows adding relaxation steps after the optimization. The idea is the following: during optimization, the algorithm always tries to enforce a smooth flux divergence field. This is currently done by adding divfluxfcz to the cost_list. However, I was never fully satisfied with the result, since this strong constraint often harms the fit to other quantities of interest. An alternative is to remove divfluxfcz from the cost_list and instead set nb_relaxation_steps, for example to 1000. In that case, a relaxation procedure is run after the optimization: we force the surface mass balance (SMB) to match a smoothed version of the flux divergence over 1000 iterations. The result is a slightly modified topg and usurf (within reasonable bounds), but with a much smoother flux divergence. Physically, this means that the data become consistent with ice physics, since the noisy flux divergence often observed in raw data or inversion output can be interpreted as a non-physical artifact. In short, I strongly recommend performing this relaxation in order to: i) prevent shocks when running the forward model, and ii) ensure that any inference from the flux divergence can be made without requiring additional ad-hoc smoothing.

### 3D Visualization

The `data_assimilation` module outputs VTP files alongside NetCDF files, which greatly helps visualize your optimized/shaped bedrock with ParaView. Additionally, there is also an output module `write_vtp` that outputs sequences of VTK files that can be read by ParaView, offering new 3D visualization capabilities.  

## Parameters

The complete default configuration file can be found here: [data_assimilation.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/assimilations/data_assimilation.yaml).

{% set config = load_yaml('../igm/conf/assimilations/data_assimilation.yaml') %}
{% set help = load_yaml('../igm/conf_help/assimilations/data_assimilation.yaml') %}
{% set header = load_yaml('../igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_tree.j2" %}

{{ render_contributors("data_assimilation") }}
