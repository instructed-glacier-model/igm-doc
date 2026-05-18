# Module `time`

This IGM module computes the time step such that:  
i) It satisfies the CFL condition (controlled by the parameter `processes.time.cfl`).  
ii) It is lower than a given maximum time step (controlled by the parameter `processes.time.step_max`).  
iii) It aligns exactly with specified saving times (controlled by the parameter `processes.time.save`).  

The module also updates the current simulation time $t$ in addition to determining the time step.

{{ render_module_io("time") }}

For stability reasons related to the transport scheme for ice thickness evolution, the time step must adhere to the CFL condition. This condition is governed by the parameter `processes.time.cfl`, which specifies the maximum number of cells that can be crossed in one iteration (this parameter cannot exceed 1). By default, `processes.time.cfl` is set to 0.3. Additionally, the time step is constrained by a user-defined maximum time step, `processes.time.step_max`, and must align with the saving frequency defined by `processes.time.save` (default: 1 year).

Key parameters of this module include:  
- `processes.time.start`: Defines the simulation start time.  
- `processes.time.end`: Defines the simulation end time.  
- `processes.time.save`: Specifies the frequency at which results are saved (default: 10 years).

Further details on the time step stability conditions can be found in the following paper: [@Jouvet2021]   

**Contributors:** G. Jouvet.

## Parameters

Default configuration file ([time.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/time.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/time.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/time.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/time.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
