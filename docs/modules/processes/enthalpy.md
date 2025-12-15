# Module `enthalpy`

**Warning: this rather complex module was not much tested so far, use it with care!**

# Description:

This IGM module models the ice enthalpy, which permits to jointly model the ice temperature, as well as the water content created when the temperature hits the pressure melting points, and therefore energy conservation, which is not the case when modelling the sole temperature variable. The model is described in [@Aschwanden2012] [@Aschwanden2012]. **Check at the IGM technical paper for further details [@Jouvet2026].**

The enthalpy module builds upon the `iceflow` module. To ensure proper functionality, follow these requirements:

- Activate the `vertical_iceflow` module to provide the vertical velocity.
- Set `params.dim_arrhenius = 3`.
- Set `params.new_friction_param = true`.
- Ensure sufficient retraining by setting `retrain_iceflow_emulator_freq = 1`. Optionally, set `retrain_iceflow_emulator_nbit` to a value greater than 1 for improved performance.

**Contributors:** G. Jouvet.

This implementation is largely inspired from the one implemented in [PISM](https://www.pism.io/). Other references that have helped are [@Kleiner2015] and [@Wang2020].

## Parameters

Default configuration file ([enthalpy.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/enthalpy.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/enthalpy.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/enthalpy.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/enthalpy.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
