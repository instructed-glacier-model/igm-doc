# Diagnostic Variables

## Updates vs. diagnostics

Most module outputs are **updates**: quantities computed unconditionally every timestep and stored on `state`. Some quantities — typically large 3D fields derived from the solution — are kept off-state by default because allocating and retaining them every timestep consumes significant GPU memory. These are **diagnostics**: materialised on demand, only when the user's output config requests them.

For example, `enthalpy` always updates `E` (3D enthalpy) and `basal_melt_rate` every timestep. Temperature (`T`), water content (`omega`), and the pressure-melting-point fields are diagnostics — large 3D arrays that are allocated and stored only on save timesteps.

## Declaring diagnostics

Add a `diagnostics:` list to the module's YAML metadata alongside `needs` and `updates`:

```yaml
needs:       [thk, U, V, W, arrhenius]
updates:     [E, basal_melt_rate]
diagnostics: [T, omega, E_pmp, T_pmp, T_pa, T_pa_b, E_s, T_s]
```

## Implementing `compute_diagnostics()`

Add a function with this exact signature to the module's Python file:

```python
def compute_diagnostics(cfg: DictConfig, state: State, requested=None) -> None:
    ...
```

The `requested` parameter is a `set` of variable names the user has asked for. The recommended pattern — compute all diagnostics into a local dict, then assign only the requested subset:

```python
def compute_diagnostics(cfg: DictConfig, state: State, requested=None) -> None:
    E_s,  T_s   = compute_surface(cfg, state)
    E_pmp, T_pmp = compute_pmp(cfg, state)
    T,    omega  = compute_temperature(cfg, state, E_pmp)
    T_pa         = compute_pa(cfg, state, T)
    T_pa_b       = T_pa[0]

    computed = {
        "E_s": E_s, "T_s": T_s,
        "E_pmp": E_pmp, "T_pmp": T_pmp,
        "T": T, "omega": omega,
        "T_pa": T_pa, "T_pa_b": T_pa_b,
    }
    for var in (requested if requested is not None else computed):
        setattr(state, var, computed[var])
```

When `requested` is `None` (e.g. called manually for inspection), all diagnostics are stored.

## How the runner calls it

After every module's `update()` call, the runner checks whether a save is scheduled for this timestep. If so, it intersects the user's requested output variables with the module's declared `diagnostics`. If the intersection is non-empty, `compute_diagnostics()` is called with only those variable names:

```python
if getattr(state, "saveresult", True):
    for module in processes:
        if hasattr(module, "compute_diagnostics"):
            meta = _load_module_meta(module)
            module_diag = set(meta.get("diagnostics", [])) if meta else set()
            relevant = requested_output_vars & module_diag
            if relevant:
                module.compute_diagnostics(cfg, state, relevant)
```

Diagnostics are therefore never computed on non-save timesteps, regardless of which variables are listed.

## User side

Add diagnostic variable names to `vars_to_save` in the output config. No other change is required:

```yaml
outputs:
  write_ncdf:
    vars_to_save: [usurf, thk, T, omega, basal_melt_rate]
```

`T` and `omega` will be computed and written only on save timesteps.

!!! note
    If a module implements `compute_diagnostics()` but its YAML has no `diagnostics:` list, the function is **never called automatically** — the runner intersects `vars_to_save` with the declared list, and an empty list produces an empty intersection. The `diagnostics:` declaration in the YAML is required for automatic invocation.
