#!/usr/bin/env python3
"""Insert a module's page into the mkdocs.yml nav (idempotent, append-at-group-end).

Run from the igm-doc repo root (igm source resolved as the sibling ../igm, or via
the IGM_ROOT env var). Reads the module's per-module metadata (<section>/<name>/
<name>.yaml) to decide which nav group the entry belongs in, then inserts

    - <name>: modules/<section>/<name>.md

at the END of that group, preserving all existing ordering and file formatting.
The edit is a surgical text insertion (never a YAML parse-and-redump), so comments
and curated ordering are untouched. After editing, the file is re-parsed to confirm
it is still valid YAML; if not, nothing is written.

Group resolution (driven by the module's `type:` field, default `core`):
    processes type=core      -> Process Modules   > <Category label>   (nested)
    processes type=community -> Community Modules  > <Category label>   (nested)
    assimilations            -> Assimilation Modules                   (flat)
    inputs                   -> Input Modules                           (flat)
    outputs                  -> Output Modules                          (flat)

type=experimental and type=deprecated modules are ignored (hidden from the
documentation); the script adds no nav entry. A community module outside
`processes` has no existing nav home; the script makes no change and prints a
REVIEW note instead of guessing.

Usage:
    python scripts/update_nav.py <module-name>
"""

import os
import sys

try:
    import yaml
except ImportError:
    sys.exit("PyYAML is required (pip install pyyaml).")

SECTIONS = ["processes", "assimilations", "inputs", "outputs"]
FLAT_GROUP = {  # section -> top-level nav group header (no category nesting)
    "assimilations": "Assimilation Modules",
    "inputs": "Input Modules",
    "outputs": "Output Modules",
}
SECTION_HEADER_INDENT = 6   # "      - <Group>:"
FLAT_ENTRY_INDENT = 10      # "          - <name>: ..."
CATEGORY_HEADER_INDENT = 10  # "          - <Category>:"
NESTED_ENTRY_INDENT = 14    # "              - <name>: ..."


def indent_of(line):
    return len(line) - len(line.lstrip(" "))


def find_section(igm_root, name):
    for section in SECTIONS:
        if os.path.isdir(os.path.join(igm_root, section, name)):
            return section
    return None


def yaml_is_valid(text):
    """Re-parse the (possibly custom-tagged) mkdocs.yml without choking on tags."""
    class _Loader(yaml.SafeLoader):
        pass
    _Loader.add_multi_constructor("", lambda loader, suffix, node: None)
    _Loader.add_multi_constructor("!", lambda loader, suffix, node: None)
    try:
        yaml.load(text, Loader=_Loader)
        return True, None
    except yaml.YAMLError as e:
        return False, str(e)


def category_label(igm_root_parent_docs, category):
    """Map a category key to its nav label via categories.yaml; title-case fallback."""
    cats_path = os.path.join(igm_root_parent_docs, "categories.yaml")
    try:
        with open(cats_path) as f:
            cats = yaml.safe_load(f) or {}
    except FileNotFoundError:
        cats = {}
    return cats.get(category, {}).get("label", category.title())


def find_group_header(lines, group_name):
    """Return index of '      - <group_name>:' at section-header indent, else None."""
    target = f"- {group_name}:"
    for i, line in enumerate(lines):
        if indent_of(line) == SECTION_HEADER_INDENT and line.strip() == target:
            return i
    return None


def group_extent(lines, header_idx):
    """Index one past the last line belonging to the group started at header_idx."""
    j = header_idx + 1
    while j < len(lines) and (lines[j].strip() == "" or indent_of(lines[j]) > SECTION_HEADER_INDENT):
        j += 1
    return j


def insert_flat(lines, header_idx, entry):
    """Append entry at the end of a flat (un-nested) section group."""
    end = group_extent(lines, header_idx)
    # Back up over trailing blank lines so the entry sits with its siblings.
    pos = end
    while pos - 1 > header_idx and lines[pos - 1].strip() == "":
        pos -= 1
    new_line = " " * FLAT_ENTRY_INDENT + entry
    lines.insert(pos, new_line)
    return lines


def insert_nested(lines, header_idx, label, entry):
    """Insert entry under category <label> within a nested group; create the
    category block at the group end if it does not yet exist."""
    end = group_extent(lines, header_idx)
    cat_target = f"- {label}:"
    cat_idx = None
    for i in range(header_idx + 1, end):
        if indent_of(lines[i]) == CATEGORY_HEADER_INDENT and lines[i].strip() == cat_target:
            cat_idx = i
            break

    new_entry = " " * NESTED_ENTRY_INDENT + entry
    if cat_idx is None:
        # Create a new category block at the end of the group.
        pos = end
        while pos - 1 > header_idx and lines[pos - 1].strip() == "":
            pos -= 1
        block = [" " * CATEGORY_HEADER_INDENT + cat_target, new_entry]
        for k, ln in enumerate(block):
            lines.insert(pos + k, ln)
        return lines

    # Find the end of this category's children (indent > CATEGORY_HEADER_INDENT).
    j = cat_idx + 1
    while j < end and (lines[j].strip() == "" or indent_of(lines[j]) > CATEGORY_HEADER_INDENT):
        j += 1
    pos = j
    while pos - 1 > cat_idx and lines[pos - 1].strip() == "":
        pos -= 1
    lines.insert(pos, new_entry)
    return lines


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: python scripts/update_nav.py <module-name>")
    name = sys.argv[1]

    docs_root = os.getcwd()  # expected: the igm-doc repo root
    igm_root = os.environ.get("IGM_ROOT", os.path.join(docs_root, os.pardir, "igm"))
    igm_root = os.path.abspath(igm_root)

    section = find_section(igm_root, name)
    if section is None:
        sys.exit(f"source package not found: no igm/<section>/{name}/ under {igm_root}")

    meta_path = os.path.join(igm_root, section, name, f"{name}.yaml")
    if not os.path.isfile(meta_path):
        sys.exit(f"missing per-module metadata: {meta_path}")
    with open(meta_path) as f:
        meta = yaml.safe_load(f) or {}
    mod_type = str(meta.get("type") or "core")
    # experimental and deprecated modules are kept out of the documentation
    if mod_type in ("experimental", "deprecated"):
        print(
            f"NAV SKIP: '{name}' is type={mod_type}; {mod_type} modules are "
            f"ignored (hidden from the documentation). No nav entry is added, and "
            f"no documentation page should be created for it."
        )
        return
    community = mod_type == "community"

    mkdocs = os.path.join(docs_root, "mkdocs.yml")
    if not os.path.isfile(mkdocs):
        sys.exit(f"mkdocs.yml not found at {mkdocs}")

    page_rel = f"modules/{section}/{name}.md"
    entry = f"- {name}: {page_rel}"

    with open(mkdocs) as f:
        original = f.read()

    # Idempotency: already wired in.
    if page_rel in original:
        print(f"NAV OK: '{name}' already present in mkdocs.yml ({page_rel}); no change.")
        return

    lines = original.splitlines()

    if section == "processes":
        group_name = "Community Modules" if community else "Process Modules"
        label = category_label(docs_root, meta.get("category", "misc"))
        header_idx = find_group_header(lines, group_name)
        if header_idx is None:
            sys.exit(f"could not find nav group '{group_name}' in mkdocs.yml")
        insert_nested(lines, header_idx, label, entry)
        placed = f"{group_name} > {label}"
    else:
        if community:
            print(
                f"NAV REVIEW: '{name}' is a community {section} module, but the nav has "
                f"no 'Community Modules > {section}' group. Add a nav entry manually:\n"
                f"      - {entry}"
            )
            return
        group_name = FLAT_GROUP[section]
        header_idx = find_group_header(lines, group_name)
        if header_idx is None:
            sys.exit(f"could not find nav group '{group_name}' in mkdocs.yml")
        insert_flat(lines, header_idx, entry)
        placed = group_name

    new_text = "\n".join(lines)
    if original.endswith("\n") and not new_text.endswith("\n"):
        new_text += "\n"

    ok, err = yaml_is_valid(new_text)
    if not ok:
        sys.exit(f"refusing to write: edited mkdocs.yml no longer parses as YAML:\n{err}")

    with open(mkdocs, "w") as f:
        f.write(new_text)
    print(f"NAV UPDATED: inserted '{entry}' under {placed}.")


if __name__ == "__main__":
    main()
