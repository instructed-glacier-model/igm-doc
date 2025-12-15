# Module `pretraining` 
This module performs pretraining of the ice flow `iflo_emulator` on a glacier catalog to enhance its performance during glacier forward runs. Pretraining can be a computationally intensive task, taking a few hours to complete. This module should be executed independently, without involving any other IGM modules. Below is an example of a parameter file:

```yaml
# @package _global_
 
defaults:
  - override /inputs: []
  - override /processes: [pretraining, iceflow]
  - override /outputs: []
 
processes:
  iceflow: 
    Nz : 10
    dim_arrhenius : 2
    multiple_window_size : 8
    nb_layers : 16
    nb_out_filter : 32
    network : cnn
    new_friction_param : True
    retrain_emulator_lr : 0.0001
    solve_nbitmax : 1000
    solve_stop_if_no_decrease : False
  pretraining:
    epochs : 1000
    data_dir: data/surflib3d_shape_100
    soft_begining: 1000
    min_slidingco: 0.01
    max_slidingco: 0.4
    min_arrhenius: 5
    max_arrhenius: 400
 
```

To run this module, you first need access to a glacier catalog. A dataset of a glacier catalog (mountain glaciers) commonly used for pretraining IGM emulators is available here: [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.8332898.svg)](https://doi.org/10.5281/zenodo.8332898).

After downloading (or generating your own dataset), organize the folder `surflib3d_shape_100` into two subfolders: `train` and `test`.
 
## Parameters

Default configuration file ([pretraining.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/pretraining.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/pretraining.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/pretraining.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/pretraining.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}
