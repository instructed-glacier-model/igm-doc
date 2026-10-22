## Working Directory

By default, IGM will use the current working directory wherever you use the `igm_run` command (and thus save all the results to this directory). While it could be possible to change the working directory to run IGM outside of where the `experiment` folder is located, we suggest you use IGM as intended as it could break some other modules. However, the output directories are organised so that the results of each run are stored separately and not overwritten: IGM's root configuration (`igm/conf/config.yaml`) sets

```yaml title="igm/conf/config.yaml (excerpt)"
hydra:
  job:
    chdir: True
```

so that every run changes into its own output directory. You do **not** need to add this to your `params.yaml`. Consequently, each IGM run generates a folder with the day as the parent folder and the time as a subfolder. For instance, after a few runs we could end up with the following structure

```bash
└───2025-04-07
    ├─── 12-06-29
    │     └─── .hydra
    │         ├─── config.yaml
    │         ├─── hydra.yaml
    │         └─── overrides.yaml
    └─── 12-07-38
          └─── .hydra
              ├─── config.yaml
              ├─── hydra.yaml
              └─── overrides.yaml
```
One can customize these folder names if they want instead of just having the day and time as the folder names. To do so, please read more [here](https://hydra.cc/docs/configure_hydra/workdir/).