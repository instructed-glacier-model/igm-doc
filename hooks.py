"""MkDocs build hooks for IGM documentation."""

import subprocess
import sys
from pathlib import Path


def on_pre_build(config, **kwargs):
    """Regenerate the dependency graph HTML before each build."""
    script = Path(__file__).parent / "process_dependency_viz.py"
    subprocess.run([sys.executable, str(script)], check=True, cwd=str(Path(__file__).parent))
