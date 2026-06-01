# Module `climate`

!!! info "Brief summary"

    The `climate` module is a **unified dispatcher** for atmospheric forcing. It delegates to one of four implementations selected by the `method` parameter: `simple`, `oggm`, `glacialindex`, or `station`. This consolidates the legacy `clim_oggm`, `clim_glacialindex`, and `clim_station` modules under a single entry point with a consistent interface.

{{ render_module_io("climate") }}

## Choosing a method

Set `processes.climate.method` in your configuration:

```yaml
processes:
  climate:
    method: simple   # or: oggm | glacialindex | station
```

---

## Method: `simple`

A lightweight station-type forcing that computes spatially distributed monthly **temperature** and **precipitation** fields from a reference value and lapse rates. Suitable for idealized experiments or when neither OGGM data nor full climate files are available.

At each update the module:

1. Distributes temperature from a reference elevation using a constant lapse rate.
2. Optionally adds a sinusoidal seasonal cycle.
3. Distributes precipitation from a reference station value using an altitude-dependent lapse rate.
4. Generates 12-month fields for compatibility with SMB modules that expect monthly forcing.

---

## Method: `oggm`

Mirrors the legacy `clim_oggm` module. Processes monthly historical climate data from the GSWP3-W5E5 dataset obtained via the `oggm_shop` module. It generates monthly 2D raster fields for corrected precipitation, mean temperature, and temperature variability. The module applies a multiplicative correction factor to precipitation (`prcp_fac`) and a bias correction to temperature (`temp_bias`). Temperature is extrapolated across the glacier surface using a reference height and a constant lapse rate.

The module also supports generating climate data beyond the observational time frame by defining a reference period (`ref_period`) to randomly select years within it, then applying a user-defined temperature bias and precipitation scaling over time:

```dat
time   delta_temp  prec_scal
1900          0.0        1.0
2020          0.0        1.0
2100          4.0        1.0
```

If `clim_trend_array` is an empty list, the module reads from the file specified by `file`.

---

## Method: `glacialindex`

Mirrors the legacy `clim_glacialindex` module. Loads two climate snapshots corresponding to two end-member states and interpolates them using a climate signal and a glacial index [@Jouvet2023]. Suitable for palaeo-glacier modelling.

A function GI($t$) maps time to a scalar between 0 and 1, with GI=0 corresponding to nearly ice-free conditions ($\mathrm{CL}_0$) and GI=1 to maximum glaciation ($\mathrm{CL}_1$):

$$\mathrm{CL}(t) = \mathrm{GI}(t)\times \mathrm{CL}_1 + (1 - \mathrm{GI}(t))\times \mathrm{CL}_0.$$

Temperature is corrected for differences in surface elevation between the modeled ice surface and the two reference topographies using a vertical lapse rate.

---

## Method: `station`

Mirrors the legacy `clim_station` module. Generates spatially distributed **temperature** and **precipitation** fields from simplified climate parameters representing a weather-station-type forcing. Designed for mountain glacier simulations where climate is characterised by a local temperature lapse rate and a precipitation-altitude relationship.

At each update the module:

1. Computes a reference temperature field from the zero-degree isotherm elevation and the adiabatic lapse rate.
2. Adds an optional sinusoidal seasonal cycle (cosine approximation).
3. Computes a precipitation field using an altitude-dependent lapse rate relative to a reference station value.
4. Applies user-specified time-dependent temperature and precipitation offsets (`climate_change_array`).
5. Adjusts both fields for changes in ice surface elevation relative to the initial surface.

## Parameters

Default configuration file ([climate.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/climate.yaml)):

~~~yaml
{% include "../../../../igm/conf/processes/climate.yaml" %}
~~~

{{ render_contributors("climate") }}
