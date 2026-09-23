# IGM Canonical Variable Names

These are the names used internally by IGM and referenced in all module `needs`/`updates` declarations and output configs. IGM follows the naming conventions of [PISM](https://www.pism.io/) where applicable.

## Saving variables

The output modules (`local`, `write_ncdf`, `write_tif`) save the variables listed in `vars_to_save`:

- Any 2D `(ny, nx)` or 3D `(nz, ny, nx)` field of the state can be saved (2D only for GeoTIFF), provided the module that produces it is active. Names that do not exist in the state are silently skipped.
- `velbar_mag`, `velsurf_mag` and `velbase_mag` are computed on the fly by the output modules.
- Enthalpy diagnostics (`T`, `omega`, `T_pmp`, …) are computed only at save time, and only if they are requested in `vars_to_save`.
- 3D fields of the `iceflow` module live on its vertical grid; 3D fields of the `enthalpy` module live on their own vertical grid, and get their own vertical dimension in the NetCDF file.
- Monthly climate fields (`air_temp`, `precipitation`, shape `(12, ny, nx)`) are better saved through their annual means `meantemp` and `meanprec`.
- Input modules also load every variable present in the input file (e.g. `thkobs`, `uvelsurfobs`, `vvelsurfobs`, `icemaskobs` from `oggm_shop`); these can be saved as well.

The tables below list the variables of the core modules, and of the most common community modules. Custom user modules may define more.

## Time and grid

| Variable | Shape | Description | Unit |
|---|---|---|---|
| `t` | `()` | Simulation time (scalar) | yr |
| `dt` | `()` | Current time step (scalar) | yr |
| `x` | `(nx,)` | x-coordinate vector | m |
| `y` | `(ny,)` | y-coordinate vector | m |

## Geometry (inputs, `thk`)

| Variable | Shape | Description | Unit |
|---|---|---|---|
| `topg` | `(ny, nx)` | Bedrock (basal) topography | m |
| `thk` | `(ny, nx)` | Ice thickness | m |
| `usurf` | `(ny, nx)` | Ice surface elevation | m |
| `lsurf` | `(ny, nx)` | Ice lower surface elevation (differs from `topg` where ice floats) | m |
| `icemask` | `(ny, nx)` | Mask restricting SMB computation to glacierized area | — |
| `water_level` | `(ny, nx)` | Water (sea or lake) level, if provided as input | m |
| `divflux` | `(ny, nx)` | Divergence of the ice flux | m yr⁻¹ |

## Ice flow (`iceflow`)

| Variable | Shape | Description | Unit |
|---|---|---|---|
| `U` | `(nz, ny, nx)` | Horizontal x-velocity (3D) | m yr⁻¹ |
| `V` | `(nz, ny, nx)` | Horizontal y-velocity (3D) | m yr⁻¹ |
| `W` | `(nz, ny, nx)` | Vertical velocity (3D), if `vertical_velocity` is enabled | m yr⁻¹ |
| `ubar` | `(ny, nx)` | Depth-averaged x-velocity | m yr⁻¹ |
| `vbar` | `(ny, nx)` | Depth-averaged y-velocity | m yr⁻¹ |
| `velbar_mag` | `(ny, nx)` | Depth-averaged velocity magnitude (computed at save time) | m yr⁻¹ |
| `uvelsurf` | `(ny, nx)` | Surface x-velocity | m yr⁻¹ |
| `vvelsurf` | `(ny, nx)` | Surface y-velocity | m yr⁻¹ |
| `wvelsurf` | `(ny, nx)` | Surface vertical velocity, if `vertical_velocity` is enabled | m yr⁻¹ |
| `velsurf_mag` | `(ny, nx)` | Surface velocity magnitude (computed at save time) | m yr⁻¹ |
| `uvelbase` | `(ny, nx)` | Basal x-velocity | m yr⁻¹ |
| `vvelbase` | `(ny, nx)` | Basal y-velocity | m yr⁻¹ |
| `wvelbase` | `(ny, nx)` | Basal vertical velocity, if `vertical_velocity` is enabled | m yr⁻¹ |
| `velbase_mag` | `(ny, nx)` | Basal velocity magnitude (computed at save time) | m yr⁻¹ |
| `arrhenius` | `(ny, nx)` or `(nz, ny, nx)` | Arrhenius (rate) factor for ice rheology | MPa⁻ⁿ yr⁻¹ |
| `tau_ref` | `(ny, nx)` | Reference basal shear stress (sliding, `unified` method) | MPa |
| `slidingco` | `(ny, nx)` | Reference basal shear stress (`emulated`, `solved`, `diagnostic` methods; same as `tau_ref`) | MPa |

## Climate and surface mass balance (`climate`, `smb`)

| Variable | Shape | Description | Unit |
|---|---|---|---|
| `smb` | `(ny, nx)` | Surface mass balance (ice equivalent) | m yr⁻¹ |
| `meantemp` | `(ny, nx)` | Mean annual air temperature | °C |
| `meanprec` | `(ny, nx)` | Mean annual precipitation (water equivalent) | kg m⁻² yr⁻¹ |
| `air_temp` | `(12, ny, nx)` | Monthly air temperature | °C |
| `air_temp_sd` | `(12, ny, nx)` | Monthly standard deviation of daily air temperature | °C |
| `precipitation` | `(12, ny, nx)` | Monthly precipitation (water equivalent) | kg m⁻² yr⁻¹ |

## Thermodynamics (`enthalpy`)

| Variable | Shape | Description | Unit |
|---|---|---|---|
| `E` | `(nz, ny, nx)` | Ice enthalpy | J kg⁻¹ |
| `T` | `(nz, ny, nx)` | Ice temperature | K |
| `omega` | `(nz, ny, nx)` | Water content (liquid fraction) | — |
| `E_pmp` | `(nz, ny, nx)` | Enthalpy at the pressure melting point | J kg⁻¹ |
| `T_pmp` | `(nz, ny, nx)` | Pressure melting point temperature | K |
| `T_pa` | `(nz, ny, nx)` | Pressure-adjusted temperature | K |
| `T_pa_b` | `(ny, nx)` | Pressure-adjusted temperature at the bed | K |
| `E_s` | `(ny, nx)` | Surface enthalpy (boundary condition) | J kg⁻¹ |
| `T_s` | `(ny, nx)` | Ice surface temperature | K |
| `basal_melt_rate` | `(ny, nx)` | Basal melt rate (ice equivalent) | m yr⁻¹ |
| `basal_heat_flux` | `(ny, nx)` | Geothermal heat flux | W m⁻² |

## Subglacial hydrology (`subglacial_hydrology`)

| Variable | Shape | Description | Unit |
|---|---|---|---|
| `effective_pressure` | `(ny, nx)` | Effective pressure at the bed | MPa |
| `h_water_till` | `(ny, nx)` | Till water layer thickness (`till_storage` mode) | m |

## Community modules

| Variable | Shape | Module | Description | Unit |
|---|---|---|---|---|
| `flow_accumulation` | `(ny, nx)` | `flow_accumulation` | Upstream accumulated flow (number of cells) | — |
| `phi` | `(ny, nx)` | `flow_accumulation` | Hydraulic head | m |
| `weight_particles` | `(ny, nx)` | `particles` | Sum of particle weights per cell (with `add_fields: [weight]`) | — |
