It is fairly simple to write your own module in a separate python file and include it in the workflow, e.g. to force a climate and/or surface mass balance model specific to an application. For that, one needs to undestand how IGM is coded.

# Coding structure

A closer look at script [igm_run.py](https://github.com/jouvetg/igm/tree/main/igm/igm_run.py) reveals the following main steps:

- Load key libraries (tensorflow and igm):
- Collect defaults, overide from json file, and parse all **core** and **specific module** parameters into _params_, load custom modules, and get the list of all modules in order:
- Define a _state_ class/dictionnary that contains all the data (e.g. ice thickness)
- Initialize, update and finalize all model components in given order after placing on '/CPU:0' or '/GPU:0' device.

Each module have at least 4 functions defined (some may do nothing, but still need to be defined): 

- a **parameter** function 'params(parser)' that defines the parameter associated with the module, 
- an **initialization** function 'initialize(params,state)' that initializes all that needs to be prior to the main time loop, 
- an **update** function 'update(parser)' that updates the state within the main time loop, 
- a **finalize** function 'finalize(parser)' that finalizes the module after the time loop.

In `igm_run`, all variables describing the glacier state at a time t are stored in the `state` object. All these variable are [TensorFlow 2.0](https://www.tensorflow.org/) Tensors. Using Tensorflow is key to making computationally efficient operations, especially on GPU. Any variables can be accessed/modified via state.nameofthevariable, e.g.,
 ```python
state.thk   # is the ice thickness variable
state.usurf # is the top surface elevation
```
Variables names are summarized [here](https://github.com/jouvetg/igm/wiki/5.-Variables).

# Creating own module

Similarly to existing IGM ones, a user-defined module my_module can be implemented in a file my_module.py, which will be will automatically loaded when `igm_run` is executed providing `my_module` is listed in any module list parameters. The implementation must have the 4 functions that permits to defined parameters, initializing, updating, and finalizing. For instance, to implementation of the mass balance function 'sinus' with an oscillating ELA, you may create a module 'mysmb' in a file mysmb.py, which update the object state.smb from other fields and parameters:

```python 

def params(parser):  
    parser.add_argument("--meanela", type=float, default=3000 )

def initialize(params,state):
    pass

def update(params,state):
    # perturabe the ELA with sinusional signal 
    ELA = ( params.meanela + 750*math.sin((state.t/100)*math.pi) )
    # compute smb linear with elevation with 2 acc & abl gradients
    state.smb  = state.usurf - ELA
    state.smb *= tf.where(state.smb<0, 0.005, 0.009)
    # cap smb by 2 m/y 
    state.smb  = tf.clip_by_value(state.smb, -100, 2)
    # make sure the smb is not positive outside of the mask to prevent overflow
    state.smb  = tf.where((state.smb<0)|(state.icemask>0.5),state.smb,-10)

def finalize(params,state):
    pass
```
then, it remains to call these new function and add 'mysmb' to the list of modules as parameter.

Note that the four functions (params, init, update, finalize) must be defined even if some are not doing anything (just use `pass`). You may find coding inspiration / examples looking at the code of IGM modules above.

IGM fully relies on [TensorFlow 2.0](https://www.tensorflow.org/) library for computational efficiency on GPU. All variables (e.g. ice thickness) are TensorFlow tensor objects, which can only be modified using TensorFlow operations. All these **operations are vectorial**, i.e. they apply simultaneously to all entries of 2D gridded fields, which is key for parallel and efficient execution. This means that one must avoid any sequential operations (typically loop of indices of 2D arrays), and favour TensorFlow (optimized) operations between large arrays (e.g. neural networks). 

At first sight, a lot of TensorFlow functions look similar to Numpy ones, one can simply do operations by changing numpy to tensorflow, e.g. 'tf.zeros()' instead of 'np.zeros()' with 'import tensorflow as tf' instead of 'import numpy as np'. E.g. Tensorflow operations look like:
```python
state.topg  = tf.zeros_like(state.usurf)                                  # define Variable Tensor
state.smb   = tf.where(state.usurf > 4000, 0, state.smb)                   # Imposes zero mass balance above 4000 m asl.
state.usurf = state.topg + state.thk                                       # Update surface topography with new ice thickness
state.smb   = tf.clip_by_value( (state.usurf - ela)*grad , -100, 2.0 )     # Define linear smb wrt z, with capping value
u = tf.concat( [u[:, 0:1], 0.5 * (u[:, :-1] + u[:, 1:]), u[:, -1:]], 1 )   # work on straggered grid
```
In fact, there are two kinds of tensor that are used in IGM. First, "EagerTensor" (as shown above) can make many operations, however, we can NOT change specific tensor entries (slicing):
```python
tensor = tf.ones((500,300))  
tensor = (2*tensor + 200)**2
tensor[1,2] = 5 # WILL NOT WORK
```
As a workaround, one uses "tf.Variable" that permits to slice, however, the assignment is slightly different, it can not be done with "=", but with the "assign" function:
```python
tensor = tf.Variable(tf.ones((500,300)))
tensor.assign( (2*tensor + 200)**2 )
tensor[1,2].assign( 5 ) # WORKS !
```
IGM combines both types of tensors, so make sure to identify what is your type, other TF will produce an error.


For the best computational efficiency, it is crucial to keep all variables and operations within the TensorFlow framework without using Numpy (to avoid unnecessary transfers between GPU and CPU memory). There is the possibility to generate TensorFlow function using Numpy code, check at this [page](https://www.tensorflow.org/guide/tf_numpy).

The best way to learn how to code with tensorflow within the context of IGM is to explore [module codes](https://github.com/jouvetg/igm/tree/main/igm/modules), or to look at [examples](https://github.com/jouvetg/igm/tree/main/examples).

# Overriding modules

Sometime, it may happen that you would like to bring a minor modification to an existing module. If so, no need to copy/paste the entire module and bring your modification, you may simply define a module with the same name existingmodule.py that contains only the function you would like to modify. All other function will be taken from the orginal module. For instance, this [IGM example](https://github.com/jouvetg/igm/tree/main/examples/aletsch-1880-2100) implements a special seeding strategy for the particle module in user-defined particles.py. Only two functions of the module are changed.

# Sharing your module

If you have developed a module that you believe may be useful to the community and be shared within igm package, read this section carefully. First, give a meaningful name to your module, and try to match the structure of other existing modules for consistency. Please name modulename.py and modulename.md the python and the documentation files, respectively. The parameter list coming at the end of modulename.md in the doc folder will be generated automatically, so you don't need to do it yourself. Please make sure to name all parameters of your module with a 4 letter long keyword that shorten the name of your module. This permits to prevent against conflicts between parameter names of different modules. Once all of this is achieve, you may contact me, or do a pull request.







 
