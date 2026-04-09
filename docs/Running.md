# How to Run IGM

Once IGM is installed, one can launch an experiment by using the following command:

```
igm_run +experiment=params
```

Importantly, before doing so you must

1. Make sure the virtual environment where IGM is installed is activated.
2. Verify that you are running this command in a folder where the `experiment` can be found.
3. (Optional) If using custom modules, place them in the correct place.

Assuming that you want to launch the `params` experiment, you can run the above command in the same level where the `experiment` folder belongs.

```
├ [RUN COMMAND HERE]
├── experiment  # contains the parameter file
│   └── params.yaml
```

Optionally, if you have decided to include custom modules, you should also put these folders in the same level as the `experiment` folder (shown below). In particular you need to 

1. Setup the correct Hydra configuration
2. Create your custom module python script in the correct manner

For more information on how to use custom modules in IGM, please visit [here](modules/user_modules.md).

```
├ [RUN COMMAND HERE]
├── experiment  # contains the parameter file
│   └── params.yaml
└── user        # contains user-modules if any
│   └── conf
│   │   └── ...
│   └── code
│       └── ...
```