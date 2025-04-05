# Module `particles`
This IGM module implements a particle tracking routine, which computes the trajectories of virtual particles advected by the ice flow. The routine operates in real-time during the forward model run, and a large number of particles can be processed efficiently thanks to the parallel implementation with TensorFlow. The routine includes particle seeding (by default in the accumulation area at regular intervals, though this can be customized) and tracking (advection by the velocity field in 3D). Note that there is currently no strategy for removing particles, which may lead to memory overload when using this routine for long durations and/or with high seeding intensity.

There are currently two implementations (selectable via the `tracking_method` parameter):

- `'simple'`: Horizontal and vertical directions are treated differently:
  1. In the horizontal plane, particles are advected using the horizontal velocity field (interpolated bi-linearly).
  2. In the vertical direction, particles are tracked along the ice column, scaled between 0 (at the bed) and 1 (at the surface), based on their relative position. Particles are always initialized at a relative height of 1 (assumed to be on the surface). The evolution of the particle's position within the ice column over time is computed based on the surface mass balance: the particle deepens when the surface mass balance is positive (the relative height decreases) and re-emerges when the surface mass balance is negative (the relative height increases).

- `'3d'`: Requires activation of the `vert_flow` module, which computes the vertical velocity by integrating the divergence of the horizontal velocity. This enables full 3D particle tracking.

Currently, the default `tracking_method` is set to `'simple'`, as the `'3d'` method (and its dependency on `vert_flow`) requires further testing.

You may adapt the seeding strategy to your needs. The default seeding occurs in the accumulation area, with the seeding frequency controlled by the `frequency_seeding` parameter and the seeding density by the `density_seeding` parameter. Alternatively, you can define a custom seeding strategy (e.g., seeding near rock walls or nunataks). To do this, redefine the `seeding_particles()` function in a `particles.py` file located in the working directory (refer to the example `aletsch-1880-2100`). When executed, `igm_run` will override the original `seeding_particles()` function with the user-defined one.

The module requires horizontal velocities (`state.U`) and vertical velocities (`state.W`). The vertical velocities are computed using the `vert_flow` module when the `tracking_method` is set to `'3d'`.

**Note:** In the code, the positions of particles are recorded within vectors corresponding to the number of tracked particles: `state.xpos`, `state.ypos`, and `state.zpos`. The variable `state.rhpos` provides the relative height within the ice column (1 at the surface, 0 at the bed). At each time step, the weight of surface debris contained in each cell of the 2D horizontal grid is computed and stored in the variable `state.weight_particles`.

This IGM module writes particle time-position data into CSV files, as computed by the `particles` module. The saving frequency is controlled by the parameter `processes.time.save`, which is defined in the `time` module.

The module also writes the trajectories followed by particles. The data are stored in a folder named `trajectory` (created if it does not already exist). Files named `traj-TIME.csv` report the space-time positions of the particles at time `TIME` with the following structure:

```
ID,  state.xpos,  state.ypos,  state.zpos, state.rhpos,  state.tpos, state.englt
X,            X,           X,           X,           X,           X,           X,
X,            X,           X,           X,           X,           X,           X,
X,            X,           X,           X,           X,           X,           X,
```

providing, in turn, the particle ID, x, y, z positions, the relative height within the ice column, the seeding time, and the englacial residence time.

**Contributors:** Guillaume Jouvet, Claire-Mathile Stücki

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/particles.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/processes/particles.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/particles.yaml') %}
{% set header = load_yaml('igm/igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

<table>
  <thead>
    <tr>
      <th>Name</th>
      {% for key in header %}
      <th>{{ key }}</th>
      {% endfor %}
      <th>Default Value</th>
    </tr>
  </thead>
  <tbody>
    {% for key, value in module.items() %}
    <tr>
      <td>{{ key }}</td>
      <td>{{ module_help[key].Type}}</td>
      <!-- <td>{{ module_help[key].Units}}</td> -->
      <td><span class="math">{{ module_help[key].Units }}</span></td>
      <td>{{ module_help[key].Description}}</td>

      <td>{{ value }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>

<script type="text/javascript">
  MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
</script>
