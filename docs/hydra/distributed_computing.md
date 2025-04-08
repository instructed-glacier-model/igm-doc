# Distributed Computing

Another advantage with Hydra is that it is well suited for distributed computing. Specifically, it is not just meant for distributed computing but running experiments at scale. Previously, we learned that each IGM run requires a single experiment file (e.g. `params.yaml`). However, instead of running just one experiment, we can run multiple. We can do this with Hydra's flag `--multirun`.

## Using Multirun

For example, lets say that I want to run the same experiment but just with two different values for one of my modules. In this example, lets take the `aletsch-basic` example's setup

```yaml title="param.yaml"
# @package _global_

core:
  url_data: https://www.dropbox.com/scl/fo/kd7dix5j1tm75nj941pvi/h?rlkey=q7jtmf9yn3a970cqygdwne25j&dl=0
  logging: True
  logging_level: 30

defaults:
  - override /inputs: 
    - local
  - override /processes: 
    - smb_simple
    - iceflow
    - time
    - thk
    - vert_flow
    - particles
  - override /outputs: 
    - local
    - plot2d

inputs:
  local:
     filename: input.nc
     coarsening:
       ratio: 1

processes:
  smb_simple:
    array:
      - ["time", "gradabl", "gradacc", "ela", "accmax"]
      - [1900, 0.009, 0.005, 2800, 2.0]
      - [2000, 0.009, 0.005, 2900, 2.0]
      - [2100, 0.009, 0.005, 3300, 2.0]
  time:
    start: 1900.0
    end: 2000.0
    save: 10.0
    
outputs:
  plot2d:
    live: False
```

Now, lets assume I want to run two experiments: one with `start=1900` and another with `start=1950`. Instead of manually running two experiments back-to-back, I can run the following command

!!! warning

	Make sure you add `--multirun` at the end of the command. Additionally, watch out for spaces (i.e. `1990,1950` and not `1990, 1950`).

```bash
igm_run +experiment=params processes.time.start=1990,1950 --multirun
```

which will result in Hydra launching two jobs *sequentially*. Importantly, the default bahvior is to use the `basic` launcher, which means that the jobs will be run one at a time. We can verify this by looking at the terminal, where we see the message

```bash hl_lines="2"
[2025-04-08 11:34:59,755][HYDRA] Launching 2 jobs locally
[2025-04-08 11:34:59,755][HYDRA] 	#0 : +experiment=params processes.time.start=1990
...
CODE IS RUNNING HERE
...
```

However, most jobs are independent, so instead we should ideally launch both jobs at the same time. This is where we can use the `joblib` launcher instead. To do this, we can instead use the command

!!! note

	Make sure to install it beforehand with `pip install hydra-joblib-launcher --upgrade`

```bash
igm_run +experiment=params processes.time.start=1990,1950 hydra/launcher=joblib --multirun
```

which will produce the following output

```bash
[2025-04-08 11:43:51,156][HYDRA] Joblib.Parallel(n_jobs=-1,backend=loky,prefer=processes,require=None,verbose=0,timeout=None,pre_dispatch=2*n_jobs,batch_size=auto,temp_folder=None,max_nbytes=None,mmap_mode=r) is launching 2 jobs
[2025-04-08 11:43:51,156][HYDRA] Launching jobs, sweep output dir : multirun/2025-04-08/11-43-50
[2025-04-08 11:43:51,156][HYDRA] 	#0 : +experiment=params processes.time.start=1990
[2025-04-08 11:43:51,156][HYDRA] 	#1 : +experiment=params processes.time.start=1950
```

Here we see that both jobs were launched in parallel instead of one at at a time. We can also see that there are various parameters we can choose like the number of jobs or the batch size. For an exhaustive list, please go to Hydra's [page](https://hydra.cc/docs/plugins/joblib_launcher/).

## Grid Searches

One cool extension of this is that it is very easy to launch a multitude of jobs where Hydra will simply launch all possible combinations of the parameters. For instance, lets say that I do not only want to change the start date but also the end date and try all 4 combinations. To do this, I use the same command but just specify the end date and include a comma between potential values:

```bash
igm_run +experiment=params processes.time.start=1990,1950 processes.time.end=2000,2050 hydra/launcher=joblib --multirun
```

which will produce the following message from Hydra

```bash
[2025-04-08 12:04:41,425][HYDRA] Joblib.Parallel(n_jobs=-1,backend=loky,prefer=processes,require=None,verbose=0,timeout=None,pre_dispatch=2*n_jobs,batch_size=auto,temp_folder=None,max_nbytes=None,mmap_mode=r) is launching 4 jobs
[2025-04-08 12:04:41,425][HYDRA] Launching jobs, sweep output dir : multirun/2025-04-08/12-04-40
[2025-04-08 12:04:41,425][HYDRA] 	#0 : +experiment=params processes.time.start=1990 processes.time.end=2000
[2025-04-08 12:04:41,425][HYDRA] 	#1 : +experiment=params processes.time.start=1990 processes.time.end=2050
[2025-04-08 12:04:41,425][HYDRA] 	#2 : +experiment=params processes.time.start=1950 processes.time.end=2000
[2025-04-08 12:04:41,425][HYDRA] 	#3 : +experiment=params processes.time.start=1950 processes.time.end=2050
```

In addition to grid searchs, Hydra actually also allows for smarter searches using Beysian approaches or other inverse algorithms. To learn more, please visit their [sweepers](https://hydra.cc/docs/plugins/ax_sweeper/) section.

## Running on Node Clusters

Here we will explore a basic example of when you have multiple GPU devices and want to run IGM on both devices for respective experiments. Above, you learned how to launch 2 experiments at the same time. If we only have a single GPU device, IGM will try to use the same GPU for both experiments, which will result in potential conflicts. To combat this, we can still use `joblib` but when on a cluster of multple GPUs. For example, lets say our node looks like the following (when running `nvidia-smi`)

```bash
Tue Apr  8 11:52:52 2025       
+---------------------------------------------------------------------------------------+
| NVIDIA-SMI 535.161.07             Driver Version: 535.161.07   CUDA Version: 12.2     |
|-----------------------------------------+----------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |         Memory-Usage | GPU-Util  Compute M. |
|                                         |                      |               MIG M. |
|=========================================+======================+======================|
|   0  NVIDIA GeForce RTX 4090        On  | 00000000:02:00.0 Off |                  Off |
| 90%   27C    P8              16W / 450W |      0MiB / 24564MiB |      0%      Default |
|                                         |                      |                  N/A |
+-----------------------------------------+----------------------+----------------------+
|   1  NVIDIA GeForce RTX 4090        On  | 00000000:83:00.0 Off |                  Off |
| 90%   26C    P8              18W / 450W |      0MiB / 24564MiB |      0%      Default |
|                                         |                      |                  N/A |
+-----------------------------------------+----------------------+----------------------+
                                                                                         
+---------------------------------------------------------------------------------------+
| Processes:                                                                            |
|  GPU   GI   CI        PID   Type   Process name                            GPU Memory |
|        ID   ID                                                             Usage      |
|=======================================================================================|
|  No running processes found                                                           |
+---------------------------------------------------------------------------------------+
```

Here you will see two GPUs: `NVIDIA RTX 4090`. Now, lets still use the `joblib` launcher, but before doing so, specify a different GPU device for each run. To do so, we can locate the GPU ID on the far left (in this case, we have `0` and `1`) and either in our `params` file or the commandline, we can select the GPU device. In our case, lets say we have two experiments

```yaml title='experiment_1'
core:
  hardware:
    visible_gpus: [0]
...
```
```yaml title='experiment_2'
core:
  hardware:
    visible_gpus: [1]
...
```

Then, by simply doing

```bash
igm_run +experiment=experiment_1,experiment_2 hydra/launcher=joblib --multirun
```

we launch both experiments on both GPUs.

Hydra also allows one to use [SLURM](https://hydra.cc/docs/plugins/submitit_launcher/) scipts as well as AWS clusters (using [Ray](https://hydra.cc/docs/plugins/ray_launcher/)). While we do not currently have an example, we recommend you to again go to Hydra's page to learn more.


