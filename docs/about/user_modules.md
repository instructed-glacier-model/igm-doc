# User modules

It is fairly simple to write your own module in a separate python file and include it in the workflow, e.g. to force a climate and/or surface mass balance model specific to an application. For that, one needs to undestand how IGM is coded.

# Coding structure

A closer look at main script `igm_run.py` shows the following main structure:
 
- `run` all *inputs* modules
- `initialize` all *processes* modules
- `initialize` all *outputs* modules
- for all time steps:
     - `update` all *processes* modules
     - `run` all *outputs* modules
- `finalize` all *processes* modules

where `inputs` modules implement a `run` function, `processes` modules implement a `initialize`, `update`, `finalize` function, and `outputs` modules implement  `initialize` and `run` functions.

Similarly to existing IGM ones, a user-defined module `my_module` can be implemented and be automatically loaded when `igm_run` is executed providing `my_module` and the path to its parameter file being called as a module (see the example below). Building a user module consists of filling the following folder with the hierachical structure:

``` 
└── user
│   ├── code
│   │   └── input
│   │   │   └── myinput.py
│   │   └── processes
│   │   │   └── myprocess.py
│   │   └── outputs
│   │       └── myoutput.py
│   └── conf
│   │   └── input
│   │   │   └── myinput.yaml
│   │   └── processes
│   │   │   └── myprocess.yaml
│   │   └── outputs
│   │       └── myoutput.yaml
```

Hereabove, the code files are expected to define functions `run(cfg,state)`, `initialize(cfg,state)`, `update(cfg,state)`, and/or `finalize(cfg,state)`, where `cfg` permits to access any parameters (e.g `cfg.processes.enthalpy.ref_temp` is a parameter associated with the `enthalpy` processes module), while `state` permits to access any 
variables describing the glacier state at a time t (e.g `state.thk` is the variable describing the distributed 2D ice thickness). All these variable are [TensorFlow 2.0](https://www.tensorflow.org/) Tensors. Using Tensorflow is key to making computationally efficient operations, especially on GPU. Any variables can be accessed/modified via state.nameofthevariable. Variables names are summarized [here](XXX).

# Example

For instance, to implementation of the mass balance function 'sinus' with an oscillating ELA, you may create a module `mysmb` in a file `mysmb.py`:

```python
def initialize(cfg,state):
    pass

def update(cfg,state): 
    ELA = cfg.processes.mysmb.meanela + \
          750*math.sin((state.t/100)*math.pi) 
    state.smb  = state.usurf - ELA
    state.smb *= tf.where(state.smb<0, 0.005, 0.009)
    state.smb  = tf.clip_by_value(state.smb, -100, 2) 

def finalize(cfg,state):
    pass
```

and a parameter file `mysmb.yaml` containing the default value:

```python
mysmb:
  meanela: 3200
```

Then, in the parameter file `params.yaml`, it remains i) to list the user module so that the code will be found ii) to list the parameter file so that it will be added to the other parameters as follows:

```yaml
defaults:

  - /user/conf/processes@processes.mysmb: mysmb
  ...
  - override /processes:  
     - mysmb
     - iceflow
     - time
     - thk 
  ...
```

Note that the 3 functions (initialize, update, finalize) must be defined even if some are not doing anything (just use `pass`). You may find coding inspiration / examples looking at the code of IGM modules.

# Overriding modules

**[TO UPDATE]** Sometime, it may happen that you would like to bring a minor modification to an existing module. If so, no need to copy/paste the entire module and bring your modification, you may simply define a module with the same name existingmodule.py that contains only the function you would like to modify. All other function will be taken from the orginal module. For instance, the `aletsch-1880-2100` module implements a special seeding strategy for the particle module in user-defined particles.py.  

# Sharing your module

**[TO UPDATE]** If you have developed a module that you believe may be useful to the community and be shared within igm package, read this section carefully. First, give a meaningful name to your module, and match the structure of other existing modules. Name modulename.py, modulename.md, modulename.yaml the python, the documentation file, and the parameter file, respectively. Once all of this is achieved, you may contact IGM's developper team or initiate a pull request.







 
