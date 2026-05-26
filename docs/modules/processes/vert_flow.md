# Module `vert_flow`

!!! info "Brief summary"

    The `vert_flow` module computes the **vertical velocity** $w$ from the horizontal velocity components $(u, v)$ provided by the `iceflow` module. Two methods are available: **kinematic** (layer-following) and **incompressibility** (divergence-free). This module is required before invoking the `particle` module for 3D trajectory integration or the `enthalpy` module for 3D advection-diffusion.

{{ render_module_io("vert_flow") }}

## Terrain-following coordinate system

Ice flow simulations use a terrain-following vertical coordinate 

$$
\zeta = \frac{z - b(x,y)}{H(x,y)},
$$

where $z$ is the physical height, $b(x,y)$ is the bed elevation, and $H(x,y)$ is the ice thickness. In this coordinate system, $\zeta = 0$ at the bed and $\zeta = 1$ at the surface, regardless of the underlying terrain complexity.

## Principle

### Basal kinematic condition

Both methods enforce that ice velocity is parallel to the bed:

$$
w_\mathrm{b} = u_\mathrm{b} \frac{\partial b}{\partial x} + v_\mathrm{b} \frac{\partial b}{\partial y}.
$$

### Kinematic method

The kinematic method computes $w$ by requiring that ice velocity is tangent to each layer surface. At layer elevation $z_\zeta = b + \zeta H$:

$$
w = u \frac{\partial z_\zeta}{\partial x} + v \frac{\partial z_\zeta}{\partial y} - \nabla \cdot (\bar{\mathbf{u}}_\zeta \, z_\zeta),
$$

where $\bar{\mathbf{u}}_\zeta$ is the depth-averaged velocity from the bed up to that layer. This naturally accounts for varying terrain through the layer slope terms.

### Incompressibility method

The incompressibility method uses the divergence-free condition for ice, which is expressed in physical coordinates:

$$
\frac{\partial u}{\partial x} + \frac{\partial v}{\partial y} + \frac{\partial w}{\partial z} = 0,
$$

where the horizontal derivatives are taken at constant physical height $z$. Integrating from the bed:

$$
w(z) = w_\mathrm{b} - \int_b^z \left(\frac{\partial u}{\partial x} + \frac{\partial v}{\partial y}\right) \,\mathrm{d}z'.
$$

Changing the integration variable to terrain-following coordinates:

$$
w(\zeta) = w_\mathrm{b} - \int_0^\zeta \left(\frac{\partial u}{\partial x} + \frac{\partial v}{\partial y}\right) H\,\mathrm{d}\zeta'.
$$

While we integrate with respect to $\zeta$, the incompressibility condition requires horizontal derivatives at constant physical height $z$. However, our velocity fields $u$ and $v$ are discretized and computed at constant $\zeta$. Therefore, we must transform the derivatives using the chain rule. Applying it to $u(x,y,z)$ with $z = b + \zeta H$:

$$
\left.\frac{\partial u}{\partial x}\right|_\zeta  = \left.\frac{\partial u}{\partial x}\right|_z + \left[\frac{\partial b}{\partial x} + \zeta\frac{\partial H}{\partial x}\right] \frac{\partial u}{\partial z},
$$

so that

$$
\left.\frac{\partial u}{\partial x}\right|_z = \left.\frac{\partial u}{\partial x}\right|_\zeta - \left[\frac{\partial b}{\partial x} + \zeta\frac{\partial H}{\partial x}\right] \frac{\partial u}{\partial z}.
$$

## Versions

| Version | Kinematic | Incompressibility | Terrain correction | Implementation |
|:-------:|:---------:|:-----------------:|:------------------:|:-------------:|
| 1 (GJ)  | ✓         | ✓                 | Kinematic only     | Direct numerical derivatives |
| 2 (CMS) | ✓         | ✓                 | ✓                  | Numerical integration with terrain chain rule |
| 3 (TG)  | ✗         | ✓                 | ✓                  | Matrix-based with precomputed operators |

Versions 1 and 2 support choosing between `kinematic` and `incompressibility` methods via the `method` parameter, but only when using the Lagrange vertical basis. For Legendre basis, both versions use a spectral incompressibility method. For MOLHO basis, all versions use a two-layer kinematic approach. Version 3 implements only the incompressibility method for all basis functions.

## Parameters

Default configuration file ([vert_flow.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/vert_flow.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/vert_flow.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/vert_flow.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/vert_flow.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}

{{ render_contributors("vert_flow") }}