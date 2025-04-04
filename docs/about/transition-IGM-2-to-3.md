
# Guideline for transitioning IGM v2 to v3

## Parameter handling

### `hydra` library replaces `parser`

Parameters handed with library `parser` are now handled with library `hydra`. Parameter file formerly JSON file `param.json` is now changed into YAML file `experiment/params.yaml` following `yaml` standard. Delegating the handling of parameters to `hydra` has permitted major simplification of the core IGM code. Running IGM now consists of running

```
 igm_run +experiment=params 
```
where parameters can be changed within the params, or can be overidden like :
```
 igm_run +experiment=params core.hardware.gpu_info=False core.print_params=False
```

### Hierachical parameters

Another consequence is that the parameters are now hierarchically organized in 2 ways:
  - The structure of folder where default parameter are stored in folder `igm/igm/conf`, which is separated from the code in folder `igm/igm`:
  ```
core.yaml
├── inputs 
│   └── local.yaml
│   └── ....
├── processes 
│   └── iceflow.yaml
│   └── ....
└── outputs
│   └── plot2d.yaml
│   └── ....
```
  - In the code, all parameters are accessible through the object `cfg`, e.g `cfg.processes.enthalpy.ref_temp` is a parameter associated with the `enthalpy` processes module.

### Parameters naming change

Paarameter name have been slightly changed: Before all parameters had a first keyword like `iflo` to indicate it was a parameter associated with `iceflow` module. Now, all parameters are sorted anyway attributes, therefore, the keyword was no longer used, and was removed. 

As an example `time_start` is now accessible with `processes.time.start`, ...

In the `iceflow` module, parameters were re-oragnized significantly (especially to make them hierarchically organized), however, we provide with a folder/script/table of correspondance to modify former json file into new yaml one.

### Example of new parameter file

Here is what look like the new parameter file : 
 
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
    iceflow:
      init_slidingco: 0.0595
  time:
    start: 1880.0
    end: 2020.0
    save: 5.0 

outputs:
  plot2d:
    live: true
```

The above file will be read by hydra in IGM, and has the following strucuture:

- `core` includes all parameters that are specific to core IGM run, e.g. logging, if we want to download data priori to run, GPU related, ...
- `defaults` will list the inputs, processes, and outputs modules.
- `inputs` give the parameters tot override the defaults for input modules.
- `processes` give the parameters tot override the defaults for processes modules.
- `outputs` give the parameters tot override the defaults for output modules.

# New structure of working folder

The working folder as follows with one 
  - folder `experiment` containing the parameter files,
  - folder `data` for input data if any, 
  - folder `user` containing user/custom python functions/modules, 
  - folder `output` or `multirun` containing the results of the IGM runs.

This will look like : 
```
├── experiment 
│   └── params.yaml
├── data
│   ├── ...
└── user
│   ├── code
│   │   └── processes
│   │       └── mymodule.py
│   └── conf
│   │   └── processes
│   │       └── mymodule.yaml
└── output
│   ├── 2025-03-06
│   │   └── 15-43-37
│   │   └── 15-44-07
│   │       └── output.nc
│   │       └── ......
```

# Re-naming of modules:

Former `preprocess`, `process`, and `postprocess` module types were renamed `input`, `modules`, `output`. `input` only have a `run` method, while `output` has `initialize` and `update` like modules.

# Integration and exclusion of former modules

- Former modules `anim_mayavi`, `anim_plotly`, `anim_video` were externalized from igm, and put in `utils`. These one were purely postprocessing, and were run at the very end. For simplicity, there were externalized.

- Modules like `print_comp`, or `print_info`w ere integrated to the core


# (Re-)splitting of `iceflow` modules into `optimize` (now called `data_assimilation`) and `pretraining`

As module `iceflow` become too big, it was decided to separate `optimize` and `pretraining` into dedicated modules. Formerly, it was separate, but the main issue is the dependance of  `optimize` and `pretraining` that was causing isues. With the new structure,  `optimize` and `pretraining` remain dependent of `iceflow`, but this is no longer an issue. However, if you call `optimize` and `pretraining`, you need to make sure that `iceflow`is caused as well (the order does not matter).

# `oggm_shop` needs to be coupled with `load_ncdf` or `local`

Module `oggm_shop` exclusively takes care of calling oggm to download the data (RGIXXXX folder), and changing this to a netcdf file `input.nc` that follows IGM's naming convention, and then can be read by IGM's  `load_ncdf` or `local` modules, which is NO LONGER DONE by `oggm_shop`. Therefore, if you call  `oggm_shop` , you need to call `load_ncdf` or `local` modules righ after (you can have multiple `inputs` modules).

# Transition from IGM 2.X.X to IGM 3.0.0

From a pure user point of view, migrating to IGM 3, is mainly changing former parameter file `params.json` into `experiment/params.yaml`. To help with this, we have made utility is `json_to_yaml.py`.

# Running multiple runs

A great advantage of hydra is the posibility it gives to for running ensemble runs, e.g. the foolowing line permits to run sequentially two runs with the 2 sets of parameters:
```
igm_run -m +experiment=params processes.time.end=2080,2110
```
or if one supply two parameter files (params1, params2):
```
igm_run -m +experiment=params1,params2
```
or doing a grid search ovr 3x2 parameters
```
igm_run -m +experiment=params processes.time.start=1900,1910,1920 processes.time.end=2080,2110
```
Note that in that case, the output folder will be named `multirun` instead of `output`.

# Custom modules (now called "user")

User modules are very useful as soon as we need to customize applications, they can be used to customize inputs, processes or outputs methods. To create such a user module, you need to create (or complete) the folder `user` located at the root of your working directory as follows (respect the hierarchy):
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

and access to the parameter
```python
def initialize(cfg,state):
  ... 

def update(cfg,state):
  cfg.processes.clim_aletsch.time_resolution
  ... 
 
def finalize(cfg,state):
  pass
```
while `my_inputs_module.py` and `my_outputs_module.py` has the following structure (and require to define function `run`) and access to the parameter

```python
def run(cfg, state):
  ...
```
On the other end, parameter files located in `conf/inputs`, `conf/processes`, and `conf/outputs` look like 
```yaml
update_freq: 1
time_resolution: 365
```
or in case there is no parameter (the file must exist as follows even if no parameter are defined):
```yaml
null
```
It must be stressed that the user modules override the official one, therefore, if you call a module that has the same name of an official one, the user one will be retained, and the official one will be ignored.

# MISC

- write_particles is now part of the particule module
- oggm_shop is now only tking care of downloading the data, and putting the data ready for IGM, therfore, oggm_shop must be followed by `load_ncdf`, or `local`
- A new I/O module `local` as introduced to replace `load_XXX` and `write_XXX`: `local` uses library `xarray` that is more powerfull and can load both `netcdf` and `tif`.

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
|   opti_nbitmin   |   data_assimilation.nbitmin  |
|   opti_nbitmax   |   data_assimilation.nbitmax  |
|   opti_step_size   |   data_assimilation.step_size  |
|   opti_step_size_decay   |   data_assimilation.step_size_decay  |
|   opti_init_zero_thk   |   data_assimilation.init_zero_thk  |
|   opti_uniformize_thkobs   |   data_assimilation.uniformize_thkobs  |
|   opti_sole_mask   |   data_assimilation.sole_mask  |
|   opti_retrain_iceflow_model   |   data_assimilation.retrain_iceflow_model  |
|   opti_include_low_speed_term   |   data_assimilation.include_low_speed_term  |
|   opti_fix_opti_normalization_issue   |   data_assimilation.fix_opti_normalization_issue  |
|   opti_velsurfobs_thr   |   data_assimilation.velsurfobs_thr  |
|   opti_log_slidingco   |   data_assimilation.log_slidingco  |
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