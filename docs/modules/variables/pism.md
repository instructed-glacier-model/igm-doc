# PISM Aliases

The table below maps [PISM](https://www.pism.io/) variable names to IGM canonical names. IGM's internal names were originally chosen to follow PISM conventions, so many entries are identity mappings. The non-identity entries are where the two conventions diverge (e.g. PISM uses `temp` for ice temperature; IGM uses `T`).

PISM aliases are **active by default** — `builtin_state_aliases` loads both `descriptive.yaml` and `pism.yaml` at startup, so `state.temp`, `state.climatic_mass_balance`, `state.liqfrac`, etc. work out of the box.

---

{{ render_alias_table("pism") }}
