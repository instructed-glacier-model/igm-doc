# IGM Canonical Variable Names

These are the names used internally by IGM and referenced in all module `needs`/`updates` declarations and output configs. IGM follows the naming conventions of [PISM](https://www.pism.io/) where applicable.

The table covers the core modules. Additional variables may be defined by community modules or custom user modules.

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
| `slidingco` | `(ny, nx)` | Sliding coefficient | MPa m<sup>-1/3</sup> yr<sup>1/3</sup> |
| `E` | `(nz, ny, nx)` | Ice enthalpy | J kg⁻¹ |
| `T` | `(nz, ny, nx)` | Ice temperature | °C |
| `omega` | `(nz, ny, nx)` | Water content (liquid fraction) | — |
| `basal_melt_rate` | `(ny, nx)` | Basal melt rate | m yr⁻¹ |
