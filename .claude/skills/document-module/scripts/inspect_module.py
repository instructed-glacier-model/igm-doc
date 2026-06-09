#!/usr/bin/env python3
"""Inspect an IGM module and report everything the document-module skill needs.

Run from the igm-doc repo root (igm source resolved as the sibling ../igm, or
via the IGM_ROOT env var). Emits a JSON report on stdout and exits non-zero if
any hard precondition is missing, listing every failure at once.

Usage:
    python scripts/inspect_module.py <module-name>
"""

import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.exit("PyYAML is required (pip install pyyaml).")

# The four module trees, in the order doc sections mirror them.
SECTIONS = ["processes", "assimilations", "inputs", "outputs"]


def find_section(igm_root, name):
    """Return the section whose source tree holds igm/<section>/<name>/."""
    for section in SECTIONS:
        if os.path.isdir(os.path.join(igm_root, section, name)):
            return section
    return None


def is_nested(conf_path):
    """A config is 'nested' (-> tree table) if the module's top-level key has
    any mapping value; otherwise 'flat' (-> notree table)."""
    with open(conf_path) as f:
        data = yaml.safe_load(f) or {}
    if not data:
        return False
    module_key = next(iter(data))
    block = data[module_key] or {}
    return any(isinstance(v, dict) for v in block.values())


def list_params(conf_path):
    """Top-level parameter names under the module key (one level)."""
    with open(conf_path) as f:
        data = yaml.safe_load(f) or {}
    if not data:
        return []
    block = data[next(iter(data))] or {}
    return list(block.keys())


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: python scripts/inspect_module.py <module-name>")
    name = sys.argv[1]

    docs_root = os.getcwd()  # expected: the igm-doc repo root
    igm_root = os.environ.get("IGM_ROOT", os.path.join(docs_root, os.pardir, "igm"))
    igm_root = os.path.abspath(igm_root)

    failures = []

    section = find_section(igm_root, name)
    if section is None:
        # Precondition 4 failed and we cannot derive paths without a section.
        failures.append(
            f"source package not found: no igm/<section>/{name}/ under {igm_root} "
            f"(searched sections: {', '.join(SECTIONS)})"
        )
        print(json.dumps({"ok": False, "module": name, "failures": failures}, indent=2))
        sys.exit(1)

    pkg_dir = os.path.join(igm_root, section, name)
    conf = os.path.join(igm_root, "conf", section, f"{name}.yaml")
    conf_help = os.path.join(igm_root, "conf_help", section, f"{name}.yaml")
    module_meta_yaml = os.path.join(pkg_dir, f"{name}.yaml")
    page = os.path.join(docs_root, "docs", "modules", section, f"{name}.md")

    # Precondition 2 & 3: config and config-help must exist.
    if not os.path.isfile(conf):
        failures.append(f"missing config: {conf}")
    if not os.path.isfile(conf_help):
        failures.append(f"missing config-help: {conf_help}")

    # Precondition 1: per-module metadata YAML must exist in the source package
    # (replaces the old centralized modules.yaml; skill never writes it).
    metadata = None
    if not os.path.isfile(module_meta_yaml):
        failures.append(
            f"missing per-module metadata: {module_meta_yaml} — add it "
            f"(fields: description, category, authors, needs, updates) before documenting"
        )
    else:
        with open(module_meta_yaml) as f:
            metadata = yaml.safe_load(f) or {}
        for required in ("description", "category", "authors", "needs", "updates"):
            if required not in metadata:
                failures.append(
                    f"{module_meta_yaml} is missing required field '{required}'"
                )

    if failures:
        print(json.dumps({"ok": False, "module": name, "section": section,
                          "failures": failures}, indent=2))
        sys.exit(1)

    report = {
        "ok": True,
        "module": name,
        "section": section,
        "package_dir": pkg_dir,
        "package_files": sorted(
            f for f in os.listdir(pkg_dir)
            if f.endswith(".py") and f != "__pycache__"
        ),
        "config_path": conf,
        "config_help_path": conf_help,
        "config_shape": "nested" if is_nested(conf) else "flat",
        "param_table_variant": "tree" if is_nested(conf) else "notree",
        "params": list_params(conf),
        "metadata": metadata,
        "render_module_io": section != "assimilations",  # assimilations pages omit it
        "page_path": page,
        "page_exists": os.path.isfile(page),
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
