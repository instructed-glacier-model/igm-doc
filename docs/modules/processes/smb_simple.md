# Module `smb_simple`
{{ render_module_io("smb_simple") }}

This IGM module models a simple surface mass balance (SMB) parametrized by time-evolving equilibrium line altitude (ELA) $z_{ELA}$, ablation gradient $\beta_{abl}$, accumulation gradient $\beta_{acc}$, and maximum accumulation $m_{acc}$ parameters:

$$SMB(z) = 
\begin{cases} 
\min(\beta_{acc} \cdot (z - z_{ELA}), m_{acc}) & \text{if } z > z_{ELA}, \\
\beta_{abl} \cdot (z - z_{ELA}) & \text{otherwise}.
\end{cases}$$

These parameters can be provided in a file (specified by the `file` parameter) with the following format:

```dat
time   gradabl  gradacc    ela   accmax
1900     0.009    0.005   2800      2.0
2000     0.009    0.005   2900      2.0
2100     0.009    0.005   3300      2.0
```

Alternatively, they can be directly specified in the configuration file `params.yaml` as follows:

```yaml
smb_simple:
  array: 
    - ["time", "gradabl", "gradacc", "ela", "accmax"]
    - [ 1900,      0.009,     0.005,  2800,      2.0]
    - [ 2000,      0.009,     0.005,  2900,      2.0]
    - [ 2100,      0.009,     0.005,  3300,      2.0]
```

If the `array` parameter is set to an empty list `[]`, the module will read the data from the file specified by the `file` parameter. Otherwise, it will use the provided `array` (a list of lists).

The module computes the surface mass balance at a frequency defined by the `update_freq` parameter (default is 1 year) and interpolates the four parameters linearly over time.

If an "icemask" field is provided as input, the module will assign a negative surface mass balance (-10 m/y) to areas where a positive surface mass balance would otherwise occur outside the mask. This prevents overflow into neighboring catchments.
## Parameters

Default configuration file ([smb_simple.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/smb_simple.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/smb_simple.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/smb_simple.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/smb_simple.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}

{{ render_contributors("smb_simple") }}
