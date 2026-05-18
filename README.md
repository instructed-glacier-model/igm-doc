# IGM Documentation

Source for the [igm-model.org](https://igm-model.org) documentation site, built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/). The IGM source code lives at [github.com/instructed-glacier-model/igm](https://github.com/instructed-glacier-model/igm).

## Setup

Create a dedicated environment and install the documentation dependencies:

```bash
conda create -n igm-doc python=3.11
conda activate igm-doc
pip install mkdocs-material mkdocs-include-markdown-plugin mkdocs-macros-plugin mkdocs-table-reader-plugin mkdocs-bibtex
```

## Local preview

```bash
conda activate igm-doc
mkdocs serve
```

Open the URL printed in the terminal. Changes to any source file are reflected live in the browser.

## Structure

| Path | Purpose |
|---|---|
| `docs/` | Markdown source files |
| `mkdocs.yml` | Site configuration and navigation |
| `main.py` | MkDocs Macros plugin — custom Python macros used in pages |
| `refs.bib` | BibTeX references (rendered by mkdocs-bibtex) |
| `module_io.yaml` | Module input/output definitions (used by dependency graph and macros) |
| `process_dependency_viz.py` | Script to regenerate `docs/assets/dependency_graph.html` |

---

## Maintainers

The documentation is maintained by Guillaume Jouvet ([@jouvetg](https://github.com/jouvetg)), Brandon Finley ([@brfi3983](https://github.com/brfi3983)), Thomas Gregov ([@tgregov](https://github.com/tgregov)), and Sebastian Rosier ([@shrrosier](https://github.com/shrrosier)).
