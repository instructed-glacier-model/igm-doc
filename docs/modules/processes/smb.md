# Module `smb`

!!! info "Brief summary"

    The `smb` module is a **unified dispatcher** for surface mass balance computation. It delegates to one of three implementations selected by the `method` parameter: `simple`, `oggm`, or `accpdd`. This consolidates the legacy `smb_simple`, `smb_oggm`, and `smb_accpdd` modules under a single entry point with a consistent interface.

{{ render_module_io("smb") }}

## Choosing a method

Set `processes.smb.method` in your configuration:

```yaml
processes:
  smb:
    method: simple   # or: oggm | accpdd
```

---

## Method: `simple`

Mirrors the legacy `smb_simple` module. Models a simple SMB parametrized by a time-evolving equilibrium line altitude (ELA) $z_{\rm ELA}$, ablation gradient $\beta_{\rm abl}$, accumulation gradient $\beta_{\rm acc}$, and maximum accumulation $m_{\rm acc}$:

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

If `array` is empty (`[]`), the module reads from the file specified by `file`.

If an `icemask` field is present, the module assigns $-10\,\mathrm{m\,yr^{-1}}$ to areas where positive SMB would otherwise occur outside the mask.

---

## Method: `oggm`

Mirrors the legacy `smb_oggm` module. Implements the monthly temperature-index model calibrated on geodetic mass balance data [@Hugonnet2021] by OGGM. The yearly SMB is:

$$\mathrm{SMB} = \frac{\rho_w}{\rho_i} \sum_{i=1}^{12} \Bigl(P_i^{\rm sol} - d_f \max\{T_i - T_{\rm melt},\,0\}\Bigr),$$

where $P_i^{\rm sol}$ is monthly solid precipitation, $T_i$ is monthly temperature, $d_f$ is the melt factor, and $T_{\rm melt}$ is the melt threshold. All calibrated parameters are provided by the `oggm_shop` module [@Maussion2019]. Requires `state.precipitation` and `state.air_temp` (e.g. from the `climate` module with `method: oggm`).

---

## Method: `accpdd`

Mirrors the legacy `smb_accpdd` module. Implements a combined accumulation and temperature-index model [@Hock2003]. Accumulation equals solid precipitation when temperature is below a threshold and decreases linearly to zero in a transition zone. Ablation is proportional to the number of Positive Degree Days (PDD). The model tracks snow layer depth and applies different PDD factors for snow and ice.

PDD computation uses the expectation-integration formulation [@Calov2005]. The snowpack and refreezing parameterisation follows the PyPDD and PISM implementations [@Seguinot2019]. Requires `state.precipitation`, `state.air_temp`, and optionally `state.air_temp_sd`.

## Parameters

Default configuration file ([smb.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/smb.yaml)):

~~~yaml
{% include "../../../../igm/conf/processes/smb.yaml" %}
~~~

{{ render_contributors("smb") }}
