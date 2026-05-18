# Virtual Environments

A virtual environment isolates IGM's dependencies from the rest of your system, preventing version conflicts with other Python projects. Two options are available.

## conda (recommended)

Install [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or [Anaconda](https://www.anaconda.com/download), then create and activate an environment:

```bash
conda create -n igm python=3.11
conda activate igm
```

!!! tip
    Check [IGM's `setup.py`](https://github.com/instructed-glacier-model/igm/blob/main/setup.py) to confirm the supported Python version range before creating the environment.

## venv

Python's built-in `venv` module requires no extra installation:

```bash
python3.11 -m venv igm
```

Then activate the environment:

=== "Linux / macOS"
    ```bash
    source igm/bin/activate
    ```

=== "Windows (PowerShell)"
    ```bash
    igm\Scripts\activate
    ```

Once the environment is active, return to the [Installation](../quick_start.md) page to install IGM.
