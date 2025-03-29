# Running IGM

[SHOULD THAT INTRO BE WITH NEXT `hydra`-specific folder?]

Once IGM is installed, running IGM is done by running in a terminal:

```
igm_run +experiment=params
```

in a folder that contains the following sub-folders:

```
├── experiment  # contains the parameter file
│   └── params.yaml
├── data        # contains the input data
│   └── ...
└── user        # contains user-modules if any
│   └── ...
└── output      # folder created by hydra/IGM to store model outputs
│   └── ....
```

where parameter file `params.yaml` consists of i) calling a list of ìnputs, processes, and outputs **modules** ii) a list of **parameters** that differ from the default one:

```yaml
# @package _global_

core:  # core IGM parameter (looging, GPU, ...)
  hardware: 
    gpu_info: False

defaults: # declare the list of modules to be used
  - override /input: [load_ncdf]
  - override /modules: [smb_simple, iceflow, time, thk]
  - override /output: [write_ncdf, plot2d]

inputs:  # override parameters of input modules
  load_ncdf:
    input_file: data/input.nc

processes: # override parameters of processes modules
  time:
    start: 1880.0
    end: 2020.0
    save: 5.0 

outputs: # override parameters of output modules
  plot2d:
    live: true
```