---
name: document-module
description: Bootstrap a consistent documentation page for a new IGM module from its source package, config, and metadata. Use when the user asks to "document a module", "write docs for <module>", or runs /document-module <name>. Generates docs/modules/<section>/<name>.md grounded strictly in the module's own source — never invents physics, equations, or citations.
---

# Document an IGM module

Bootstrap a documentation page for a new IGM module that matches the igm-doc
house style. The page is built **only from grounded sources** — the module's
source package, its config files, and its `modules.yaml` metadata — plus one
exemplar page for style. Anything that cannot be grounded is left as an explicit
`REVIEW` marker for a human expert.

This skill **bootstraps new pages**; it never rewrites or overwrites an existing
one in place.

Run from the **igm-doc repo root**, with the igm source as the sibling `../igm`.

## Workflow

Copy this checklist and tick items as you go:

```
- [ ] 1. Inspect: run inspect_module.py; abort on any precondition failure
- [ ] 2. Read sources: module package + conf + conf_help + per-module <name>.yaml
- [ ] 3. Classify the module type and read the matching exemplar page
- [ ] 4. Generate the page (grounded prose + REVIEW markers)
- [ ] 5. Wire into the site nav: run update_nav.py
- [ ] 6. Validate: run validate_page.py; fix and re-run until it passes
- [ ] 7. Report what was generated and what still needs expert input
```

### Step 1 — Inspect and check preconditions

```bash
python scripts/inspect_module.py <name>
```

This resolves the module's section, verifies all preconditions, reports the
config shape, lists params, and tells you whether the page already exists. It
exits non-zero and lists **every** missing precondition at once. The hard
preconditions are:

1. a per-module metadata file `<section>/<name>/<name>.yaml` in the igm source
   (fields: `description`, `category`, `authors`, `needs`, `updates` — never written here);
2. `conf/<section>/<name>.yaml`;
3. `conf_help/<section>/<name>.yaml`;
4. the `<section>/<name>/` source package.

If it exits non-zero, **stop** and report the failures. Do not partially
generate. If `page_exists` is true, see *Existing page* below.

### Step 2 — Read the sources for grounding

Read the whole source package (primary `<name>.py`, `__init__.py` exports, and
siblings such as `trainer.py`), the conf and conf_help files, and the
per-module `<name>.yaml` metadata file. These are your only grounding for prose.

`conf_help` descriptions are a strong structured grounding source: when a param
enumerates choices (e.g. `version` 1/2/3, `mode`, `method`), use those
descriptions to build the corresponding `## Versions` / `## Modes` table. Only
the parts of such a table the source actually states are grounded — leave any
finer detail (e.g. per-basis support) to the REVIEW checklist.

**Grounding rules — non-negotiable:**

- **No invented physics.** Describe physics only where the source supports it.
- **No invented equations.** Emit LaTeX only for equations present in the source.
- **No invented citations.** Emit `[@key]` only if `key` is already in
  `refs.bib`; otherwise write `<!-- REVIEW: cite? <what was referenced> -->`.
- **Make uncertainty visible** with `<!-- REVIEW: ... -->`, never confident prose.

### Step 3 — Classify and read the exemplar

Classify from the source, then read the one matching exemplar for its current
house style (structure comes from the rubric below; the exemplar calibrates tone
and formatting):

| Type | Signals in the source | Exemplar to read |
|------|-----------------------|------------------|
| **physics / PDE** | solves a PDE / minimises an energy; governing equations; spatial/vertical discretisation | `docs/modules/processes/enthalpy.md` |
| **coupling / bookkeeping** | short `update()` maintaining one `state.X` field; a `mode`/`method` switch; run-order constraints | `docs/modules/processes/subglacial_hydrology.md` |
| **tooling / training** | training loop, dataset/model file I/O, `data_dir`/`out_dir`/`epochs` params | `docs/modules/assimilations/pretraining.md` |

If a module spans types, pick the dominant one and borrow sections as the source
supports.

### Step 4 — Generate the page

Write to `docs/modules/<section>/<name>.md` (or the sidecar — see *Existing
page*). Every page uses this **fixed frame**; **[bracketed]** parts are
conditional:

1. `# Module \`<name>\``
2. **Orientation** — a `!!! info "Brief summary"` admonition, used for **every**
   module type (matching exemplar pages like `climate` and `enthalpy`), drafted
   from the docstring and the module's `<name>.yaml` description. Indent the
   body 4 spaces under the `!!! info "Brief summary"` line. The admonition
   conventionally ends with:
   *"The **parameters** of the module are described [here](#parameters)."*
   Do **not** use a bare lead paragraph — the summary always goes in the box.
3. **[Migration/transition admonitions]** — `!!! warning` / `!!! note` for
   renamed variables, new generations, deprecated modes; only when the source or
   metadata indicates a change.
4. **[References line]** — e.g. *"described in further detail in [@IGM]"*; keys in
   `refs.bib` only.
5. `{{ render_module_io("<name>") }}` — the "State variables" box (reads/writes).
   Emit it whenever `inspect_module.py` reports `render_module_io: true` (i.e. the
   module's `<name>.yaml` declares any `needs` or `updates`), placed right after
   the orientation box and any migration admonitions. Omit only when it reports
   `false` (the module declares neither).
6. **Body sections** from the type's menu below.
7. **Parameters block** — copy the matching template from `assets/` and replace
   the literal tokens `NAME` and `SECTION`:
   - `config_shape: nested` → `assets/parameters_tree.md`
   - `config_shape: flat` → `assets/parameters_notree.md`

   The template already ends with `{{ render_contributors("<name>") }}`.

#### Body-section menus

Write every menu section the source grounds. For each section the type expects
but you **cannot** ground, do not stub it inline — instead collect them into the
single REVIEW checklist (below).

**physics / PDE:** `## Physical model` (governing equations + term meanings) ·
`## Numerical solution` / `## Numerical set-up` (discretisation, solver,
time-stepping) · `[## Coupling with <module>]` · `[## Practical guidance]` /
`[## Common issues]`

**coupling / bookkeeping:** brief-summary box (frame item 2: field maintained,
its units, the consumer) · `## <Modes>` (enumerate each `mode`/`method` value and
its behaviour) · `[## Unit convention]` · `## Module ordering` · `## Example
usage` (YAML / CLI)

**tooling / training:** brief-summary box (frame item 2) · `[## warning/note]`
(version / compatibility caveats) · `## Overview` (algorithm, losses, workflow) ·
`[## Module ordering]` · `## Training data` / `## Inputs` (required layout) ·
`## Output` (artifacts written, where) · `## Example usage` (concrete scenarios)

#### REVIEW checklist

After the grounded body sections and before `## Parameters`, if the type expects
sections you could not ground, append exactly one block:

```
<!-- REVIEW CHECKLIST — sections a complete <type> module page usually has,
     not generated because the source did not ground them:
     - <section name>: <one-line note on what it should cover>
     Fill these in or delete this block. -->
```

### Step 5 — Wire into the site nav

```bash
python scripts/update_nav.py <name>
```

This inserts `- <name>: modules/<section>/<name>.md` at the **end of the right
nav group** in `mkdocs.yml`, derived from the module's `<name>.yaml` metadata:

- `processes` (core) → `Process Modules` › `<Category>`; (community) →
  `Community Modules` › `<Category>` — nested under the category label.
- `assimilations` / `inputs` / `outputs` → the flat `Assimilation`/`Input`/
  `Output Modules` group.

It is **idempotent** (re-runs are no-ops once the entry is present), edits the
file as a surgical text insertion (preserving comments and your curated ordering),
and re-parses the result to confirm valid YAML before writing. A *community*
module outside `processes` has no existing nav home — the script makes no change
and prints a `NAV REVIEW` line with the entry to place by hand.

You do **not** edit `docs/modules/introduction.md`: process **and** assimilation
tiles auto-render there from `<name>.yaml` (via `render_process_cards` /
`render_assimilation_cards`). One caveat: if the module's `category` is **not**
in `categories.yaml`, `update_nav.py` still places it in the nav (title-casing
the label), but its intro-page card will not appear until that category is added
to `categories.yaml` — flag this in the report.

### Step 6 — Validate (fix-and-repeat loop)

```bash
python scripts/validate_page.py docs/modules/<section>/<name>.md
```

It checks that every `[@key]` exists in `refs.bib` and that the page's config
paths resolve. If it fails: fix the page (convert dangling citations to
`<!-- REVIEW: cite? -->`, correct paths) and run it again until it passes. With
the user's `--build` flag, also run `mkdocs build --strict`.

### Step 7 — Report

Summarise: the file written (page or sidecar), the type you classified, which
grounded sections were generated, the REVIEW checklist contents, the **nav
result** from `update_nav.py` (inserted / already present / NAV REVIEW), and the
validation result. State clearly what still needs human expert input.

## Existing page

If `inspect_module.py` reports `page_exists: true`:

- Default: **abort** — report it and change nothing.
- With `--regenerate`: write to `docs/modules/<section>/<name>.generated.md` for
  manual diff/merge. **Never overwrite the original in place.**
