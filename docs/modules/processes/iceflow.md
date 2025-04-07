# Module `iceflow`

This IGM module models ice flow dynamics in 3D using a Convolutional Neural Network (CNN) based on a Physics-Informed Neural Network (PINN), as described in [1]. Specifically, the CNN is trained to minimize the energy associated with high-order ice flow equations during the time iterations of a glacier evolution model. Consequently, it serves as a computationally efficient alternative to traditional solvers, capable of handling diverse ice flow regimes. **Check at the IGM technical paper for further details [1].**

[1] Concepts and capabilities of the Instructed Glacier Model 3.X.X, Jouvet and al.
 
Pre-trained emulators are provided by default. However, one may start from scratch by setting `processes.iceflow.emulator.name=""`. The key parameters to consider in this case are:

- Physical parameters:

```json 
"processes.iceflow.physics.init_slidingco": 0.045    # Init slid. coeff. ($Mpa y^{1/3} m^{-1/3}$)
"processes.iceflow.physics.init_arrhenius": 78.0     # Init Arrhenius cts ($Mpa^{-3} y^{-1}$)
"processes.iceflow.physics.exp_glen": 3              # Glen's exponent
"processes.iceflow.physics.exp_weertman":  3         # Weertman's sliding law exponent
```

- Numerical parameters for the vertical discretization:

```json 
"processes.iceflow.numerics.Nz": 10                 # number of vertical layers
"processes.iceflow.numerics.vert_spacing": 4.0      # 1.0 for equal vertical spacing, 4.0 otherwise
```

- Learning rate and frequency of retraining:

```json 
"processes.iceflow.emulator.lr": 0.00002 
"processes.iceflow.emulator.retrain_freq": 5     
```

While this module was targeted for deep learning emulation, it is possible to use the solver (`processes.iceflow.method='solved'`) instead of the default (`processes.iceflow.method='emulated'`), or use the two together (`processes.iceflow.method='diagnostic'`) to assess the emulator against the solver. The most important parameters for solving are:

```json
"processes.iceflow.solve.step_size": 0.00002 
"processes.iceflow.solve.nbitmax": 5         
```

One may choose between a 2D Arrhenius factor or a 3D Arrhenius factor by setting the parameter `processes.iceflow.dim_arrhenius` to `2` or `3`, respectively. The 3D option is required for the enthalpy model.

When treating very large arrays, retraining must be done sequentially in a patch-wise manner due to memory constraints. The size of the patch is controlled by the parameter `processes.iceflow.multiple_window_size=750`.

**Contributors:** G. Jouvet
 
## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/iceflow.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/processes/iceflow.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/iceflow.yaml') %}
{% set header = load_yaml('igm/igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table.j2" %}