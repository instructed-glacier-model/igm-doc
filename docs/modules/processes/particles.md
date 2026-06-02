# Module `particles`

This IGM module implements a particle tracking routine, which computes the trajectories of virtual particles advected by the ice flow. The routine operates in real-time during the forward model run, and a large number of particles can be processed efficiently thanks to the parallel implementation with TensorFlow. The routine includes particle seeding (by default in the accumulation area at regular intervals, though this can be customized) and tracking (advection by the velocity field in 3D).

{{ render_module_io("particles") }}

## Tracking methods

Two tracking implementations are available, selected via `tracking.method`:

- **`simple`**: Horizontal and vertical directions are treated differently:
  1. In the horizontal plane, particles are advected using the horizontal velocity field (interpolated bi-linearly).
  2. In the vertical direction, particles are tracked along the ice column, scaled between 0 (at the bed) and 1 (at the surface). Particles are initialized at relative height 1 (on the surface). The evolution of the particle's position within the ice column over time is computed from the surface mass balance: the particle deepens when SMB is positive and re-emerges when SMB is negative.

- **`3d`**: Requires the `vert_flow` module, which computes the vertical velocity by integrating the divergence of the horizontal velocity, enabling full 3D particle tracking.

The default `tracking.method` is `3d`.

## Seeding

Seeding occurs in the accumulation area at intervals of `seeding.frequency` years, with spatial density controlled by `seeding.density` (0.2 = one seed every 5 grid cells). To use a custom seeding strategy (e.g. near rock walls or nunataks), redefine the `seeding_particles()` function in a `particles.py` file in the working directory — `igm_run` will override the built-in implementation with yours.

## Output

Particle positions are saved at the interval set by `processes.time.save`. Trajectories are written to a `trajectory/` folder as files named `traj-TIME.csv` with the columns:

```
ID,  state.xpos,  state.ypos,  state.zpos, state.rhpos,  state.tpos, state.englt
```

The tracking computation can use `tensorflow` (default) or a CUDA-based `cupy/numba` backend (`tracking.library`). Output writing can use `numpy` (default) or `cudf` (`output.library`), which also supports `parquet` format.

## Parameters

Default configuration file ([particles.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/particles.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/particles.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/particles.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/particles.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_tree.j2" %}

{{ render_contributors("particles") }}
