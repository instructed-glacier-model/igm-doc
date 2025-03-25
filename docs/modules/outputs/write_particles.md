# Module `write_particles`

This IGM module writes particle time-position in csv files computed by module `particles`. The saving frequency is given by parameter `processes.time.save` defined in module `time`.

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
{% include  "../../../igm/igm/conf/outputs/write_particles.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/outputs/write_particles.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/outputs/write_particles.yaml') %}
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
      <td>{{ module_help[key].Units}}</td>
      <td>{{ module_help[key].Description}}</td>

      <td>{{ value }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>

<script type="text/javascript">
  MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
</script>

## Example Usage