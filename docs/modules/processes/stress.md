# Module `stress`

!!! info "Brief summary"

    The `stress` module computes the **full 3D deviatoric stress tensor** and principal stress invariants from the ice velocity field produced by `iceflow`. It is a diagnostic module — it does not modify `thk` or any prognostic variable — and is intended for post-processing, damage mechanics studies, or validation.

{{ render_module_io("stress") }}

## Physical model

Given the 3D velocity field $(U, V)$ and the Arrhenius viscosity factor, the module computes:

1. **Strain-rate tensor** components $(E_{xx}, E_{yy}, E_{zz}, E_{xy}, E_{xz}, E_{yz})$ using 4th-order central differences in the horizontal directions and 2nd-order finite differences vertically.
2. **Effective viscosity** $\mu$ from Glen's flow law:
$$\mu = \frac{1}{2}\, B\, \dot\varepsilon_e^{1/n - 1}, \qquad B = A^{-1/n},$$
where $\dot\varepsilon_e$ is the effective strain rate and $n$ is the Glen exponent.
3. **Deviatoric stress components** $\tau_{ij} = 2\mu E_{ij}$.
4. **Hydrostatic pressure** $p = \rho_i g\, d \times 10^{-6}$ (MPa), where $d$ is ice depth.
5. **Stress invariants**:
    - $\tau_{II}$ — second invariant of the deviatoric stress tensor (effective shear stress)
    - $\sigma_1$ — largest principal stress minus hydrostatic pressure
    - $\sigma_I = -3p$ — first stress invariant (isotropic stress)

## Usage

Place `stress` after `iceflow` and `arrhenius` in the process list so that velocities and the Arrhenius factor are up to date:

```yaml
override /processes:
  - time
  - iceflow
  - arrhenius
  - stress
  - thk
```

## Parameters

Default configuration file ([stress.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/stress.yaml)):

~~~yaml
{% include "../../../../igm/conf/processes/stress.yaml" %}
~~~

{{ render_contributors("stress") }}
