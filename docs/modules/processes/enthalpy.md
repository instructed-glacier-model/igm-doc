# Module `enthalpy`

!!! info "Brief summary"

    The `enthalpy` module determines the **thermal profile** in the ice. It uses an **enthalpy**-based approach that solves for both cold and temperate ice regions simultaneously [@Aschwanden2012]. The enthalpy module requires the `iceflow` module as it depends on ice velocity. In turn, the enthalpy determines the basal friction coefficient and the Arrhenius factor, which are used for ice-flow computation. The **parameters** of the module are described [here](#parameters).

!!! warning "New variable names"

    Some enthalpy variables and parameters have been renamed for clarity. The following state variables have been changed:

    | Previous name | New name |
    | -------- | ------- |
    | `basalMeltRate` | `basal_melt_rate` |
    | `bheatflx` | `basal_heat_flux` |
    | `tillwat` | `h_water_till` |
    | `Tpmp` | `T_pmp` |
    | `Epmp` | `E_pmp` |
    | `surftemp` | `T_s` |
    | `surfenth` | `E_s` |

    See the [parameters section](#parameters) for parameter name changes.

The implementation is largely inspired by [PISM](https://www.pism.io/) [@Aschwanden2012]. Other references have also helped verify the implementation through benchmarks [@Kleiner2015; @Wang2020]. The `enthalpy` module will be described in further detail in the in-preparation paper for IGM 3 [@Jouvet2026].


## Physical model

The thermal state of glaciers can be complex, with some regions at the pressure-melting point while others are not. Two ice regimes are typically defined:

* **cold ice:** $T < T_\mathrm{pmp}$ and $\omega = 0$;
* **temperate ice:** $T = T_\mathrm{pmp}$ and $0 < \omega \le 1$.

Here, $T$ denotes ice temperature and $\omega$ is the water content. The pressure-melting-point temperature $T_\mathrm{pmp}$ depends on pressure through the Clausius-Clapeyron relation, so we may write $T_\mathrm{pmp}=T_\mathrm{pmp}(p)$ with $p$ the ice pressure. To avoid dealing with two variables $(T, \omega)$, it is convenient to introduce the **enthalpy** as follows:

$$
E = 
\left\{
\begin{aligned}
&E_\mathrm{pmp} + c_\mathrm{i}\,(T - T_\mathrm{pmp}), & \quad \text{(cold ice)}\\
&E_\mathrm{pmp} + L\,\omega,& \quad \text{(temperate ice)}
\end{aligned}
\right.
$$

where $c_\mathrm{i}$ and $L$ are the specific heat capacity and latent heat of ice, respectively. Importantly, each value of $E$ corresponds to a unique state $(T, \omega)$, so the values of these variables can be inferred once $E$ is known.

Since enthalpy can be defined up to an additive constant, we can choose the value of $E_\mathrm{pmp}$; here, we choose it in a such a way that the enthalpy is zero at a reference temperature $T_\mathrm{ref}$:
$$
    E_\mathrm{pmp} = c_\mathrm{i}(T_\mathrm{pmp} - T_\mathrm{ref}).
$$

Based on energy conservation, the governing equation for enthalpy takes the form of the following partial differential equation:

$$
    \rho_\mathrm{i} \left(\dfrac{\partial E}{\partial t} + u\,\dfrac{\partial E}{\partial x} + v\,\dfrac{\partial E}{\partial y} + w\,\dfrac{\partial E}{\partial z}\right) = \dfrac{\partial}{\partial z} \left(K \,\dfrac{\partial E}{\partial z}\right) + \Phi - \rho_\mathrm{w} L D_\mathrm{w} (\omega),
$$

together with suitable boundary conditions [@Aschwanden2012]. Here, $\rho_\mathrm{i}$ is the ice density, $\rho_\mathrm{w}$ is the liquid water density, $\mathbf{v}=(u, v, w)$ are the velocity components in the ice along each direction, $K$ is the effective enthalpy diffusivity, $\Phi=\Phi(\mathbf{v})$ is the strain heating, and $D_\mathrm{w}$ is a drainage function. The enthalpy diffusivity depends on the thermal state of the ice; here we follow the usual approach in ice-sheet modeling by writing 

$$
K = 
\left\{
\begin{aligned}
&k_\mathrm{i}/c_\mathrm{i}, & \quad \text{(cold ice)}\\
&\epsilon\,k_\mathrm{i}/c_\mathrm{i},& \quad \text{(temperate ice)}
\end{aligned}
\right.
$$

where $k_\mathrm{i}$ is the thermal conductivity of ice and $\epsilon \ll 1$ denotes the ratio of temperate to cold ice diffusivity.  

## Numerical solution

At each time step, the enthalpy module performs the following operations:

1. Computation of surface conditions $(T_\mathrm{s}, E_\mathrm{s})$.
2. Computation of pressure-melting point conditions $(T_\mathrm{pmp}, E_\mathrm{pmp})$.
3. Solution of the equation for $E$.
4. Computation of the thermal state $(T, \omega)$.
5. Computation of the Arrhenius factor $A$.
6. Computation of till hydrology conditions.
7. Computation of till friction conditions.

The computationally intensive step is solving the equation for $E$. To achieve this efficiently, we use an operator splitting method:

* first, solve the horizontal advection equation with an explicit backward Euler method;
* then, solve the vertical advection-diffusion equation with an implicit solver.

The implicit solver consists of the Thomas algorithm for tridiagonal linear systems, applied simultaneously to each vertical ice column.

## Coupling with ice flow

The enthalpy module builds upon the `iceflow` module. To activate the coupling, set the following option:

```yaml
processes.iceflow.physics.sliding.law = weertman
```

To ensure proper functionality, also activate `vertical_iceflow`, use a relatively fine vertical discretization, and ensure sufficient retraining.

## Parameters

The complete default configuration file can be found here: [enthalpy.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/enthalpy.yaml).

{% set config = load_yaml('../igm/conf/processes/enthalpy.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/enthalpy.yaml') %}
{% set header = load_yaml('../igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_tree.j2" %}

**Contributors**: G. Jouvet, T. Gregov, L. Bacchin.
