# Module `smb_simple`
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

**Contributors:** G. Jouvet

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/smb_simple.yaml" %}
~~~

## Arguments
{% set config = load_yaml('igm/igm/conf/processes/smb_simple.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/smb_simple.yaml') %}
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
