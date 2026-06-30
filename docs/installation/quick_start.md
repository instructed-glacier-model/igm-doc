# Installation

IGM requires **Python 3.10–3.11**. GPU acceleration requires an NVIDIA card; CPU-only runs are slower but fully supported.

!!! note "Coming from IGM v2?"
    This documentation covers IGM v3. For IGM v2, visit the [former documentation](https://github.com/instructed-glacier-model/igm/wiki) or the [v2 → v3 migration guide](../about/transition-IGM-2-to-3.md).

!!! note "Upgrading from IGM v3.1?"
    See the [v3.1 → v3.2 migration guide](../about/transition-IGM-3.1-to-3.2.md) for the breaking changes between those releases.

---

## Prerequisites

Select your operating system:

=== "Linux"
    Check that your NVIDIA driver is installed and up to date:

    ```bash
    nvidia-smi
    ```

    If the command is not found or the driver is outdated, see [NVIDIA Drivers](other/nvidia_drivers.md).

=== "macOS (Apple Silicon)"
    - **CPU:** works out of the box — no driver or source changes needed.
    - **M-series GPU (Metal):** supported, but requires installing from source (see Install below). Only tested on M4.

=== "Windows"
    TensorFlow does not support GPU execution natively on Windows, and `oggm_shop` does not work on Windows. Install **WSL2 (Ubuntu)** first — it provides a Linux terminal and inherits your host NVIDIA drivers automatically.

    ```bash
    wsl --install Ubuntu-22.04
    sudo apt update && sudo apt upgrade
    ```

    See [WSL2 setup](other/wsl_windows.md) for a detailed walkthrough. Once inside WSL, follow the **Linux** instructions above.

---

## Virtual environment

=== "conda (recommended)"
    ```bash
    conda create -n igm python=3.11
    conda activate igm
    ```

=== "venv"
    ```bash
    python3.11 -m venv igm
    source igm/bin/activate
    ```

See [Virtual Environments](other/virtual_environment.md) for a more detailed walkthrough.

---

## Install

=== "Standard (pip)"
    ```bash
    pip install igm-model
    ```

    To pin a specific release for reproducibility:

    ```bash
    pip install "igm-model==3.1.1"
    ```

    All available releases are listed on [PyPI](https://pypi.org/project/igm-model/#history).

=== "From source"
    For the latest development version or to contribute to IGM:

    ```bash
    git clone https://github.com/instructed-glacier-model/igm.git
    cd igm
    pip install -e .
    ```

    The `-e` flag installs IGM in editable mode: changes to the source are reflected immediately without reinstalling.

    !!! warning
        The source version may be unstable between releases. For production use, prefer `pip install igm-model`.

=== "macOS (Apple Silicon, M-series GPU)"
    Clone the repository and make two manual edits before installing.

    ```bash
    git clone https://github.com/instructed-glacier-model/igm.git
    cd igm
    ```

    **1. Edit `setup.py`** — replace the TensorFlow lines:

    ```python
    # Remove:
    "tensorflow[and-cuda]==2.15.1",
    "tensorflow-probability==0.23.0",

    # Add:
    "tensorflow-macos==2.14.0",
    "tensorflow-metal",
    #"tensorflow-probability==0.23.0",
    ```

    **2. Disable JIT compilation** — `tensorflow-metal` does not support JIT compilation. Replace every occurrence of `jit_compile=True` with `jit_compile=False` throughout the source:

    ```bash
    grep -rl "jit_compile=True" . | xargs sed -i '' 's/jit_compile=True/jit_compile=False/g'
    ```

    **3. Install:**

    ```bash
    pip install -e .
    ```

    !!! note
        This procedure has been tested on M4. We plan to streamline macOS installation in a future release.

---

## Verify

```bash
igm_run --help
```

A successful installation prints the IGM help text. You are ready to run your first simulation.
