## Working Directory

By default, IGM will use the current working directory wherever you use the `igm_run` command (and thus save all the results to this directory). While it could be possible to change the working directory to run IGM outside of where the `experiment` folder is located, we suggest you use IGM as intended as it could break some other modules. However, we can easily change the output directories so that our results are stored for each run and not overwritten. To do this, we can specify to create a new output directory for each and every run by adding the following lines 

```yaml title="params.yaml"
hydra:
  job:
    chdir: True
...
```

Consequently, each IGM run will then generate a folder with the day as the parent folder and the time as a subfolder. For instance, after a few runs we could end up with the following structure

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