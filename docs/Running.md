# How to Run IGM

Once IGM is installed, one can launch an experiment by using the following command:

```
igm_run +experiment=params
```

Importantly, before doing so you must

1. Make sure the virtual environment where IGM is installed is activated.
2. Verify that you are running this command in a folder where the `experiment` can be found.
3. (Optional) If using custom modules, place them in the correct place.

Assuming that you want to launch the `params` experiment, you can run the above command in the same level where the `experiment` folder belongs.

```
├ [RUN COMMAND HERE]
├── experiment  # contains the parameter file
│   └── params.yaml
```

### Using custom modules
Optionally, if you have decided to include custom modules, you should also put these folders in the same level as the `experiment` folder (shown below). For more information on how to use custom modules in IGM, please visit [here](modules/user_modules.md).

```
├ [RUN COMMAND HERE]
├── experiment  # contains the parameter file
│   └── params.yaml
└── user        # contains user-modules if any
│   └── conf
│   │   └── ...
│   └── code
│       └── ...

```

<!-- ├── data        # contains the input data
│   └── ...
└── user        # contains user-modules if any
│   └── ...
└── outputs      # folder created by hydra/IGM to store model outputs
│   └── .... -->

<!-- 
where the parameter file `params.yaml` (example below) consists of:  
i) specifying a list of **modules** for inputs, processes, and outputs, and  
ii) defining a list of **parameters** that override the default values.

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

Visit the `Module` section of this documentation to find out what modules are available, together with their parameters. -->