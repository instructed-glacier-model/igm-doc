# Overview

IGM runs from the command line. A simulation is fully described by a single YAML configuration file; no source-code editing is needed.

---

## The basic command

```bash
igm_run +experiment=params
```

This tells Hydra to load `experiment/params.yaml` from the current directory, compose the full configuration, and start the simulation. Run it from the folder that contains the `experiment/` directory:

```
my_experiment/
├── experiment/
│   └── params.yaml
└── [run igm_run here]
```

If you are using custom modules, place them alongside the experiment folder:

```
my_experiment/
├── experiment/
│   └── params.yaml
└── user/
    ├── conf/      # Hydra config stubs for each custom module
    └── code/      # Python source files
```

!!! tip
    Activate your IGM virtual environment before running.

---

## Changing parameters

Any parameter can be changed directly on the command line:

```bash
igm_run +experiment=params processes.time.end=2100
```

To run multiple values in one go (Hydra multirun):

```bash
igm_run -m +experiment=params \
  processes.iceflow.physics.sliding.tau_ref=0.05,0.10,0.20
```

See [Hydra: Basics](hydra/basics.md) for the full override syntax.

---

## Where to go next

<div class="tutorial-cards">

  <a class="tutorial-card" href="../tutorials/">
    <div class="tutorial-card-tag">Tutorials</div>
    <h3>Step-by-step examples</h3>
    <p>Follow a complete simulation of the Aletsch Glacier from data loading to output — then add Hydra sweeps, particle tracking, and Optuna calibration.</p>
    <div class="tutorial-card-footer">Browse tutorials →</div>
  </a>

  <a class="tutorial-card" href="../best_practices/checklist/">
    <div class="tutorial-card-tag">Best practices</div>
    <h3>Checklist &amp; tips</h3>
    <p>What to verify before trusting results: numerical stability, domain boundaries, mass conservation, and common pitfalls.</p>
    <div class="tutorial-card-footer">Read the checklist →</div>
  </a>

  <a class="tutorial-card" href="../best_practices/faq/">
    <div class="tutorial-card-tag">Q&amp;A</div>
    <h3>FAQ</h3>
    <p>Answers to common questions about installation, configuration, outputs, and troubleshooting.</p>
    <div class="tutorial-card-footer">Browse the FAQ →</div>
  </a>

</div>
