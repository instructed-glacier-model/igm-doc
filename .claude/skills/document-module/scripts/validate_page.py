#!/usr/bin/env python3
"""Validate a generated IGM module doc page before declaring success.

Checks, in order:
  1. Every [@citation] key used in the page exists in refs.bib.
  2. Every config / config-help path referenced by the page resolves to a file.

Run from the igm-doc repo root. Exits non-zero with verbose, specific messages
if any check fails (so the caller can fix and re-run).

Usage:
    python scripts/validate_page.py docs/modules/<section>/<name>.md
"""

import os
import re
import sys

# A citation token is @key inside [@...]; keys may be grouped: [@a; @b].
# Keys use letters, digits, and the usual bibtex punctuation.
CITE_RE = re.compile(r"@([A-Za-z0-9_:.\-]+)")
BRACKET_CITE_RE = re.compile(r"\[@[^\]]+\]")
BIB_KEY_RE = re.compile(r"^@\w+\s*\{\s*([^,\s]+)\s*,", re.MULTILINE)
# Paths the page hands to load_yaml('...') and {% include "..." %}.
LOADYAML_RE = re.compile(r"load_yaml\(\s*['\"]([^'\"]+)['\"]\s*\)")
INCLUDE_RE = re.compile(r"{%\s*include\s+['\"]([^'\"]+)['\"]")


def cited_keys(text):
    keys = set()
    for bracket in BRACKET_CITE_RE.findall(text):
        keys.update(CITE_RE.findall(bracket))
    return keys


def bib_keys(bib_path):
    with open(bib_path) as f:
        return set(BIB_KEY_RE.findall(f.read()))


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: python scripts/validate_page.py <page.md>")
    page = sys.argv[1]
    if not os.path.isfile(page):
        sys.exit(f"page not found: {page}")

    docs_root = os.getcwd()  # expected: the igm-doc repo root
    problems = []

    with open(page) as f:
        text = f.read()

    # --- Check 1: citation keys ---
    refs_bib = os.path.join(docs_root, "refs.bib")
    if not os.path.isfile(refs_bib):
        problems.append(f"refs.bib not found at {refs_bib} — cannot verify citations")
    else:
        known = bib_keys(refs_bib)
        for key in sorted(cited_keys(text)):
            if key not in known:
                problems.append(
                    f"citation [@{key}] has no entry in refs.bib — convert it to "
                    f"<!-- REVIEW: cite? --> or add the bib entry"
                )

    # --- Check 2: referenced yaml paths resolve ---
    # load_yaml(...) paths are relative to the mkdocs project root (the igm-doc
    # repo root), so '../igm/...' reaches the sibling igm checkout.
    for rel in LOADYAML_RE.findall(text):
        resolved = os.path.normpath(os.path.join(docs_root, rel))
        if not os.path.isfile(resolved):
            problems.append(f"load_yaml path does not resolve: {rel} -> {resolved}")
    # {% include %} paths are relative to the page file's own directory.
    page_dir = os.path.dirname(os.path.abspath(page))
    for rel in INCLUDE_RE.findall(text):
        # Skip includes/ jinja templates (resolved by the mkdocs include dir, not files here).
        if rel.startswith("includes/"):
            continue
        resolved = os.path.normpath(os.path.join(page_dir, rel))
        if not os.path.isfile(resolved):
            problems.append(f"include path does not resolve: {rel} -> {resolved}")

    if problems:
        print("VALIDATION FAILED:")
        for p in problems:
            print(f"  - {p}")
        sys.exit(1)
    print("VALIDATION OK: citations and config paths all resolve.")


if __name__ == "__main__":
    main()
