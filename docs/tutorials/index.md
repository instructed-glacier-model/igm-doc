# Tutorials

Step-by-step guides for running IGM on the Great Aletsch Glacier. Each tutorial is self-contained and builds progressively in complexity.

!!! tip "Before you start"
    If you don't know anything about glacier processes, explore this great [website](https://www.antarcticglaciers.org/). If you don't know anything about glacier evolution modelling, you may want to watch this [introductory video](https://youtu.be/eJNIr_0zOyk) first.

**Prerequisites:** a working IGM installation ([Quick Start](../installation/quick_start.md)) and basic familiarity with the command line. All tutorial files (data, params, custom modules) are in the [igm-examples repository](https://github.com/instructed-glacier-model/igm-examples).

---

<div class="tutorial-cards">

  <a class="tutorial-card" href="aletsch/">
    <div class="tutorial-card-tag">First steps</div>
    <h3>Aletsch: forward run</h3>
    <p>Four progressive steps from a simple ELA-based SMB to a realistic temperature-index model with custom modules and climate forcing.</p>
    <div class="tutorial-card-concepts">
      <span>smb_simple</span><span>custom modules</span><span>climate forcing</span><span>iceflow</span>
    </div>
    <div class="tutorial-card-footer">View tutorial →</div>
  </a>

  <a class="tutorial-card" href="aletsch_ensemble/">
    <div class="tutorial-card-tag">Going further</div>
    <h3>Aletsch: ensemble run with Hydra</h3>
    <p>Override parameters from the command line and sweep over accumulation weights and sliding coefficients. Collect and compare glacier volume time series across runs.</p>
    <div class="tutorial-card-concepts">
      <span>Hydra multirun</span><span>parameter sweeps</span><span>ensemble analysis</span>
    </div>
    <div class="tutorial-card-footer">View tutorial →</div>
  </a>

  <a class="tutorial-card" href="aletsch_particles/">
    <div class="tutorial-card-tag">Going further</div>
    <h3>Aletsch: particle tracking</h3>
    <p>Seed Lagrangian tracers in the accumulation zone and follow them through the glacier. Visualise englacial flow paths and compute travel times.</p>
    <div class="tutorial-card-concepts">
      <span>particles</span><span>Lagrangian tracking</span><span>flow paths</span><span>ice age</span>
    </div>
    <div class="tutorial-card-footer">View tutorial →</div>
  </a>

  <a class="tutorial-card" href="aletsch_da/">
    <div class="tutorial-card-tag">Deep dive</div>
    <h3>Aletsch: parameter calibration with Optuna</h3>
    <p>Calibrate SMB weights and sliding coefficients against 7 historical DEMs and InSAR velocities using single- and multi-objective Optuna sweeps.</p>
    <div class="tutorial-card-concepts">
      <span>Optuna</span><span>TPE</span><span>NSGA-II</span><span>Pareto front</span>
    </div>
    <div class="tutorial-card-footer">View tutorial →</div>
  </a>

</div>

---

More tutorials are in preparation. To contribute a tutorial, open a pull request on the [igm-examples repository](https://github.com/instructed-glacier-model/igm-examples).
