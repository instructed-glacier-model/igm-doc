## Application Help

As explained above, we can use `igm_run +experiment=params --help` to get the final configuration structure that Hydra reads. However, it can also offer insight into the configurations one can potentially use with IGM. For instance, running the above command will yield a message that looks like so (for the aletsch 1880-2100 example):


```bash
== Configuration groups ==
Compose your configuration from those groups (group=option)

inputs: load_ncdf, load_tif, local, oggm_shop
outputs: local, plot2d, write_ncdf, write_tif, write_ts
processes: avalanche, clim_glacialindex, clim_oggm, enthalpy, gflex, glerosion, iceflow, particles, read_output, rockflow, smb_accpdd, smb_oggm, smb_simple, texture, thk, time, vert_flow


== Config ==
Override anything in the config (foo.bar=value)

...
```

At the moment, the above modules listed are only the built in modules from IGM and do *not* include any custom modules. However, this may change in a future release if it is found out to be possible.

We can also use the help specific to Hydra in case we are unsure how to use it with `igm_run +experiment=params --hydra-help` which may produce something like so

```bash
== Flags ==
--help,-h : Application's help
--hydra-help : Hydra's help
--version : Show Hydra's version and exit
--cfg,-c : Show config instead of running [job|hydra|all]
--resolve : Used in conjunction with --cfg, resolve config interpolations before printing.
--package,-p : Config package to show
--run,-r : Run a job
--multirun,-m : Run multiple jobs with the configured launcher and sweeper
--shell-completion,-sc : Install or Uninstall shell completion:
    Bash - Install:
    eval "$(igm_run -sc install=bash)"
    Bash - Uninstall:
    eval "$(igm_run -sc uninstall=bash)"

    Fish - Install:
    igm_run -sc install=fish | source
    Fish - Uninstall:
    igm_run -sc uninstall=fish | source

    Zsh - Install:
    Zsh is compatible with the Bash shell completion, see the [documentation](https://hydra.cc/docs/1.2/tutorials/basic/running_your_app/tab_completion#zsh-instructions) for details.
    eval "$(igm_run -sc install=bash)"
    Zsh - Uninstall:
    eval "$(igm_run -sc uninstall=bash)"

--config-path,-cp : Overrides the config_path specified in hydra.main().
                    The config_path is absolute or relative to the Python file declaring @hydra.main()
--config-name,-cn : Overrides the config_name specified in hydra.main()
--config-dir,-cd : Adds an additional config dir to the config search path
--experimental-rerun : Rerun a job from a previous config pickle
--info,-i : Print Hydra information [all|config|defaults|defaults-tree|plugins|searchpath]
Overrides : Any key=value arguments to override config values (use dots for.nested=overrides)

== Configuration groups ==
Compose your configuration from those groups (For example, append hydra/job_logging=disabled to command line)

hydra: config
hydra/env: default
hydra/help: default
hydra/hydra_help: default
hydra/hydra_logging: default, disabled, hydra_debug, none
hydra/job_logging: default, disabled, none, stdout
hydra/launcher: basic, joblib
hydra/output: default
hydra/sweeper: basic
```

Of course, we could go more in depth, but for the moment, this information should suffice. For eager people, I suggest you learn more on the Hydra website.