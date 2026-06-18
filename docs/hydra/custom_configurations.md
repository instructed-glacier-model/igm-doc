# Configuring Custom Modules

In some of the IGM examples, you may notice that the default modules IGM provides are not enough. In this case, one can create a custom module and add it to the configuration structure. For instance, lets now explore the [aletsch 1880-2100 example](https://github.com/instructed-glacier-model/igm-examples/tree/main/aletsch-1880-2100).

In the `experiment` file, you will now notice a slightly different structure. Everything stays the same except now we have our custom modules specified in the `defaults` section.

```yaml hl_lines="8-11"
# @package _global_

core:
	...

defaults:

  - /user/conf/processes@processes:
      - smb_accmelt
      - clim_aletsch
      - track_usurf_obs

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

This will import our custom modules configuration files (not the code) so that it will now be part of the final configuration structure. Lets now break down what the following block means

```yaml
- /user/conf/processes@processes:
    - smb_accmelt
    - clim_aletsch
    - track_usurf_obs
```

In essence, this block means the following

```yaml
- [FILE LOCATION]@[POSITION IN STRUCTURE]:
    - [NAME OF FILE]
    - ...
```

The `[POSITION IN STRUCTURE]` is `processes` — the parent group — **not** `processes.smb_accmelt`. The module-name level (`smb_accmelt`) is supplied by the configuration *file itself* (see [the template](#the-user-conf-template) below), exactly like the built-in modules. This keeps user configuration files identical in shape to the official ones, so a module can be promoted from user to built-in by *moving the file*, with no rewrite.

For example, from the [User Modules](../modules/user_modules.md) page, we know that every custom module should follow this structure


```bash
.
└── user
  ├── code
  │   └── inputs
  │   │   └── my_module.py
  │   └── processes
  │   │   └── my_module.py
  │   └── outputs
  │       └── my_module.py
  └── conf
    └── inputs
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

If we were to ask for a file that does not exist, e.g.

```yaml
- /user/conf/processes@processes: smb_accmelt_other_name 
```

Hydra would not be able to find the file and will say

```bash
In 'experiment/params': Could not find 'user/conf/processes/smb_accmelt_other_name'

Available options in 'user/conf/processes':
	clim_aletsch
	smb_accmelt
	track_usurf_obs

```
## The user conf template

A user configuration file **must follow the same template as the built-in modules**: all of the module's parameters are nested under a single top-level key named after the module. Compare a built-in file with a user one — they are now identical in shape:

```yaml title="igm/conf/processes/smb_simple.yaml (built-in)"
smb_simple:
  update_freq: 1.0
  file: param.txt
  array: []
```

```yaml title="user/conf/processes/smb_accmelt.yaml (user)"
smb_accmelt:
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

Because the module-name level lives **inside** the file, the `defaults` entry that imports it targets the *parent* group with `@processes` (not `@processes.smb_accmelt`):

```yaml title="params.yaml"
- /user/conf/processes@processes: smb_accmelt
```

This resolves to `processes.smb_accmelt.update_freq`, etc. — exactly where the module code reads it (`cfg.processes.smb_accmelt.update_freq`).

!!! tip "Why this template?"
    Keeping user files identical to built-in ones means a module can move between tiers (your project → shared/community → official) by simply **moving the file** — no YAML rewrite. It also makes the `@`-package directive trivial: always `@processes`, `@inputs`, or `@outputs`, never a per-module package.

### Importing several modules from the same group

A `defaults` list cannot contain the same `group@package` key twice, so you **cannot** repeat `- /user/conf/processes@processes: ...` on separate lines (Hydra raises *"Multiple values for user/conf/processes@processes"*). Instead, pass them as a **list** under a single entry:

```yaml title="params.yaml"
- /user/conf/processes@processes:
    - smb_accmelt
    - clim_aletsch
    - track_usurf_obs
```

For a single module, either the list form or the one-line form (`- /user/conf/processes@processes: smb_accmelt`) works. Modules in *different* groups each get their own line, e.g. one `@inputs` entry and one `@processes` entry.

### Param-less modules

If a module exposes no parameters, still wrap it with its name and an empty mapping, so the key exists in the final configuration:

```yaml title="user/conf/processes/track_usurf_obs.yaml"
track_usurf_obs: {}
```

In general, Hydra allows the user to have a modular and complex configuration of files that ultimately get combined into a final configuration structure. This structure is then read by IGM to initialize the simluation run. Apart from the obvious benefits from managing complex structures, Hydra also allows for easy reproducability as the configurations are tracked every single run as well as distributed computing as it can launch ensemble runs and integrate into slurm and other computing platforms (Ray). To learn more, please continue onto the next sections.