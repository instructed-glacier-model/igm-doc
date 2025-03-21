# write_particles

This IGM module writes particle time-position in csv files computed by module `particles`. The saving frequency is given by parameter `time_save` defined in module `time`.

The data are stored in folder 'trajectory' (created if does not exist). Files 'traj-TIME.csv' reports the space-time position of the particles at time TIME with the following structure:

```
ID,  state.xpos,  state.ypos,  state.zpos, state.rhpos,  state.tpos, state.englt
X,            X,           X,           X,           X,           X,           X,
X,            X,           X,           X,           X,           X,           X,
X,            X,           X,           X,           X,           X,           X,
```

providing in turn the particle ID, x,y,z positions, the relative height within the ice column, the seeding time, and the englacial time.


## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/output/write_particles.yaml" %}
~~~

## Parameters

{{ read_raw( "../../../igm/igm/conf_help/output/write_particles.md") }}

## Example Usage