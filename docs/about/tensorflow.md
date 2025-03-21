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