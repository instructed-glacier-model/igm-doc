# Module `clim_station`

{{ render_module_io("clim_station") }}

The `clim_station` module generates spatially distributed **temperature** and **precipitation** fields from simplified climate parameters, representing a weather-station-type forcing. It is designed for mountain glacier simulations where climate is characterised by a local temperature lapse rate and a precipitation-altitude relationship, and where a time series of temperature and precipitation offsets drives the climate change signal.

At each update, the module:

1. Computes a reference temperature field from the zero-degree isotherm elevation and the adiabatic lapse rate.
2. Adds an optional sinusoidal seasonal cycle (cosine approximation).
3. Computes a precipitation field using an altitude-dependent lapse rate relative to a reference station value.
4. Applies user-specified time-dependent temperature and precipitation offsets (`climate_change_array`).
5. Adjusts both fields for changes in ice surface elevation relative to the initial surface.

This module is a lightweight alternative to `clim_oggm` when OGGM data is not available or when a simple station-based approach is preferred.

## Parameters

Default configuration file ([clim_station.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/clim_station.yaml)):

~~~yaml
{% include  "../../../../igm/conf/processes/clim_station.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/clim_station.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/clim_station.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}

{{ render_contributors("clim_station") }}
