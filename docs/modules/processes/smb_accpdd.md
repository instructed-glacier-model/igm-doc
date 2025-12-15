# Module `smb_accpdd`

Module `smb_accpdd` implements a combined accumulation and temperature-index model [@Hock2003]. In this model, surface accumulation equals solid precipitation when the temperature is below a threshold and decreases linearly to zero in a transition zone. Conversely, surface ablation is computed proportionally to the number of Positive Degree Days (PDD). The model also tracks snow layer depth and applies different PDD proportionality factors for snow and ice. 

The computation of PDD uses the expectation integration formulation [@Calov2005]. Additionally, the computation of the snowpack and refreezing parameters is adapted from the PyPDD and PISM implementations.

### Input
- `state.precipitation` [Unit: kg m$^{-2}$ y$^{-1}$ water equivalent]
- `state.air_temp` [Unit: $^{\circ}$C]

### Output
- `state.smb` [Unit: m ice eq. y$^{-1}$]

**Contributors:** G. Jouvet.

Note: This implementation is a TensorFlow re-implementation inspired by the one used in the Aletsch 1880–2100 example. It has been adapted to closely align (though not strictly) with the Positive Degree Day model implemented in PyPDD [@Seguinot2019], which is utilized in the Parallel Ice Sheet Model (PISM; [www.pism-docs.org](http://www.pism-docs.org))

## Parameters

Default configuration file ([smb_accpdd.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/smb_accpdd.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/smb_accpdd.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/smb_accpdd.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/smb_accpdd.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}