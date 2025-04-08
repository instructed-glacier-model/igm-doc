
# Transitioning IGM from v2 to v3: Guideline

# In short

This is a major structural update, and we are starting a new versioning series with IGM 3.0.0. Below are the main changes and improvements you can expect:

- **Hydra integration (game changer!):** The most important update is the integration of the Hydra library for handling parameters. This allows you to run large multi-ensemble simulations (poss on multiple GPUs) from a single command line, with full traceability and reproducibility. No more manually managing complex parameter files—Hydra does it for you, and does it extremely well. This alone is a compelling reason to switch to IGM3!

- **YAML-based parameters with hierarchical structure:** All parameters are now defined in YAML (instead of JSON), offering a more powerful and flexible configuration format. Especially, parameters are now organized hierarchically, making it much easier to manage large configurations. This comes with renamed parameters, but don’t worry—we provide a tool to convert old JSON files to the new YAML format, along with a conversion table.

- **New documentation website:** A freshly built documentation website now automatically collects all parameter definitions, along with their default values, descriptions, and units.

- **Clean folder structure:** The working directory is now properly organized into subfolders for parameters, data, user modules, and output.

- **Improved code readability:** Key modules like iceflow and data_assimilation (formerly optimize) have been split into sub-files to improve readability, maintainability, and customization.

Here are the important new links:

- The pre-release is on the usual https://github.com/jouvetg/igm , but you need to checkout the feature/hydra branch.

- The new documentation website is here : https://jouvetg.github.io/igm-doc/

- The separate repo containing examples : https://github.com/instructed-glacier-model/igm-examples

- The repo with the current technical paper re-shaped for IGM 3.0.0 : https://github.com/instructed-glacier-model/igm-paper

# In more details (for users)

## Parameter handling

### `hydra` library replaces `parser`, and YAML file

Parameters previously managed with the `parser` library are now handled using the `hydra` library. The parameter file, which was formerly a JSON file (`params.json`), has been transitioned to a YAML file (`experiment/params.yaml`) adhering to the YAML standard. This shift to `hydra` has significantly simplified the core IGM code. Running IGM now involves executing commands like:

```
 igm_run +experiment=params 
```

where parameters can be changed within the `params.yaml` file, or overridden directly in the command line. For example:

```bash
igm_run +experiment=params processes.time.start=1900 processes.time.end=2100
```

From a user perspective, migrating to IGM 3 essentially involves converting the former parameter file `params.json` into the new `experiment/params.yaml` format. To facilitate this transition, we provide a utility script named `json_to_yaml.py` (in the root of IGM repo) that automates the conversion process (you may have to adjust manually, check it afterwards!).

### Parameter Naming Changes, and hierarchical construction

Parameter names have been slightly modified. Previously, all parameters included a prefix like `iflo` to indicate they were associated with the `iceflow` module. Now, parameters are organized hierarchically by attributes, making the prefix redundant and therefore removed. For example: `time_start` is now accessible as `processes.time.start`.

In the `iceflow` module, parameters have been significantly reorganized to follow a **hierarchical structure**. To assist with the transition, we provide a script named `json_to_yaml.py`, and correspondence table to help convert old JSON files into the new YAML format. Also, IGM now raises an error if a parameter contains a typo, and suggests parameters to pick.
 
### Example of new parameter file

Here is what the new parameter file looks like:
  
```yaml
# @package _global_

core:
  url_data: "https://www.dropbox.com/scl/fo/8ixpy27i67s04bp7uixoq/h?rlkey=0ye7rd4zkcqfhvzx7suunw3bk&dl=0"

defaults:
  - override /input: [load_ncdf]
  - override /modules: [smb_simple, iceflow, time, thk]
  - override /output: [write_ncdf, plot2d]

inputs:
  load_ncdf:
    input_file: data/input.nc

processes:
  iceflow:
    physics:
      init_slidingco: 0.0595
  time:
    start: 1880.0
    end: 2020.0
    save: 5.0 

outputs:
  plot2d:
    live: true
```

The above file will be read by Hydra in IGM and has the following structure:

- `core`: Includes all parameters specific to the core IGM run, such as logging, downloading data prior to the run, GPU-related settings, etc.
- `defaults`: Lists the input, process, and output modules to be used.
- `inputs`: Contains parameters to override the defaults for input modules.
- `processes`: Contains parameters to override the defaults for process modules.
- `outputs`: Contains parameters to override the defaults for output modules.

**Note:** The former module types `preprocess`, `process`, and `postprocess` have been renamed to `input`, `modules`, and `output`, respectively. 

### Running multiple runs

A great advantage of Hydra is the possibility it provides for running ensemble simulations. For example, the following command sequentially runs two simulations with two different sets of parameters:

```bash
igm_run -m +experiment=params processes.time.end=2080,2110
```

Alternatively, if you supply two parameter files (`params1` and `params2`), you can execute:

```bash
igm_run -m +experiment=params1,params2
```

You can also perform a grid search over multiple parameters. For instance, the following command runs simulations for a 3x2 parameter grid:

```bash
igm_run -m +experiment=params processes.time.start=1900,1910,1920 processes.time.end=2080,2110
```

In such cases, the output folder will be named `multirun` instead of `output`.

## New structure of working folder

The working folder is structured as follows:

- `experiment`: Contains the parameter files.
- `data`: Stores input data, if any.
- `user`: Contains user-defined/custom Python functions or modules.
- `output` or `multirun`: Contains the results of the IGM runs.

The folder structure looks like this:

```
├── experiment
│   └── params.yaml
├── data
│   ├── ...
├── user
│   ├── code
│   │   └── processes
│   │       └── mymodule.py
│   └── conf
│       └── processes
│           └── mymodule.yaml
└── output
  ├── 2025-03-06
  │   └── 15-43-37
  │   └── 15-44-07
  │       └── output.nc
  │       └── ...
```

## Integration and Exclusion of Former Modules

- Splitting of `iceflow` modules into `data_assimilation` and `pretraining`: The `iceflow` module has been split into two dedicated modules: `data_assimilation` (formerly `optimize`) and `pretraining`. This change was made to improve code organization and maintainability, as the `iceflow` module had grown too large. Previously, `data_assimilation` and `pretraining` were separate but had dependency issues with `iceflow`. With the new structure, both modules remain dependent on `iceflow`, but these dependencies are now handled seamlessly. When using `data_assimilation` or `pretraining`, ensure that the `iceflow` module is also included in your configuration. The order of inclusion does not matter.

- The modules `anim_mayavi`, `anim_plotly`, and `anim_video` have been externalized from IGM and moved to `utils`. These modules were purely for postprocessing and were executed at the very end. To simplify the core structure, they were externalized.

- Modules such as `print_comp` and `print_info` have been integrated into the core functionality of IGM.

- The `write_particles` functionality is now integrated into the `particule` module.

## New `local` module merging netcdf and tif

A new I/O module, `local`, has been introduced to replace the `load_XXX` and `write_XXX` modules. The `local` module leverages the `xarray` library, which is more powerful and supports loading both NetCDF (`.nc`) and GeoTIFF (`.tif`) files.

## `oggm_shop` requires coupling with `load_ncdf` or `local`

The `oggm_shop` module now exclusively handles downloading data (e.g., RGIXXXX folders) using OGGM and converting it into a NetCDF file (`input.nc`) that adheres to IGM's naming conventions. However, it no longer performs the task of loading this data into IGM. To process the downloaded data, you must pair `oggm_shop` with either the `load_ncdf` or `local` modules. 

For example, if you use `oggm_shop`, you must include `load_ncdf` or `local` as additional `inputs` modules in your configuration.
 
## Default Parameter Value Changes (Upcoming Release)

In the upcoming release, several default parameter values will be updated to improve performance and usability. These changes are not applied yet but will be included in the next version:

- **`retrain_freq` (current default: 10):** The current default retrains the ice flow CNN every 10 time steps. This frequency has been found insufficient in many cases. The next release will increase the retraining frequency to every 3 time steps.

- **`smooth_anisotropy_factor` (current default: 0.2):** The current value of 0.2 for anisotropic smoothing has been observed to cause chessboard effects in ice thickness. To address this, the next release will safely deactivate anisotropic smoothing by setting this parameter to 1.0.

- **`convexity_weight` (current default: unknown):** The current convexity weight, which is particularly useful in the absence of data, has been found to be highly empirical and non-intuitive. As a result, it will be deactivated in the next release by setting its value to 0.

- **`fix_opti_normalization_issue` (current default: false):** A normalization issue has been identified in the current cost function for data assimilation, where some terms use sums while others use means. This inconsistency has been compensated for by adjusting regularization parameters. The next release will address this issue by setting this parameter to `true`, ensuring consistent use of means throughout. Consequently, users will need to significantly increase the regularization parameters (approximately \(10^3\) for thickness and \(10^{10}\) for sliding coefficients).

- **`log_slidingco` (current default: false):** In the next release, the optimization will handle the square root of `slidingco` (scaled) instead of `slidingco` directly. This approach ensures that `slidingco` remains positive without explicitly enforcing positivity. Note that this change will affect the scaling of `slidingco` (approximately \(10^{-6}\)) when this option is set to `true`.

# In more details (for developpers)

## Hierachical and separated parameters and code

In IGM source code, the parameters and the code are now hierarchically organized. Default parameters are stored in the `igm/igm/conf` folder, which is separate from the code located in the `igm/igm` folder. This separation ensures a clean organization of configuration files and source code. Parameters are grouped into logical categories and subcategories within the YAML files. This structure mirrors the organization of the modules and processes in IGM. For example, the folder structure for default parameters looks like this:

```
igm/igm/conf
├── inputs
│   └── local.yaml
│   └── ...
├── processes
│   └── iceflow.yaml
│   └── ...
└── outputs
  └── plot2d.yaml
  └── ...
```

In the code, all parameters are accessible through the object `cfg`. For example, `cfg.processes.enthalpy.ref_temp` refers to a parameter associated with the `enthalpy` processes module.

On the other hand the structure for the code looks very similar:

```
igm/igm
├── inputs
│   └── local
│   └── ...
├── processes
│   └── iceflow
│   └── avalanche
└── outputs
  └── plot2d
  └── ...
```

## Custom modules (now called "user")

User modules are very useful when customizing applications. They can be used to tailor input, process, or output methods. To create such a user module, you need to create (or update) the `user` folder located at the root of your working directory, ensuring the following hierarchy is respected:

```
└── user
    ├── code
    │   └── inputs 
    │   │   └── my_inputs_module
    │   │       └── my_inputs_module.py 
    │   └── processes 
    │   │   └── my_processes_module
    │   │       └── my_processes_module.py 
    │   └── outputs 
    │       └── my_outputs_module
    │           └── my_outputs_module.py 
    └── conf
        └── inputs
            └── my_inputs_module.yaml 
        └── processes
            └── my_processes_module.yaml 
        └── outputs
            └── my_outputs_module.yaml 
```

where `my_processes_module.py` has the following structure (and require to define function `initialize`, `update`, and `finalize`):

```python
def initialize(cfg,state):
  ... 

def update(cfg,state):
  cfg.processes.clim_aletsch.time_resolution
  ... 
 
def finalize(cfg,state):
  pass
```

Note that `my_inputs_module.py` and `my_outputs_module.py` only require function `run` (and `initialize` for output).

Parameter files located in `conf/inputs`, `conf/processes`, and `conf/outputs` look like 
```yaml
update_freq: 1
time_resolution: 365
```
or in case there is no parameter (the file must exist as follows even if no parameter are defined):
```yaml
null
```

It is important to note that user modules take precedence over official modules. If a user module shares the same name as an official module, the user module will override the official one, and the official module will be ignored.

## Complex modules made more readables, and more customizable

Key modules like `iceflow` and `data_assimilation` (formerly optimize) have been split into sub-files to improve readability, maintainability, and customization. Sometimes, you may need to modify an existing built-in module, e.g. to test a new feature in the iceflow emulator/solver, or new cost in the data assimilation. This can be achieved by creating a user module that overrides the built-in functionality. Check at the page on `user modules` in the documentation.

# Parameter changes 

## Parameter name change table for `iceflow` module

| Formerly    | New name    |
|----------|------------|
|   iflo_type   |   iceflow.method  |
|   iflo_force_max_velbar   |   iceflow.force_max_velbar  |
|   iflo_gravity_cst   |   iceflow.physics.gravity_cst  |
|   iflo_ice_density   |   iceflow.physics.ice_density  |
|   iflo_init_slidingco   |   iceflow.physics.init_slidingco  |
|   iflo_init_arrhenius   |   iceflow.physics.init_arrhenius  |
|   iflo_enhancement_factor   |   iceflow.physics.enhancement_factor  |
|   iflo_exp_glen   |   iceflow.physics.exp_glen  |
|   iflo_exp_weertman   |   iceflow.physics.exp_weertman  |
|   iflo_regu_glen   |   iceflow.physics.regu_glen  |
|   iflo_regu_weertman   |   iceflow.physics.regu_weertman  |
|   iflo_new_friction_param   |   iceflow.physics.new_friction_param  |
|   iflo_dim_arrhenius   |   iceflow.physics.dim_arrhenius  |
|   iflo_regu   |   iceflow.physics.regu  |
|   iflo_thr_ice_thk   |   iceflow.physics.thr_ice_thk  |
|   iflo_min_sr   |   iceflow.physics.min_sr  |
|   iflo_max_sr   |   iceflow.physics.max_sr  |
|   iflo_force_negative_gravitational_energy   |   iceflow.physics.force_negative_gravitational_energy  |
|   iflo_cf_eswn   |   iceflow.physics.cf_eswn  |
|   iflo_cf_cond   |   iceflow.physics.cf_cond  |
|   iflo_Nz   |   iceflow.numerics.Nz  |
|   iflo_vert_spacing   |   iceflow.numerics.vert_spacing  |
|   iflo_solve_step_size   |   iceflow.solver.step_size  |
|   iflo_solve_nbitmax   |   iceflow.solver.nbitmax  |
|   iflo_solve_stop_if_no_decrease   |   iceflow.solver.stop_if_no_decrease  |
|   iflo_optimizer_solver   |   iceflow.solver.optimizer  |
|   iflo_optimizer_lbfgs   |   iceflow.solver.lbfgs  |
|   iflo_save_cost_solver   |   iceflow.solver.save_cost  |
|   iflo_fieldin   |   iceflow.emulator.fieldin  |
|   iflo_retrain_emulator_freq   |   iceflow.emulator.retrain_freq  |
|   iflo_retrain_emulator_lr   |   iceflow.emulator.lr  |
|   iflo_retrain_emulator_lr_init   |   iceflow.emulator.lr_init  |
|   iflo_retrain_warm_up_it   |   iceflow.emulator.warm_up_it  |
|   iflo_retrain_emulator_nbit_init   |   iceflow.emulator.nbit_init  |
|   iflo_retrain_emulator_nbit   |   iceflow.emulator.nbit  |
|   iflo_retrain_emulator_framesizemax   |   iceflow.emulator.framesizemax  |
|   iflo_pretrained_emulator   |   iceflow.emulator.pretrained  |
|   iflo_emulator   |   iceflow.emulator.name  |
|   iflo_save_model   |   iceflow.emulator.save_model  |
|   iflo_exclude_borders   |   iceflow.emulator.exclude_borders  |
|   iflo_optimizer_emulator   |   iceflow.emulator.optimizer  |
|   iflo_optimizer_emulator_clipnorm   |   iceflow.emulator.optimizer_clipnorm  |
|   iflo_optimizer_emulator_epsilon   |   iceflow.emulator.optimizer_epsilon  |
|   iflo_save_cost_emulator   |   iceflow.emulator.save_cost  |
|   iflo_output_directory   |   iceflow.emulator.output_directory  |
|   iflo_network   |   iceflow.emulator.network.architecture  |
|   iflo_multiple_window_size   |   iceflow.emulator.network.multiple_window_size  |
|   iflo_activation   |   iceflow.emulator.network.activation  |
|   iflo_nb_layers   |   iceflow.emulator.network.nb_layers  |
|   iflo_nb_blocks   |   iceflow.emulator.network.nb_blocks  |
|   iflo_nb_out_filter   |   iceflow.emulator.network.nb_out_filter  |
|   iflo_conv_ker_size   |   iceflow.emulator.network.conv_ker_size  |
|   iflo_dropout_rate   |   iceflow.emulator.network.dropout_rate  |
|   iflo_weight_initialization   |   iceflow.emulator.network.weight_initialization  |

## Parameter name change table for `optimize` (`data_assimilation`) module

| Formerly    | New name    |
|----------|------------|
|   opti_control   |   data_assimilation.control_list  |
|   opti_cost   |   data_assimilation.cost_list  |
|   opti_nbitmin   |   data_assimilation.optimization.nbitmin  |
|   opti_nbitmax   |   data_assimilation.optimization.nbitmax  |
|   opti_step_size   |   data_assimilation.optimization.step_size  |
|   opti_step_size_decay   |   data_assimilation.optimization.step_size_decay  |
|   opti_init_zero_thk   |   data_assimilation.optimization.init_zero_thk  |
|   opti_sole_mask   |   data_assimilation.optimization.sole_mask  |
|   opti_retrain_iceflow_model   |   data_assimilation.optimization.retrain_iceflow_model  |
|   opti_fix_opti_normalization_issue   |   data_assimilation.optimization.fix_opti_normalization_issue  |
|   opti_regu_param_thk   |   data_assimilation.regularization.thk  |
|   opti_regu_param_slidingco   |   data_assimilation.regularization.slidingco  |
|   opti_regu_param_arrhenius   |   data_assimilation.regularization.arrhenius  |
|   opti_regu_param_div   |   data_assimilation.regularization.divflux  |
|   opti_smooth_anisotropy_factor   |   data_assimilation.regularization.smooth_anisotropy_factor  |
|   opti_smooth_anisotropy_factor_sl   |   data_assimilation.regularization.smooth_anisotropy_factor_sl  |
|   opti_convexity_weight   |   data_assimilation.regularization.convexity_weight  |
|   opti_convexity_power   |   data_assimilation.regularization.convexity_power  |
|   opti_to_regularize   |   data_assimilation.regularization.to_regularize  |
|   opti_usurfobs_std   |   data_assimilation.fitting.usurfobs_std  |
|   opti_velsurfobs_std   |   data_assimilation.fitting.velsurfobs_std  |
|   opti_thkobs_std   |   data_assimilation.fitting.thkobs_std  |
|   opti_divfluxobs_std   |   data_assimilation.fitting.divfluxobs_std  |
|   opti_uniformize_thkobs   |   data_assimilation.fitting.uniformize_thkobs  |
|   opti_include_low_speed_term   |   data_assimilation.fitting.include_low_speed_term  |
|   opti_velsurfobs_thr   |   data_assimilation.fitting.velsurfobs_thr  |
|   opti_log_slidingco   |   data_assimilation.fitting.log_slidingco  |
|   opti_divflux_method   |   data_assimilation.divflux.method  |
|   opti_force_zero_sum_divflux   |   data_assimilation.divflux.force_zero_sum  |
|   opti_scaling_thk   |   data_assimilation.scaling.thk  |
|   opti_scaling_usurf   |   data_assimilation.scaling.usurf  |
|   opti_scaling_slidingco   |   data_assimilation.scaling.slidingco  |
|   opti_scaling_arrhenius   |   data_assimilation.scaling.arrhenius  |
|   opti_output_freq   |   data_assimilation.output.freq  |
|   opti_plot2d_live   |   data_assimilation.output.plot2d_live  |
|   opti_plot2d   |   data_assimilation.output.plot2d  |
|   opti_save_result_in_ncdf   |   data_assimilation.output.save_result_in_ncdf  |
|   opti_save_iterat_in_ncdf   |   data_assimilation.output.save_iterat_in_ncdf  |
|   opti_editor_plot2d   |   data_assimilation.output.editor_plot2d  |
|   opti_vars_to_save   |   data_assimilation.output.vars_to_save  |
|   opti_infer_params   |   data_assimilation.cook.infer_params  |
|   opti_tidewater_glacier   |   data_assimilation.cook.tidewater_glacier  |
|   opti_vol_std   |   data_assimilation.cook.vol_std  |