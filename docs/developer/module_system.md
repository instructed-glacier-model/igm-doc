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

## Automatic documentation

Every module on this site needs a documentation page (e.g. `docs/modules/processes/iceflow.md`). Rather than write one from scratch, you can bootstrap it with the **`document-module` skill** — a [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) *agent skill* that ships inside this repository (`.claude/skills/document-module/`). You describe the module once, in the files you already wrote, and the skill assembles a draft page in the house style.

The skill is deliberately conservative: it builds prose **only** from the module's own source, config, and metadata, and leaves an explicit `<!-- REVIEW -->` marker anywhere it cannot ground a statement. It never invents physics, equations, or citations, and never overwrites a page in place.

### What you need first

A *skill* is a packaged instruction set that Claude Code loads automatically when it is running in a folder that contains it. To use this one you need:

1. **Claude Code installed and running.** See the [Claude Code docs](https://docs.claude.com/en/docs/claude-code/overview) for setup. If you have never used it, the only thing you do below is type one command into its chat prompt.
2. **A session started from the `igm-doc` repo root**, with the `igm` source checked out as the sibling directory `../igm` (the layout this repo already assumes). If `igm` lives elsewhere, set the `IGM_ROOT` environment variable to point at it.

The skill refuses to run unless the module you are documenting already has **all four** of these in the `igm` source tree (it lists every missing one at once):

| Required | Path | Notes |
|---|---|---|
| Metadata YAML | `<section>/<name>/<name>.yaml` | The file described [above](#metadata-format) — `description`, `category`, `community`, `authors`, `needs`, `updates` |
| Default config | `conf/<section>/<name>.yaml` | The module's Hydra config |
| Config help | `conf_help/<section>/<name>.yaml` | Per-parameter `Type` / `Units` / `Description`, mirroring the config's shape |
| Source package | `<section>/<name>/` | The Python package, including `<name>.py` |

Here `<section>` is one of `processes`, `assimilations`, `inputs`, or `outputs`, and `<name>` is the module name. Write the metadata YAML following [Writing metadata for a new module](#writing-metadata-for-a-new-module) and the config-help file before invoking the skill.

### Generating a page

In the Claude Code chat, type:

```
/document-module <name>
```

for example `/document-module field_inversion`. Claude then works through a fixed checklist on its own:

1. **Inspects** the module and verifies the four prerequisites (aborting with a clear list if any are missing).
2. **Reads** the source package, config, config-help, and metadata — its only grounding for prose.
3. **Classifies** the module (physics / coupling / tooling) and mirrors the matching exemplar page's style.
4. **Generates** `docs/modules/<section>/<name>.md`: a grounded draft with `<!-- REVIEW -->` markers wherever expert input is needed.
5. **Wires it into the nav** by adding a line to `mkdocs.yml` (idempotent — safe to re-run).
6. **Validates** that citations resolve against `refs.bib` and config paths resolve.
7. **Reports** what it generated, what it left for you, and the nav/validation results.

You do **not** edit `docs/modules/introduction.md`: the module card on the Modules overview renders automatically from the metadata YAML. (One caveat: if you used a brand-new `category` value, add it to `categories.yaml` so the card has a label and colour — the nav entry works regardless.)

### After it runs

1. **Read the report and open the generated page.** Search it for `REVIEW` and resolve every marker — these are the spots the skill could not ground (uncertain physics, an equation only present in code, a citation not yet in `refs.bib`, an author to confirm). Fill them in or delete them.
2. **Preview locally** with `mkdocs serve` and check the page, its nav entry, and its card on the Modules overview.
3. **Commit** the new page and the `mkdocs.yml` change once you are happy.

### Regenerating an existing page

The skill never overwrites a page you have already edited. If a page exists and you want a fresh draft (e.g. after rewriting the module), run:

```
/document-module <name> --regenerate
```

This writes a sidecar `docs/modules/<section>/<name>.generated.md` for you to diff against the current page and merge by hand, so your hand-written prose is never clobbered.
