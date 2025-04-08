# Configuring IGM

In order to use Hydra with IGM, one needs to understand how the general structure works. Each IGM run requires an experiment that outlines all modules, constants, and instructions. Before IGM starts running its code, Hydra will then combine all the parameters specified in the experiment file, and command line, into a single structure. We will explore in the following sections how to adjust these parameters using Hydra's workflow.

## Configuring IGM through the Experiment File

For the first example, lets assume that we want to specify all our parameters in the `experiment` file. To demonstrate this, lets run the aletsch-basic [example](https://github.com/instructed-glacier-model/igm-examples/tree/main/aletsch-basic) with the following command

```bash
igm_run +experiment=params
```

This command might produce a configuration structure like so

```yaml
core:
	...
processes:
  smb_simple:
	...
  iceflow:
	...
  time:
	...
  thk:
	...
  vert_flow:
	...
  particles:
	...
inputs:
  local:
	...
outputs:
  local:
	...
  plot2d:
	...
```

This shows all the input, process, and output modules along with all their parameters. This structure comes directly from the `params` file that has the following structure

```yaml

core:
	...

defaults:
  - override /inputs: 
    - local
  - override /processes: 
    - smb_simple
    - iceflow
    - time
    - thk
    - vert_flow
    - particles
  - override /outputs: 
    - local
    - plot2d

processes:
  smb_simple:
	...
  time:
	...

inputs:
  local:
	...

outputs:
	...
```

Now, lets break down this structure. At the outermost indentation level (that is the level that `core`, `processes`, `inputs`, and `outputs` lie on), we say we are at the `global` level. This structure was dictated by IGM's structure, and thus, every experiment file must follow the same structure if one wants to access and override parameters correctly.

### Using IGM's Default Modules

If we would just want to use IGM's default modules and default parameters (which would rarely be the case), we could simply specify all modules in the `defaults` list inside our `params` file.

!!! warning "Align with the Global Level"
	Do not forget to include `@package _global_` inside your params file, or else IGM will structure it incorrectly. If you do forget it, it will not overwrite the default parameters and will just create a separate section with the parameters you specified. It will also not necessarily throw an error, so please verify that your parameters are correctly overwriting the default ones.

```yaml
@package _global_

defaults:
  - override /inputs: 
    - local
  - override /processes: 
    - smb_simple
    - iceflow
    - time
    - thk
    - vert_flow
    - particles
  - override /outputs: 
    - local
    - plot2d
```
However, most of the time we would like to adjust the default parameters. In order to do this, we can specify the parameters in an additional section in the same level as `defaults`. For instance, if we wanted to change the default time frame our simulation runs, we could make the following adjustment

```yaml hl_lines="6 9 17-21"
@package _global_

defaults:
  - override /inputs: 
    - local
  - override /processes: 
    - smb_simple
    - iceflow
    - time
    - thk
    - vert_flow
    - particles
  - override /outputs: 
    - local
    - plot2d

processes:
  time:
    start: 1900.0
    end: 2000.0
    save: 10.0

```

In order to check to see if our parameters have successfully overwritten the default ones, we can see the final configuration structure with the following command

```bash
igm_run +experiment=params --help
```

or alternatively,

```bash
igm_run +experiment=params --cfg job
```

If you notice any *interpolated* values, that is values in the configuration that are variables (like `cwd: ${get_cwd:0}`), you can resolve these and get the value by using

```bash
igm_run +experiment=params --cfg job --resolve
```

Note that this is the final configuration structure for the `params` experiment. If you want to show the configuration IGM has by default or for another experiment, please change it accordingly. 

## Configuring IGM through the Command Line

Simularly, if one wants to keep the `params` file the same but specify changes to specifc parameters, we can simply modify them within the command line. For instance, lets say we want to use the `params` file but just change the start date. We can do so by running

```bash
igm_run +experiment=params processes.time.start=1990
```

which will result in

```yaml hl_lines="19"
@package _global_

defaults:
  - override /inputs: 
    - local
  - override /processes: 
    - smb_simple
    - iceflow
    - time
    - thk
    - vert_flow
    - particles
  - override /outputs: 
    - local
    - plot2d

processes:
  time:
    start: 1990.0
    end: 2000.0
    save: 10.0

```

We can do this for multiple parameters at the same time. For instance, the start and the end date:
```bash
igm_run +experiment=params processes.time.start=1990 process.time.end=2050
```