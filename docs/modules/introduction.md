# Introduction

IGM is organized in a module-wise fashion, recognizing the similarity in the tasks performed such as the loading of data, the initializing of fields, the update of these fields within a time loop, or the outputting results at regular time intervals. Each module handles a specific aspect of the glacier evolution process, making the model modular:

- the `inputs` modules serve to load data (e.g., glacier bedrock, ice surface velocities, ...),

- the `processes` modules implement physical mechanisms in a decoupled manner (e.g., ice flow, mass conservation, ...),

- the `outputs` modules serve to write or plot model results.

The main Python script `igm_run` permits to load all `inputs`, `processes`, `outputs` modules and their parameters, initialize, update them within a time loop, and finalize them. The large majority of the IGM code is part of modules, while the core structure is very lightweight. Each module includes:

- a name that is used to identify it (e.g., `greatmodule`)

- a source code located `XXX/greatmodule/greatmodule.py` where XXX is folder `inputs`, `processes`, or `outputs` according to the nature of the module.

- a parameter file located in `conf/XXX/greatmodule.yaml` with default parameters,

- a help file `conf_help/XXX/greatmodule.yaml` specifying the definition of each parameter, its type and unit.

- a documentation page located on the `igm-doc` GitHub repo that serves to build the documentation.

For convenience, users can write their own module-parameter pair in a folder `user`, and can call the user module from the parameter file.
