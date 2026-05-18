# State Variables

All IGM fields live in a shared **state object** (`state`). Every module reads from and writes to this object — there are no private module states. Fields are TensorFlow tensors and can be accessed as `state.varname`.

IGM follows the naming conventions of [PISM](https://www.pism.io/) where applicable.

The table below lists the main state variables associated with the **core modules**. Users may define and use additional variables in custom modules.

---

## Variable Reference

| Variable | Shape | Description | Unit |
|---|---|---|---|
| `t` | `()` | Simulation time (scalar) | yr |
| `dt` | `()` | Current time step (scalar) | yr |
| `x` | `(nx,)` | x-coordinate vector | m |
| `y` | `(ny,)` | y-coordinate vector | m |
| `thk` | `(ny, nx)` | Ice thickness | m |
| `topg` | `(ny, nx)` | Bedrock (basal) topography | m |
| `usurf` | `(ny, nx)` | Ice surface elevation | m |
| `smb` | `(ny, nx)` | Surface mass balance (ice-equivalent) | m yr⁻¹ |
| `icemask` | `(ny, nx)` | Mask restricting SMB computation to glacierized area | — |
| `ubar` | `(ny, nx)` | Depth-averaged x-velocity | m yr⁻¹ |
| `vbar` | `(ny, nx)` | Depth-averaged y-velocity | m yr⁻¹ |
| `U` | `(nz, ny, nx)` | Horizontal x-velocity (3D) | m yr⁻¹ |
| `V` | `(nz, ny, nx)` | Horizontal y-velocity (3D) | m yr⁻¹ |
| `W` | `(nz, ny, nx)` | Vertical velocity (3D) | m yr⁻¹ |
| `wvelbase` | `(ny, nx)` | Vertical velocity at the ice base | m yr⁻¹ |
| `wvelsurf` | `(ny, nx)` | Vertical velocity at the ice surface | m yr⁻¹ |
| `divflux` | `(ny, nx)` | Divergence of the ice flux | m yr⁻¹ |
| `arrhenius` | `(ny, nx)` | Arrhenius (rate) factor for ice rheology | MPa⁻³ yr⁻¹ |
| `slidingco` | `(ny, nx)` | Sliding coefficient | MPa m⁻¹/³ yr¹/³ |
| `E` | `(nz, ny, nx)` | Ice enthalpy | J kg⁻¹ |
| `T` | `(nz, ny, nx)` | Ice temperature | °C |
| `omega` | `(nz, ny, nx)` | Water content (liquid fraction) | — |
| `basal_melt_rate` | `(ny, nx)` | Basal melt rate | m yr⁻¹ |

---

## Dependency Graph

The interactive graph below shows how core modules are connected through shared state variables. **Nodes** are state variable groups (circles). **Edges** point from the module that writes a variable to the module that reads it.

Use the filter buttons to highlight edges for a specific module, or drag nodes to rearrange the layout.

<div style="width: 100%; height: 800px; border: 1px solid rgba(128,128,128,0.2); border-radius: 8px; overflow: hidden;">
<iframe
  src="../../assets/dependency_graph.html"
  style="width: 100%; height: 100%; border: none;"
  title="IGM module dependency graph">
</iframe>
</div>
