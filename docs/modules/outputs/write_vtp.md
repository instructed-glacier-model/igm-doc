# Module `write_vtp`
This IGM module writes 2D field variables specified in the parameter list `vars_to_save` into VTP (VTK PolyData) output files for visualization in ParaView or other VTK-compatible software. The saving frequency is determined by the parameter `processes.time.save` in the `time` module.

This module creates triangulated surface meshes from the glacier data and saves them as VTP files with timestamped filenames. It also supports particle trajectory output if the `particles` process is enabled.

This module requires the `pyvista` library.

## Config Structure  
~~~yaml
{% include  "../../../../igm/conf/outputs/write_vtp.yaml" %}
~~~

## Parameters

{% set config = load_yaml('../igm/conf/outputs/write_vtp.yaml') %}
{% set help = load_yaml('../igm/conf_help/outputs/write_vtp.yaml') %}
{% set header = load_yaml('../igm/conf_help/header.yaml') %}
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

This module creates several types of output files:

### Surface Data Files
- **Static topography**: `vtp/topg.vtp` - Contains the bedrock surface mesh
- **Time-series variables**: `vtp/{variable}-{timestamp:06d}.vtp` - Contains glacier surface data at each save time

### Particle Trajectories (if enabled)
- **Trajectory files**: `trajectories/traj-{timestamp:08.2f}.vtp` - Contains particle positions and attributes

### Example Configuration
```yaml
outputs:
  write_vtp:
    vars_to_save: ["thk", "usurf", "velbar_mag", "velsurf_mag"]
```

### Visualization
The generated VTP files can be opened in:
- **ParaView**: For advanced scientific visualization
- **VisIt**: For large-scale data analysis
- **VTK-based tools**: For custom visualization applications

The files contain triangulated surface meshes where the z-coordinate represents the glacier surface elevation (`usurf`) and the scalar fields contain the requested variables.