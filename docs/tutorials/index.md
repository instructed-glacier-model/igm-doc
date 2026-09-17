# Tutorials

Step-by-step guides for running IGM on real glaciers. Each tutorial is self-contained and builds progressively in complexity.

!!! tip "Before you start"
    If you don't know anything about glacier processes, explore this great [website](https://www.antarcticglaciers.org/). If you don't know anything about glacier evolution modelling, you may want to watch this [introductory video](https://youtu.be/eJNIr_0zOyk) first.

**Prerequisites:** a working IGM installation ([Quick Start](../installation/quick_start.md)) and basic familiarity with the command line. All tutorial files (data, params, custom modules) are in the [igm-examples repository](https://github.com/instructed-glacier-model/igm-examples).

---

<div class="tutorial-cards">

  <a class="tutorial-card" href="aletsch/">
    <div class="tutorial-card-tag">First steps</div>
    <h3>Aletsch: forward modelling</h3>
    <p>Five progressive steps from a simple ELA-based SMB to a realistic temperature-index model with custom modules, climate forcing, and particle tracking.</p>
    <div class="tutorial-card-concepts">
      <span>smb</span><span>custom modules</span><span>climate forcing</span><span>particles</span><span>iceflow</span>
    </div>
    <div class="tutorial-card-footer">View tutorial →</div>
  </a>

  <a class="tutorial-card" href="aletsch_da/">
    <div class="tutorial-card-tag">Deep dive</div>
    <h3>Aletsch: parameter calibration with Optuna</h3>
    <p>Calibrate SMB weights and basal friction against 7 historical DEMs and observed velocities using single- and multi-objective Optuna sweeps.</p>
    <div class="tutorial-card-concepts">
      <span>Optuna</span><span>TPE</span><span>NSGA-II</span><span>Pareto front</span>
    </div>
    <div class="tutorial-card-footer">View tutorial →</div>
  </a>

  <a class="tutorial-card" href="aletsch_inversion/">
    <div class="tutorial-card-tag">Deep dive</div>
    <h3>Aletsch: ice-thickness inversion</h3>
    <p>Recover the ice-thickness field from surface velocities with the data_assimilation module, including L-curve regularisation and a sliding-coefficient sweep.</p>
    <div class="tutorial-card-concepts">
      <span>data_assimilation</span><span>inversion</span><span>L-curve</span><span>regularisation</span>
    </div>
    <div class="tutorial-card-footer">View tutorial →</div>
  </a>

  <a class="tutorial-card" href="enthalpy_dronbreen/">
    <div class="tutorial-card-tag">Deep dive</div>
    <h3>Drønbreen: polythermal ice and the enthalpy module</h3>
    <p>Model cold and temperate ice on a Svalbard glacier with the enthalpy module, then calibrate the surface thermal forcing against radar-mapped cold–temperate transition surfaces.</p>
    <div class="tutorial-card-concepts">
      <span>enthalpy</span><span>polythermal</span><span>CTS</span><span>Optuna</span>
    </div>
    <div class="tutorial-card-footer">View tutorial →</div>
  </a>

  <a class="tutorial-card" href="igm_viz/">
    <div class="tutorial-card-tag">Tool</div>
    <h3>Visualizing output with igm_viz</h3>
    <p>Explore a run's output as an interactive 3-D animation: pick variables, adjust the view, animate frames, and track volume/area over time.</p>
    <div class="tutorial-card-concepts">
      <span>igm_viz</span><span>Plotly</span><span>Dash</span>
    </div>
    <div class="tutorial-card-footer">View tutorial →</div>
  </a>

</div>

---

More tutorials are in preparation. To contribute a tutorial, open a pull request on the [igm-examples repository](https://github.com/instructed-glacier-model/igm-examples).
