# Module `pretraining` 

This module performs a pretraining of the ice flow iflo_emulator on a glacier catalogue to improve the performance of the emaulator when used in glacier forward run. The pretraining can be relatively computationally demanding task (a couple of hours). This module should be called alone independently of any other igm module. Here is an example of parameter file:

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

To run it, one first needs to have available a glacier catalogue. I provide here [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.8332898.svg)](https://doi.org/10.5281/zenodo.8332898) a dataset of a glacier catalogue (mountain glaciers) I have mostly used for pretraining IGM emaulators.

Once downloaded (or self generated), the folder "surflib3d_shape_100" can be re-organized into a subfolder "train" and a subfolder "test"  as follows:
 
## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/pretraining.yaml" %}
~~~

## Arguments
{% set config = load_yaml('igm/igm/conf/processes/pretraining.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/pretraining.yaml') %}
{% set header = load_yaml('igm/igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

<table>
  <thead>
    <tr>
      <th>Name</th>
      {% for key in header %}
      <th>{{ key }}</th>
      {% endfor %}
      <th>Default Value</th>
    </tr>
  </thead>
  <tbody>
    {% for key, value in module.items() %}
    <tr>
      <td>{{ key }}</td>
      <td>{{ module_help[key].Type}}</td>
      <!-- <td>{{ module_help[key].Units}}</td> -->
      <td><span class="math">{{ module_help[key].Units }}</span></td>
      <td>{{ module_help[key].Description}}</td>

      <td>{{ value }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>

<script type="text/javascript">
  MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
</script>

## Example Usage
