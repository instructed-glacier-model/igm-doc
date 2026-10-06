# Module `smb`

!!! info "Brief summary"

    The `smb` module is a **unified dispatcher** for surface mass balance computation. It delegates to one of three implementations selected by the `method` parameter: `simple`, `oggm`, or `accpdd`, under a single entry point with a consistent interface.

{{ render_module_io("smb") }}

!!! note "Units"
    The `oggm` and `accpdd` methods take `state.precipitation` in kg m⁻² yr⁻¹, i.e. **mm water equivalent per year**, and `state.air_temp` in °C (as produced by the `climate` module). Accumulation and melt are computed in water equivalent; the resulting `state.smb` is converted once, at the end, to **m ice equivalent per year**.

## Choosing a method

Set `processes.smb.method` in your configuration:

```yaml
processes:
  smb:
    method: simple   # or: oggm | accpdd
```

---

## Method: `simple`

Models a simple SMB parametrized by a time-evolving equilibrium line altitude (ELA) $z_{\rm ELA}$, ablation gradient $\beta_{\rm abl}$, accumulation gradient $\beta_{\rm acc}$, and maximum accumulation $m_{\rm acc}$:

$$\mathrm{SMB}(z) = \begin{cases} \min(\beta_{\rm acc}\cdot(z - z_{\rm ELA}),\, m_{\rm acc}) & z > z_{\rm ELA} \\ \beta_{\rm abl}\cdot(z - z_{\rm ELA}) & \text{otherwise} \end{cases}$$

Parameters can be provided as an inline array:

```yaml
processes:
  smb:
    method: simple
    simple:
      array:
        - ["time", "gradabl", "gradacc", "ela", "accmax"]
        - [ 1900,      0.009,     0.005,  2800,      2.0]
        - [ 2100,      0.009,     0.005,  3300,      2.0]
```

If `array` is empty (`[]`), the module reads from the file specified by `file`. The four parameters are interpolated linearly over time and the SMB is recomputed every `update_freq` years (default 1).

If an `icemask` field is present, the module assigns $-10\,\mathrm{m\,yr^{-1}}$ to areas where positive SMB would otherwise occur outside the mask, preventing overflow into neighbouring catchments.

---
### Add-on: correction for insolation (North-South correction with a simple ELA model)

The `simple` method can optionally account for the effect of slope and aspect on the received solar radiation ([Henz et al., 2025](https://doi.org/10.5194/tc-19-5913-2025)). Instead of a uniform ELA, a spatially varying ELA $z_{\rm ELA}^{*}(x,y)$ is used, shifted according to the difference between the solar incidence angle on the local surface and on a flat surface:

$$z_{\rm ELA}^{*}(x,y) = z_{\rm ELA} + c \cdot \bigl( (90^\circ - \alpha) - \varphi(x,y) \bigr),$$

where $\alpha$ is the solar elevation angle, $90^\circ - \alpha$ is the incidence angle on a flat surface, $c$ is the ELA shift per degree of incidence angle (`ela_per_degree_incidence`, in m per degree), and $\varphi(x,y)$ is the incidence angle between the surface normal vector $\mathbf{n}$ and the sun vector $\mathbf{s}$:

$$\cos(\varphi) = \frac{\mathbf{n} \cdot \mathbf{s}}{\|\thinspace\mathbf{n}\| \|\mathbf{s}\thinspace\|}.$$

The surface normal vector is computed from the gradients of the ice surface elevation $z$:

$$\mathbf{n} = \left( -\frac{\partial z}{\partial x}\, -\frac{\partial z}{\partial y}\, 1 \right).$$

The sun vector is determined by the solar elevation angle $\alpha$ (`solar_elevation`) and the solar azimuth angle $\beta$ (`solar_azimuth`, clockwise from north):

$$\mathbf{s} = \bigl( \cos(\alpha)\sin(\beta)\, \cos(\alpha)\cos(\beta)\, \sin(\alpha) \bigr).$$

By default, the sun is positioned in the south ($\beta = 180^\circ$) at an elevation of $\alpha = 60^\circ$ above the horizon, which is typical for Central Europe in June.

Sun-facing slopes ($\varphi < 90^\circ - \alpha$) get a higher ELA and therefore more melt, shaded slopes a lower ELA. On a flat surface the ELA is unchanged. The corrected ELA $z_{\rm ELA}^{*}$ then replaces $z_{\rm ELA}$ in the SMB formula above. Because the correction follows the evolving ice surface, it is recomputed at every SMB update.

The correction is off by default.

```yaml
processes:
  smb:
    method: simple
    simple:
      correction_for_insolation:
        enabled: false                  # change here to true to switch it on
        solar_elevation: 60.0           # degrees above the horizon (for summer in the European Alps, 60° is around noon)
        solar_azimuth: 180.0            # degrees clockwise from north (180° = sun from the south)
        ela_per_degree_incidence: 5.0   # m of ELA shift per degree of incidence angle
        plot_insolation_check: false
```

or from the command line: `processes.smb.simple.correction_for_insolation.enabled=true`.

!!! tip "Check the orientation"
    The correction depends on the orientation of the input grid. When using a new domain, set `plot_insolation_check: true` once: at the first SMB update a figure `check_insolation_correction.png` is written to the run folder, showing the surface topography next to the ELA shift (north up). South-facing slopes (Northern Hemisphere) should show a positive shift.

---


## Method: `oggm`

Implements the monthly temperature-index model calibrated on geodetic mass balance data [@Hugonnet2021] by OGGM. The yearly SMB is:

$$\mathrm{SMB} = \frac{\rho_w}{\rho_i} \sum_{i=1}^{12} \Bigl(P_i^{\rm sol} - d_f \max\{T_i - T_{\rm melt},\,0\}\Bigr),$$

where $P_i^{\rm sol}$ is monthly solid precipitation, $T_i$ is monthly temperature, $d_f$ is the melt factor (`melt_f`), and $T_{\rm melt}$ is the melt threshold (`temp_melt`). Solid precipitation equals total precipitation below `temp_all_solid`, drops to zero above `temp_all_liq`, with a linear transition in between. All calibrated parameters are provided by the `oggm_shop` module [@Maussion2019]. Requires `state.precipitation` and `state.air_temp` (e.g. from the `climate` module with `method: oggm`).

---

## Method: `accpdd`

Implements a combined accumulation and temperature-index model [@Hock2003]. Accumulation equals solid precipitation when temperature is below a threshold and decreases linearly to zero in a transition zone. Ablation is proportional to the number of Positive Degree Days (PDD). The model tracks snow layer depth and applies different PDD factors for snow and ice.

PDD computation uses the expectation-integration formulation [@Calov2005]. The snowpack and refreezing parameterisation follows the PyPDD and PISM implementations [@Seguinot2019]. Requires `state.precipitation`, `state.air_temp`, and optionally `state.air_temp_sd`.

## Parameters

Default configuration file ([smb.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/smb.yaml)):

~~~yaml
{% include "../../../../igm/conf/processes/smb.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/smb.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/smb.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_tree.j2" %}

{{ render_contributors("smb") }}
