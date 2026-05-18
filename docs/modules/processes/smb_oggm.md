# Module `smb_oggm`

Module `smb_oggm` implements the monthly temperature index model calibrated on geodetic mass balance (MB) data [@Hugonnet2021] by OGGM. The yearly surface mass balance is computed with:

$$SMB = \frac{\rho_w}{\rho_i}  \sum_{i=1}^{12} \left( P_i^{sol} - d_f \max \{ T_i - T_{melt}, 0 \} \right),$$

where $P_i^{sol}$ is the monthly solid precipitation, $T_i$ is the monthly temperature, and $T_{melt}$ is the air temperature above which ice melt is assumed to occur (parameter `temp_melt`). The parameter $d_f$ is the melt factor (parameter `melt_f`), and $\frac{\rho_w}{\rho_i}$ is the ratio of water to ice density. Solid precipitation $P_i^{sol}$ is computed from precipitation and temperature such that it equals precipitation when the temperature is lower than a certain threshold (parameter `temp_all_solid`), zero above another threshold (parameter `temp_all_liq`), with a linear transition between the two. Module `oggm_shop` provides all calibrated parameters [@Maussion2019].

**Contributors:** Guillaume Jouvet, Fabien Maussion.

{{ render_module_io("smb_oggm") }}

## Parameters

Default configuration file ([smb_oggm.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/smb_oggm.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/smb_oggm.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/smb_oggm.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/smb_oggm.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
