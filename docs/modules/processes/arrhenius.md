# Module `arrhenius`

!!! info "Brief summary"

    The `arrhenius` module computes the **vertically-averaged Arrhenius rate factor** `state.arrhenius` (MPa$^{-n}$ yr$^{-1}$) used by the `iceflow` solver to account for the temperature- and water-content-dependent viscosity of ice. It is a standalone companion to the `enthalpy` module — when `enthalpy` is active, place `arrhenius` immediately **after** it in the `override /processes` list so that each time step's temperature and water-content fields are fresh before the iceflow solve.

{{ render_module_io("arrhenius") }}

## Physical model

Ice viscosity depends on temperature through the Arrhenius relation. Using a two-regime law (cold / warm ice), the 3D rate factor is:

$$A(\mathbf{x}, z) = \left(1 + c_\omega \min(\omega, \omega_{\max})\right) A_r \exp\!\left(\frac{-Q_r}{R\, T_{\rm pa}}\right),$$

where $T_{\rm pa}$ is the pressure-adjusted temperature, $\omega$ is the water content, and the regime parameters $(A_r, Q_r)$ switch at a threshold temperature $T_{\rm threshold}$:

$$A_r = \begin{cases} A_{\rm cold},\; Q_r = Q_{\rm cold} & T_{\rm pa} < T_{\rm threshold} \\ A_{\rm warm},\; Q_r = Q_{\rm warm} & T_{\rm pa} \ge T_{\rm threshold} \end{cases}$$

Because viscosity (not the rate factor) should be averaged vertically, the module averages over $B = A^{-1/n}$ and converts back:

$$A_{\rm avg} = \left(\sum_k B_k \, w_k\right)^{-n},$$

where $w_k$ are the vertical quadrature weights from the iceflow discretization.

## Usage

The `arrhenius` module reads `state.T` and `state.omega` produced by `enthalpy`. A typical process list looks like:

```yaml
override /processes:
  - time
  - iceflow
  - thk
  - enthalpy
  - arrhenius   # must come after enthalpy
```

If neither `state.T` nor `state.omega` are available at initialization, the module skips the computation silently and relies on the value already stored in `state.arrhenius` (e.g. set by `iceflow` or loaded from a checkpoint).

## Parameters

Default configuration file ([arrhenius.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/arrhenius.yaml)):

~~~yaml
{% include "../../../../igm/conf/processes/arrhenius.yaml" %}
~~~

{{ render_contributors("arrhenius") }}
