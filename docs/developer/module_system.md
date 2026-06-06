# Module System: needs, updates, and metadata

IGM modules can optionally ship with a YAML metadata file that lives next to the Python file. When present, this file declares what the module reads from and writes to the shared `State` object, drives the runtime dependency check, and powers the interactive dependency graph. Modules without a YAML file are valid but are silently skipped by the dependency checker.

## Metadata format

The full set of fields, illustrated with the `enthalpy` module:

```yaml
description: Solve the 3D enthalpy equation for temperature, water content, and basal melt
category: cryosphere
community: false
authors: [Guillaume Jouvet, Thomas Gregov, Lucie Bacchin]
needs:       [thk, U, V, W, arrhenius]
updates:     [E, basal_melt_rate]
diagnostics: [T, omega, E_pmp, T_pmp, T_pa, T_pa_b, E_s, T_s]
```

| Field | Description |
|---|---|
| `description` | One-line summary shown in module cards and the dependency graph |
| `category` | `atmosphere`, `cryosphere`, `lithosphere`, `hydrosphere`, or `misc` |
| `community` | `false` for core modules, `true` for community contributions |
| `authors` | List of contributor names |
| `needs` | Variables read by `update()` — validated at startup |
| `updates` | Variables written by `update()` every timestep |
| `diagnostics` | Variables that can be computed on demand by `compute_diagnostics()` (optional) |

## needs and updates

- **`needs`** — variables that must already be on `state` when this module's `update()` is called. If the YAML declares `needs` and any are missing after initialization, the run fails with a clear error message before the time loop starts.
- **`updates`** — variables this module writes every timestep. These are used to build the dependency graph and to detect whether a module is running in a reduced mode.

Registered alias names are valid in `needs` declarations. For example, a module that lists `bed_elevation` in `needs` will pass validation as long as `topg` exists on `state` and the descriptive aliases are loaded.

## Runtime validation

After all modules are initialized, IGM calls `check_module_needs()`. For each module that has a YAML with a `needs:` key, it checks every listed variable against `state`. Modules without a YAML (or without `needs:`) are silently skipped. If any required variable is missing, a formatted table is printed listing the missing variable and which module could provide it, then the run aborts.

The check runs after the initialization phase, so variables created by input modules (e.g. `topg`, `usurf`, `thk` from `load_ncdf`) are already present.

## Writing metadata for a new module

Create `mymodule.yaml` next to `mymodule.py` and fill in all fields:

```yaml
description: Compute surface mass balance from a temperature index model
category: atmosphere
community: true
authors: [Your Name]
needs:   [t, usurf, air_temp]
updates: [smb]
```

Checklist:

- [ ] `description` is one sentence, no trailing period
- [ ] `community: true` for any non-core contribution
- [ ] `needs` lists only variables that `update()` actually reads
- [ ] `updates` lists all variables that `update()` writes
- [ ] If the module has `compute_diagnostics()`, add a `diagnostics:` list

## Dispatcher modules

Some modules (e.g. `iceflow`) act as dispatchers that select a solver at runtime. For these, the metadata YAML may have minimal `needs`/`updates`, and the selected sub-module's YAML is consulted instead. IGM handles this automatically — no special action is needed when writing a sub-module.
