"""
Main configuration module for MkDocs macros.

This module provides custom Jinja2 filters and macros for the IGM documentation:
- YAML configuration loading
- Citation handling and bibliography integration
- Custom markdown filters for inline citations
- Units formatting

The citation system works in conjunction with:
- mkdocs-bibtex plugin for bibliography generation
- cite-linkify.js for converting footnote citations to inline links
- refs.css for citation styling
"""

import yaml
import re
import os


def define_env(env):
    # Load bibliography once at initialization
    bib_cache = {}
    # Track citations used in YAML descriptions
    yaml_citations = set()
    # Track citation usage count for unique IDs
    citation_counters = {}

    def load_bib():
        """
        Load and parse the bibliography file (refs.bib).

        Returns:
            dict: Mapping of citation keys to formatted citation strings (Author, Year).
        """
        if bib_cache:
            return bib_cache

        bib_path = os.path.join(os.path.dirname(__file__), 'refs.bib')
        try:
            with open(bib_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Parse bib file to extract author and year for each entry
            entries = re.findall(r'@\w+\{([^,]+),\s*.*?author\s*=\s*\{([^}]+)\}.*?year\s*=\s*\{?(\d{4})\}?',
                                content, re.DOTALL | re.IGNORECASE)

            for key, author, year in entries:
                # Extract last name of first author
                author_parts = author.split(',')[0].strip().split()
                last_name = author_parts[-1] if author_parts else author
                # Check if there are multiple authors (et al.)
                et_al = ' et al.' if ',' in author or ' and ' in author.lower() else ''
                bib_cache[key] = f"({last_name}{et_al}, {year})"

            if not bib_cache:
                print(f"Warning: No bibliography entries found in {bib_path}")

        except FileNotFoundError:
            print(f"Warning: Bibliography file not found at {bib_path}")
        except UnicodeDecodeError as e:
            print(f"Error: Could not decode bibliography file (encoding issue): {e}")
        except Exception as e:
            print(f"Error: Unexpected error loading bibliography: {e}")

        return bib_cache

    @env.macro
    def load_yaml(file_path):
        """
        Load a YAML configuration file.

        Args:
            file_path: Path to the YAML file to load

        Returns:
            dict: Parsed YAML content
        """
        try:
            with open(file_path, "r", encoding='utf-8') as file:
                return yaml.safe_load(file)
        except FileNotFoundError:
            print(f"Error: YAML file not found: {file_path}")
            return {}
        except yaml.YAMLError as e:
            print(f"Error: Invalid YAML in {file_path}: {e}")
            return {}
        except Exception as e:
            print(f"Error: Could not load YAML file {file_path}: {e}")
            return {}

    @env.macro
    def render_yaml_citations():
        """
        Output hidden citation markers for all citations used in YAML files.

        This ensures the bibtex plugin generates bibliography entries for citations
        used in YAML descriptions. For each citation, it's repeated based on usage
        count to generate multiple back-arrows in the bibliography.

        The citation markers are hidden via CSS but processed by the bibtex plugin.
        The cite-linkify.js script then converts visible footnote references into
        inline clickable links.

        Returns:
            str: HTML div containing hidden citation markers, or empty string if none
        """
        if not yaml_citations:
            return ""

        # Generate citation markers - repeat each citation based on usage count
        citations = []
        for key in sorted(yaml_citations):
            count = citation_counters.get(key, 1)
            # Add the citation once for each occurrence
            citations.extend([f"[@{key}]"] * count)

        citations_str = " ".join(citations)
        result = f'<div style="display: none;" class="yaml-citations">{citations_str}</div>'

        # Clear citations for next page
        yaml_citations.clear()
        citation_counters.clear()

        return result

    @env.filter
    def format_units(units):
        """
        Format units for display, handling special cases and LaTeX notation.

        Args:
            units: Unit string (e.g., "m", "m^{2}", "dimless")

        Returns:
            str: Formatted unit string with proper HTML/LaTeX markup
        """
        if not units:
            return ""
        if units == "dimless":
            return "—"
        # Convert exponent notation to MathJax format
        return re.sub(r"\^(\{[^}]+\})", r'<span class="math">\\( ^\1 \\)</span>', units)

    @env.filter
    def markdown_inline(text):
        """
        Convert markdown text (including citations) to HTML.

        Processes [@CitationKey] syntax and creates clickable citation links.
        Each citation instance is tracked and assigned a unique ID to enable
        multiple back-references from the bibliography.

        Citation ID format:
        - First instance: fnref:CitationKey
        - Second instance: fnref2:CitationKey
        - Third instance: fnref3:CitationKey, etc.

        This matches the format expected by the bibtex plugin for back-references.

        Args:
            text: Markdown text with potential [@CitationKey] markers

        Returns:
            str: HTML with citations converted to clickable links
        """
        if not text:
            return text

        try:
            # Load bibliography
            bib = load_bib()

            # Replace [@CitationKey] with clickable (Author, Year) format
            def replace_citation(match):
                cite_key = match.group(1)
                # Track this citation
                yaml_citations.add(cite_key)

                # Increment counter for this citation to create unique IDs
                if cite_key not in citation_counters:
                    citation_counters[cite_key] = 0
                citation_counters[cite_key] += 1

                # Create unique ID for this citation instance
                # First instance gets fnref:Key, subsequent ones get fnref2:Key, fnref3:Key, etc.
                if citation_counters[cite_key] == 1:
                    ref_id = f"fnref:{cite_key}"
                else:
                    ref_id = f"fnref{citation_counters[cite_key]}:{cite_key}"

                if cite_key in bib:
                    citation_text = bib[cite_key]
                    # Create a clickable link with an anchor ID
                    return f'<span id="{ref_id}"><a href="#fn:{cite_key}" class="citation-link">{citation_text}</a></span>'
                else:
                    print(f"Warning: Citation key '{cite_key}' not found in bibliography")
                    return f"({cite_key})"  # Fallback if not found

            # Replace citation markers
            text = re.sub(r'\[@([^\]]+)\]', replace_citation, text)

            # Convert any remaining markdown to HTML
            html = env.markdown.convert(text)

            # Remove the wrapping <p> tags for inline display
            html = re.sub(r'^<p>(.*)</p>$', r'\1', html, flags=re.DOTALL)

            # Remove any footnote markers that might have been created by markdown processor
            html = re.sub(r'<sup[^>]*>.*?</sup>', '', html, flags=re.DOTALL)
            html = re.sub(r'\[\^[^\]]+\]', '', html)

            return html
        except AttributeError as e:
            print(f"Error: Markdown conversion failed (missing env.markdown?): {e}")
            return re.sub(r'\[@([^\]]+)\]', r'(\1)', text)
        except Exception as e:
            print(f"Error: Unexpected error in markdown_inline filter: {e}")
            # Fallback: just remove citation markers
            return re.sub(r'\[@([^\]]+)\]', r'(\1)', text)

    @env.macro
    def render_year_histogram(yaml_path):
        """
        Render a horizontal-bar histogram of papers per year from a YAML
        publications file. Years are shown in ascending order. Each row
        has the year label, a bar whose width is proportional to the
        per-year paper count, and the count itself.
        """
        from collections import Counter
        from html import escape

        try:
            with open(yaml_path, "r", encoding="utf-8") as f:
                papers = yaml.safe_load(f) or []
        except (FileNotFoundError, yaml.YAMLError):
            return ""

        counts = Counter(int(p["year"]) for p in papers if p.get("year"))
        if not counts:
            return ""
        total = sum(counts.values())
        max_n = max(counts.values())
        years_sorted = sorted(counts.keys())

        rows = []
        for y in years_sorted:
            n = counts[y]
            pct = 100.0 * n / max_n
            rows.append(
                '<div class="paper-hist-row">'
                f'<span class="paper-hist-year">{y}</span>'
                '<div class="paper-hist-bar-track">'
                f'<div class="paper-hist-bar" style="width: {pct:.1f}%"></div>'
                '</div>'
                f'<span class="paper-hist-count">{n}</span>'
                '</div>'
            )
        header = (
            f'<div class="paper-hist-header">'
            f'<strong>{total}</strong> papers using IGM across '
            f'<strong>{len(years_sorted)}</strong> years '
            f'({years_sorted[0]}–{years_sorted[-1]})'
            f'</div>'
        )
        return (
            '<div class="paper-hist">'
            f'{header}'
            f'{"".join(rows)}'
            '</div>'
        )

    @env.macro
    def render_gallery(yaml_path):
        """
        Render a publications gallery from a YAML file.

        Schema per entry: title, authors, year (required); journal, doi,
        image | video, links (list of {type, url}), tags (all optional).
        Paths in `image` are resolved relative to the docs/ directory.

        Args:
            yaml_path: Path to the YAML file (relative to mkdocs.yml dir).

        Returns:
            str: HTML for the gallery, grouped by year (descending).
        """
        from collections import defaultdict
        from html import escape

        try:
            with open(yaml_path, "r", encoding="utf-8") as f:
                papers = yaml.safe_load(f) or []
        except FileNotFoundError:
            return f"<p><em>Gallery file not found: {escape(yaml_path)}</em></p>"
        except yaml.YAMLError as e:
            return f"<p><em>Invalid YAML in {escape(yaml_path)}: {escape(str(e))}</em></p>"

        def render_media(p):
            video = p.get("video")
            image = p.get("image")
            title = escape(p.get("title", ""))
            if video:
                if video.startswith("http"):
                    return (f'<div class="gallery-media">'
                            f'<iframe src="{escape(video)}" loading="lazy" '
                            f'frameborder="0" allowfullscreen></iframe></div>')
                return (f'<div class="gallery-media"><video controls preload="metadata">'
                        f'<source src="../{escape(video)}"></video></div>')
            if image:
                src = image if image.startswith("http") else f"../{image}"
                return (f'<div class="gallery-media">'
                        f'<img src="{escape(src)}" alt="{title}" loading="lazy">'
                        f'</div>')
            return '<div class="gallery-media gallery-media-empty">📄</div>'

        def render_chips(p):
            chips = []
            seen_paper = False
            for link in p.get("links") or []:
                ltype = escape(str(link.get("type", "link")))
                url = escape(str(link.get("url", "#")))
                if ltype == "paper":
                    seen_paper = True
                chips.append(f'<a class="gallery-chip gallery-chip-{ltype}" '
                             f'href="{url}" target="_blank" rel="noopener">{ltype}</a>')
            doi = p.get("doi")
            if doi and not seen_paper:
                chips.append(f'<a class="gallery-chip gallery-chip-paper" '
                             f'href="https://doi.org/{escape(str(doi))}" '
                             f'target="_blank" rel="noopener">doi</a>')
            return "".join(chips)

        by_year = defaultdict(list)
        for p in papers:
            by_year[p.get("year", 0)].append(p)

        out = []
        for year in sorted(by_year.keys(), reverse=True):
            items = by_year[year]
            out.append(f'<h2 class="gallery-year">{year}</h2>')
            out.append('<div class="gallery-grid">')
            for p in items:
                meta_parts = [p.get("authors"), p.get("journal"), str(p.get("year", ""))]
                meta = " · ".join(escape(str(s)) for s in meta_parts if s)
                out.append(
                    '<div class="gallery-card">'
                    f'{render_media(p)}'
                    '<div class="gallery-body">'
                    f'<div class="gallery-title">{escape(p.get("title", ""))}</div>'
                    f'<div class="gallery-meta">{meta}</div>'
                    f'<div class="gallery-chips">{render_chips(p)}</div>'
                    '</div></div>'
                )
            out.append('</div>')
        return "\n".join(out)
