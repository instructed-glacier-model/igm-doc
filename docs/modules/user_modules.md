# User modules

It is easy to create your own module in a separate Python file and integrate it into the workflow. For instance, you might want to implement a climate or surface mass balance model tailored to a specific application. To achieve this, it is crucial to understand the structure and operation of IGM. User modules follow the same structure as built-in ones, so you can use built-in modules as a reference or starting point when designing your own.

# Coding structure

A closer look at the main script `igm_run.py` reveals the following structure:

- `run` all *inputs* modules
- `initialize` all *processes* modules
- `initialize` all *outputs* modules

For all time steps:

  - `update` all *processes* modules
  - `run` all *outputs* modules
  - `finalize` all *processes* modules

Here, we find that

- `inputs` modules have a `run` function,
- `processes` modules have `initialize`, `update`, and `finalize` functions
- `outputs` modules have `initialize` and `run` functions.

Similarly to existing IGM modules, a user-defined module `my_module` can be implemented and automatically loaded when `igm_run` is executed, provided that `my_module` and the path to its parameter file are correctly specified. Building a user module involves creating the following folder structure (folder `user` lies alongside `experiment` and `data`):

``` 
└── user
  ├── code
  │   └── input
  │   │   └── my_module.py
  │   └── processes
  │   │   └── my_module.py
  │   └── outputs
  │       └── my_module.py
  └── conf
    └── input
    │   └── my_module.yaml
    └── processes
    │   └── my_module.yaml
    └── outputs
      └── my_module.yaml
```

Here, the code files are expected to define functions `run(cfg, state)`, `initialize(cfg, state)`, `update(cfg, state)`, and/or `finalize(cfg, state)`, where

- the `cfg` object allows access to parameters in a hierachical fashion (e.g., `cfg.processes.enthalpy.ref_temp` retrieves a parameter associated with the `enthalpy` processes module),

- the `state` object provides access to variables describing the glacier state at a given time `t` (e.g., `state.thk` represents the distributed 2D ice thickness). All these variables are [TensorFlow 2.0](https://www.tensorflow.org/) Tensors. Leveraging TensorFlow is essential for performing computationally efficient operations, particularly on GPUs (see the dedicated TensorFlow section below). Variables can be accessed or modified using `state.name_of_the_variable`. Check at the section below to know more how to code in Tensorflow.

# Example

To implement a mass balance function `sinus` with an oscillating ELA, you may create a module `mysmb` in a file `mysmb.py`:


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

Then, in the parameter file `params.yaml`, you need to:

1. List the user module so that the code will be found.
2. Include the parameter file so that its parameters are added to the existing ones.

Here is an example of how to modify `params.yaml`:

```yaml
 @package _global_

defaults:

  - /user/conf/processes@processes.mysmb: mysmb
  
  - override /processes:  
     - mysmb
     - iceflow
     - time
     - thk 
  ...
```
Note that the three functions (`initialize`, `update`, `finalize`) must be defined, even if some do not perform any operations (in such cases, simply use `pass`). For inspiration or examples, you can refer to the code of existing IGM modules.

# Overriding a module

Sometimes, you may need to modify an existing built-in module. This can be achieved by creating a user module that overrides the built-in functionality. To do this, define a module with the same name as the existing module (e.g., `existingmodule.py`) and implement the desired customizations. 

For example, the `aletsch-1880-2100` module implements a custom seeding strategy for the particle module. This is done by defining a user-specific `particles.py` file, which overrides the built-in functions. Here is an example:

```python
#!/usr/bin/env python3
import igm 

# Take over the official functions
update   = igm.processes.particles.particles.update
finalize = igm.processes.particles.particles.finalize

# Define a new initialize function using the official one
def initialize(cfg, state):
  igm.processes.particles.particles.initialize(cfg, state)
  [...] # Load the custom seeding map

# Customize the seeding_particles function
def seeding_particles(cfg, state):
  [...] # Implement the custom seeding logic

# Override the official seeding_particles function
igm.processes.particles.particles.seeding_particles = seeding_particles
```

By following this approach, you can **surgically** extend or modify the behavior of existing modules while preserving the original functionality. This ensures flexibility and adaptability for specific use cases without compromising the integrity of the built-in modules.

# Tensorflow

IGM relies on the [TensorFlow 2.0](https://www.tensorflow.org/) library to achieve computational efficiency, particularly on GPUs. All variables, such as ice thickness, are represented as TensorFlow tensor objects. These tensors can only be modified using TensorFlow operations, which are inherently **vectorized**. This vectorization allows operations to be applied simultaneously across all entries of 2D gridded fields, enabling parallel and efficient execution.

To maximize performance, avoid sequential operations, such as loops over indices of 2D arrays. Instead, leverage TensorFlow's optimized operations designed for large arrays, which are commonly used in machine learning and neural networks. By adhering to this approach, you can ensure that your computations remain efficient and fully utilize the capabilities of TensorFlow.

At first glance, many TensorFlow functions resemble those in NumPy. For example, you can perform operations by replacing NumPy with TensorFlow, such as using `tf.zeros()` instead of `np.zeros()`. Additionally, you would import TensorFlow as `import tensorflow as tf` instead of `import numpy as np`. Here is an example of TensorFlow operations:

```python
import tensorflow as tf

# Create a tensor filled with zeros
tensor = tf.zeros((500, 300))

# Perform operations on the tensor
tensor = (2 * tensor + 200) ** 2
```

While the syntax may appear similar, TensorFlow is specifically optimized for GPU acceleration and large-scale computations, making it more suitable for high-performance tasks compared to NumPy. This optimization allows TensorFlow to handle operations on large datasets efficiently, leveraging parallel processing capabilities of modern hardware.

```python
state.topg  = tf.zeros_like(state.usurf)                                  # define Variable Tensor
state.smb   = tf.where(state.usurf > 4000, 0, state.smb)                   # Imposes zero mass balance above 4000 m asl.
state.usurf = state.topg + state.thk                                       # Update surface topography with new ice thickness
state.smb   = tf.clip_by_value( (state.usurf - ela)*grad , -100, 2.0 )     # Define linear smb wrt z, with capping value
u = tf.concat( [u[:, 0:1], 0.5 * (u[:, :-1] + u[:, 1:]), u[:, -1:]], 1 )   # work on straggered grid
```

In fact, there are two kinds of tensors used in IGM. The first type is the "EagerTensor," which supports many operations but does not allow modification of specific tensor entries (slicing). For example:

```python
tensor = tf.ones((500,300))  
tensor = (2*tensor + 200)**2
tensor[1,2] = 5 # WILL NOT WORK
```

As a workaround, you can use "tf.Variable," which allows slicing. However, assignments must be performed using the `assign` function instead of the `=` operator:

```python
tensor = tf.Variable(tf.ones((500, 300)))
tensor.assign((2 * tensor + 200) ** 2)
tensor[1, 2].assign(5)  # WORKS!
```

IGM combines both types of tensors, so it is essential to identify the type of tensor you are working with. Otherwise, TensorFlow will produce an error.

For optimal computational efficiency, it is crucial to keep all variables and operations within the TensorFlow framework and avoid using NumPy. This prevents unnecessary data transfers between GPU and CPU memory. The best way to learn how to code with TensorFlow in the context of IGM is to explore the existing IGM module code.

# Sharing your module

If you have developed a module that you believe could benefit the community and be included in the IGM package, please reach out to the IGM development team. 





 
