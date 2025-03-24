# smb_simple

This IGM modules models a simple surface mass balance model parametrized by time-evolving ELA $z_{ELA}$, ablation $\beta_{abl}$ and accumulation $\beta_{acc}$ gradients, and max accumulation $m_{acc}$ parameters:

$$SMB(z)=min(\beta_{acc} (z-z_{ELA}),m_{acc})\quad\textrm{if}\;z>z_{ELA},$$
$$SMB(z)=\beta_{abl} (z-z_{ELA})\quad\textrm{else}.$$

 These parameters may be given in file (file name given in `smb_simple_file` parameter), which look like this

```dat
time   gradabl  gradacc    ela   accmax
1900     0.009    0.005   2800      2.0
2000     0.009    0.005   2900      2.0
2100     0.009    0.005   3300      2.0
```

 or directly as parameter in the cconfig `params.json` file:

```json
"smb_simple_array": [ 
                     ["time", "gradabl", "gradacc", "ela", "accmax"],
                     [ 1900,      0.009,     0.005,  2800,      2.0],
                     [ 2000,      0.009,     0.005,  2900,      2.0],
                     [ 2100,      0.009,     0.005,  3300,      2.0]
                    ],
```

If parameter `smb_simple_array` is set to empty list `[]`, then it will read the file `smb_simple_file`, otherwise it read the array `smb_simple_array` (which is here in fact a list of list).

The module will compute surface mass balance at a frequency given by parameter `smb_simple_update_freq` (default is 1 year), and interpolate linearly the 4 parameters in time.

If one has provided in input an "icemask" field, then this module will compute negative surface mass balance (-10 m/y) in place where posstive surface mass balance outside the mask were originally computed. The goal here is to prevent against overflowing in neibourghing catchements.

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

## Example Usage