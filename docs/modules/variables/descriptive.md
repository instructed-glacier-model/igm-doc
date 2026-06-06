# Descriptive Aliases

The table below maps long English names to IGM canonical names, allowing module code and output configs to use self-documenting variable names instead of the short internal identifiers.

These aliases are **active by default** — `builtin_state_aliases` loads `descriptive.yaml` at startup, so names like `bed_elevation`, `surface_mass_balance`, and `temperature` work out of the box.

---

{{ render_alias_table("descriptive") }}
