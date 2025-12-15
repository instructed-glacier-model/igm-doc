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
