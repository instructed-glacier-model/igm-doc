# Module `smb_oggm`

Module `smb_oggm` implements the monthly temperature index model calibrated on geodetic mass balance (MB) data (Hugonnet, 2021) by OGGM. The yearly surface mass balance is computed with:

$$SMB = \frac{\rho_w}{\rho_i}  \sum_{i=1}^{12} \left( P_i^{sol} - d_f \max \{ T_i - T_{melt}, 0 \} \right),$$

where $P_i^{sol}$ is the monthly solid precipitation, $T_i$ is the monthly temperature, and $T_{melt}$ is the air temperature above which ice melt is assumed to occur (parameter `temp_melt`). The parameter $d_f$ is the melt factor (parameter `melt_f`), and $\frac{\rho_w}{\rho_i}$ is the ratio of water to ice density. Solid precipitation $P_i^{sol}$ is computed from precipitation and temperature such that it equals precipitation when the temperature is lower than a certain threshold (parameter `temp_all_solid`), zero above another threshold (parameter `temp_all_liq`), with a linear transition between the two. Module `oggm_shop` provides all calibrated parameters [1].

**Contributors:** Guillaume Jouvet, Fabien Maussion

**Reference:** Maussion, Fabien, et al. "The open global glacier model (OGGM) v1. 1." Geoscientific Model Development 12.3 (2019): 909-931.


## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/smb_oggm.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/processes/smb_oggm.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/smb_oggm.yaml') %}
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
