
# Guideline for transitioning IGM v2 to v3

## Parameter handling

### `hydra` library replaces `parser`

Parameters handed with library `parser` are nor handled with library `hydra`. Parameter file formerly JSON file `param.json` is now changed into YAML file `experiment/params.yaml` following `yaml` standard. Delegating the handling of parameters to `hydra` has permitted major simplification of the core IGM code. Running IGM now consists of running

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

- Modules like `print_comp`, or `print_info`were integrated to the core

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