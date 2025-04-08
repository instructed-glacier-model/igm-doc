# Configuring Custom Modules

In some of the IGM examples, you may notice that the default modules IGM provides are not enough. In this case, one can create a custom module and add it to the configuration structure. For instance, lets now explore the [aletsch 1880-2100 example](https://github.com/instructed-glacier-model/igm-examples/tree/main/aletsch-1880-2100).

In the `experiment` file, you will now notice a slightly different structure. Everything stays the same except now we have our custom modules specified in the `defaults` section.

```yaml hl_lines="8-10"
# @package _global_

core:
	...

defaults:

  - /user/conf/processes@processes.smb_accmelt: smb_accmelt 
  - /user/conf/processes@processes.clim_aletsch: clim_aletsch
  - /user/conf/processes@processes.track_usurf_obs: track_usurf_obs

  - override /inputs: 
     - local
  - override /processes: 
     - track_usurf_obs
     - clim_aletsch
     - smb_accmelt
     - iceflow
     - time
     - thk
     - rockflow
     - vert_flow
     - particles
  - override /outputs: 
     - local
     - plot2d

inputs:
	...
processes:
	...
outputs:
	...
```

This will import our custom modules configuration files (not the code) so that it will now be part of the final configuration structure. Lets now break down what the following line means

```yaml
- /user/conf/processes@processes.smb_accmelt: smb_accmelt 
```

In essence, this line means the following

```yaml
- [FILE LOCATION]@[POSITION IN STRUCTURE]: [NAME OF FILE]
```

For example, from the custom modules [page](../modules/user_modules.md), we know that every custom module should follow this structure


```bash
.
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

Here, our configuration for our custom process, `smb_accmelt` is located in `/user/conf/processes`.

```bash
.
└── user
  └── conf
    └── processes
       └── smb_accmelt.yaml
```

If we were to change this line into

```yaml
- /user/conf/processes@processes.smb_accmelt: smb_accmelt_other_name 
```

Hydra would not be able to find the file and will say

```bash
In 'experiment/params': Could not find 'user/conf/processes/smb_accmelt_other_name'

Available options in 'user/conf/processes':
	clim_aletsch
	smb_accmelt
	track_usurf_obs

```
Additionally, we can change the position in the configuration file using the `@` operator. In Hydra, these are called packages (read more [here](https://hydra.cc/docs/advanced/overriding_packages/)). Recall that in the `params` file, one must include the `# @package _global_` header. For custom configurations in the `/user/conf/` folder, there is a similar structure. For instance, in the `smb_accmelt`, by default it operates on the `_global_` level. This means that in the `experiment` file, when we specify `@processes.smb_accmelt` it assumes this is relative to the `_global_` level, which is what we want. The following two cases are equivalent:

## Case 1

In this case, we specify the position in the `params.yaml` and not in the `smb_accmelt.yaml` header. We do this with the `@processes.smb_accmelt` extension.

```yaml title="params.yaml"
- /user/conf/processes@processes.smb_accmelt: smb_accmelt
```

```yaml title="smb_accmelt.yaml"

update_freq: 1
weight_ablation: 1.25
weight_accumulation: 1.0
thr_temp_snow: 0.5
thr_temp_rain: 2.5
shift_hydro_year: 0.75
ice_density: 910.0
wat_density: 1000.0
weight_Aletschfirn: 1.0
weight_Jungfraufirn: 1.0
weight_Ewigschneefeld: 1.0
```

## Case 2

Alternatively, in the `smb_accmelt.yaml` we can change this level with the `@package` header instead of specifying it within the `params` file. For example, in the `smb_accmelt.yaml` file, we can add `@package processes.smb_accmelt` and then in our `params` file, we can simply just import the file without using the `@` operator:

```yaml title="params.yaml"
- /user/conf/processes: smb_accmelt
```

```yaml title="smb_accmelt.yaml"
# @package processes.smb_accmelt

update_freq: 1
weight_ablation: 1.25
weight_accumulation: 1.0
thr_temp_snow: 0.5
thr_temp_rain: 2.5
shift_hydro_year: 0.75
ice_density: 910.0
wat_density: 1000.0
weight_Aletschfirn: 1.0
weight_Jungfraufirn: 1.0
weight_Ewigschneefeld: 1.0
```

In general, Hydra allows the user to have a modular and complex configuration of files that ultimately get combined into a final configuration structure. This structure is then read by IGM to initialize the simluation run. Apart from the obvious benefits from managing complex structures, Hydra also allows for easy reproducability as the configurations are tracked every single run as well as distributed computing as it can launch ensemble runs and integrate into slurm and other computing platforms (Ray). To learn more, please continue onto the next sections.