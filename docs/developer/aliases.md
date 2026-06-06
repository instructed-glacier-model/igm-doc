# State Variable Aliases

IGM's `State` class can expose the same tensor under multiple names. The **canonical names** (`topg`, `usurf`, `T`, …) are stored internally and used in all module code. **Aliases** are alternative names that redirect to a canonical name without copying data or adding overhead to the canonical access path.

## Why aliases exist

Different glaciology communities use different names for the same physical quantities. PISM uses `temp` for ice temperature; IGM uses `T`. A user familiar with PISM can write `state.temp` or put `temp` in a `vars_to_save` list and get the same result as `state.T`. The descriptive alias set provides longer, self-documenting names (`bed_elevation` instead of `topg`) for use in configs and custom module code.

## How it works

`State` overrides two Python special methods:

```python
class State:
    _aliases: dict[str, str] = {}  # alias_name → canonical_name

    def __getattr__(self, name: str):
        # Only invoked when `name` is absent from __dict__.
        # Canonical names are stored directly in __dict__,
        # so they never reach this method — zero extra cost.
        canonical = State._aliases.get(name)
        if canonical is not None:
            try:
                return self.__dict__[canonical]
            except KeyError:
                pass
        raise AttributeError(f"'State' has no attribute '{name}'")

    def __setattr__(self, name: str, value) -> None:
        canonical = State._aliases.get(name)
        object.__setattr__(self, canonical if canonical is not None else name, value)

    @classmethod
    def register_aliases(cls, mapping: dict[str, str]) -> None:
        cls._aliases.update(mapping)
```

`__getattr__` is Python's *fallback* hook — it fires only when the normal attribute lookup (through `__dict__`) fails. Canonical names are stored directly in `state.__dict__`, so reading them never invokes `__getattr__`. Alias names are not in `__dict__`, so they trigger the fallback, which performs one lookup in `_aliases` and one in `__dict__`.

`__setattr__` is always called on writes. It checks `_aliases` first; if the name is an alias, the value is stored under the canonical name instead.

## Built-in alias sets

Two alias sets ship with IGM:

| Set | File | Active by default |
|---|---|---|
| `descriptive` | `igm/common/aliases/descriptive.yaml` | Yes |
| `pism` | `igm/common/aliases/pism.yaml` | Yes |

See [Descriptive Aliases](../modules/variables/descriptive.md) and [PISM Aliases](../modules/variables/pism.md) for the full tables.

## Compatibility requirement: avoid `vars(state)`

Python's built-in `vars(state)` returns `state.__dict__` directly, completely bypassing `__getattr__` and `__setattr__`. Any code that reads or writes a state variable through `vars(state)` will therefore ignore aliases entirely:

```python
# BAD — bypasses __getattr__/__setattr__; aliases are invisible
vars(state)[var]          = value   # write
val = vars(state)[var]              # read
vars(state).get(var, None)          # read with default

# GOOD — goes through __getattr__/__setattr__; aliases work
setattr(state, var, value)
val = getattr(state, var)
val = getattr(state, var, None)
```

When the alias system was introduced, all existing IGM code that used `vars(state)[var]` patterns was updated to `getattr`/`setattr` — covering 38 occurrences across 14 files (input loaders, output writers, data assimilation routines, iceflow utilities). When writing new modules or modifying existing ones, **never use `vars(state)` to access state variables**. Direct attribute access (`state.topg`, `state.T`) is always fine — it goes through the normal Python attribute machinery and respects aliases.

## Creating a custom alias file

Any YAML file that maps `alias_name: canonical_name` pairs can be loaded:

```yaml
# my_aliases.yaml
bed: topg
surf: usurf
vel_x: U
vel_y: V
```

Load and register it:

```python
from igm.common import State
from igm.common.aliases import load_aliases_from_yaml

State.register_aliases(load_aliases_from_yaml("my_aliases.yaml"))
```

Aliases take effect for all `State` instances immediately and persist for the lifetime of the process.
