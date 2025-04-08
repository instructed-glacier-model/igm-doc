# Hydra

In order to launch IGM with different parameters, each run is typically accompanied with a corresponding `params` file. This file is responsible for the selection of modules (i.e. an input, process, or output module), specifying variables and constants within the modules, and many other tasks. While there are many packages that serve this purpose, we chose to use the [hydra](https://hydra.cc/docs/intro/) package (previously, it was `argparse`). It has been extensively used for machine learning experiments and tuning complex parameters. For this reason, all `param` files now use the [yaml]() extension, aiding in further readability and organization. In short, our reasons to specifically use this package are the following

**Readability and reproducability**: As Hydra uses the yaml extension, files are by consequence much easier to read. Hydra also excels in keeping track of which parameters you change, so for scientific experiments, it is much easier for results to become reproducable.

**Scalability**: While it is certainly possible to have IGM work on multiple computers, GPUs, etc., there is a lot of manual work involved in setting this up and maintaining it. Fortunately, Hydra automatically takes care of many of these requirements. For instance, we can launch ensemble runs quite easily with a single line, optimize our parameters for inverse problems, and integrate our system into slurm directly. For more information, please visit()[].

**Abstraction**: Lastly, but arguably most importantly, hydra excels in managing complex hierarchies of yaml files. If we were to manage this ourselves, it quickly becomes error prone and acts as a barrier to how organized IGM can become. We chose Hydra to let it manage our structure in hopes that it will robustify our existing codebase whilst future proofing it.

## How Hydra Works

In this section, we will explore a bit on how Hydra works with IGM. For full details, we suggest you go here and look at some of the [tutorials](https://hydra.cc/docs/tutorials/basic/your_first_app/simple_cli/).

Each IGM run, like before, takes a single `params` file to choose modules and initialize constants. In this file, we can specify which modules we want and their following parameters. As seen in the 

<!-- Let's assume you areFor instance, from one of the examples, we have the following configuration file (from [aletsch-basic](https://github.com/instructed-glacier-model/igm-examples/blob/main/aletsch-basic/experiment/params.yaml)). -->

```yaml
# @package _global_

core:
	...

defaults:
  - override /inputs: 
    ...
  - override /processes: 
	...
  - override /outputs: 
	...

inputs:
	...

processes:
	...
    
outputs:
	...
```