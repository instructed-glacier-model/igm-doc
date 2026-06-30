# Frequently Asked Questions

??? question "TensorFlow prints a lot of messages at startup — how do I suppress them?"
    Prefix any `igm_run` command with `TF_CPP_MIN_LOG_LEVEL=3`:

    ```bash
    TF_CPP_MIN_LOG_LEVEL=3 igm_run +experiment=my_params
    ```

    To set it permanently for a terminal session:

    ```bash
    export TF_CPP_MIN_LOG_LEVEL=3
    ```

??? question "Ice is stuck on the border of the domain — what can I do?"
    Set the parameter `exclude_borders_from_iceflow` to `True` in your iceflow configuration:

    ```yaml
    processes:
      iceflow:
        exclude_borders_from_iceflow: True
    ```

    This prevents the solver from computing ice velocities in cells that touch the domain boundary, which can otherwise cause spurious accumulation.

??? question "I see numerical artefacts (waves, oscillations) in the ice thickness — what can I do?"
    Reduce the `CFL` parameter in the `time` module (default ≈ 0.5; try 0.2–0.3):

    ```yaml
    processes:
      time:
        cfl: 0.3
    ```

    See [Numerical Tips](numerical_tips.md) for a full explanation of the CFL condition.

??? question "How do I choose the `smb` method (`simple`, `oggm`, or `accpdd`)?"

    Set `processes.smb.method`:

    | Method | Best for |
    |---|---|
    | `simple` | Quick tests, conceptual experiments, idealised setups |
    | `oggm` | Real glaciers where OGGM data is available; calibrated against geodetic mass balance |
    | `accpdd` | Studies where explicit snowpack or melt-factor sensitivity matters |

    Start with `method: oggm` for real-world applications — it is calibrated and requires no extra data beyond what `oggm_shop` provides.

??? question "How do I create or modify NetCDF input files?"
    The [NCO](http://nco.sourceforge.net/) toolkit provides convenient command-line operations:

    ```bash
    ncks -x -v thk file.nc file.nc              # remove variable 'thk'
    ncks -v usurf file.nc extracted.nc           # extract variable 'usurf'
    ncap2 -h -O -s 'thk=0*thk' file.nc file.nc  # set 'thk' to zero
    ncrename -v apc,strflowctrl file.nc          # rename a variable
    ```

    Python alternatives: [xarray](https://docs.xarray.dev/), [netCDF4-python](https://unidata.github.io/netcdf4-python/).

??? question "OGGM Shop produces an error on Windows"
    OGGM is [not officially supported on Windows](https://github.com/OGGM/oggm/issues/870). The recommended workaround is to use [WSL2](../installation/other/wsl_windows.md). Alternatively, modifying `tarfile.py` at line 2677 from `name == member_name` to `name.replace(os.sep, '/') == member_name` has been reported to fix the issue (credit: Alexi Morin).

??? question "Should I use a GPU or a CPU?"
    IGM works well on CPUs for small to medium domains (a single alpine glacier at 100–200 m resolution). For large domains (regional to global, or very fine resolution), a GPU is strongly recommended and can be 10–100× faster. IGM automatically detects and uses a GPU when one is available — no configuration change is required.

    See this [example video](https://youtu.be/Sna673xb-PE) for a demonstration.

??? question "How do I select a specific GPU on a multi-GPU machine?"
    Set `core.hardware.visible_gpus` at the top of your parameter file to a list containing the index of the GPU you want to use:

    ```yaml
    core:
      hardware:
        visible_gpus: [1]   # use the second GPU (0-indexed)
    ```

    The default is `[0]` (first GPU). IGM currently supports only one visible GPU at a time.

??? question "How do I know if the iceflow emulator has converged?"
    Monitor the iceflow cost function value printed during the run. It should decrease and plateau. If it keeps oscillating or does not decrease, try:

    - Increasing `nbit` (more iterations per solve).
    - Reducing the learning rate (`lr` / `lr_init`).
    - Running a short test with `mapping: identity` (the direct solver) for comparison — note that `lr` / `lr_init` should be ~0.9 in that case.

??? question "Can I run multiple glaciers simultaneously?"
    Yes — use Hydra's multirun feature to launch independent simulations in parallel:

    ```bash
    igm_run +experiment=params \
      input.local.filename=glacier_a.nc,glacier_b.nc \
      --multirun
    ```

    Each simulation runs in a separate process. If you have multiple GPUs, assign one per simulation via `hydra/launcher=joblib`.

??? question "Where can I get help or report a bug?"
    - **Discord**: join the community server (link on the [Support](../about/help.md) page)
    - **GitHub issues**: [github.com/instructed-glacier-model/igm/issues](https://github.com/instructed-glacier-model/igm/issues)
    - **Email**: see the [Support](../about/help.md) page
