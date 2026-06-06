# Overview

All IGM fields live in a shared **state object** (`state`). Every module reads from and writes to this object — there are no private module states. Fields are TensorFlow tensors and can be accessed as `state.varname`.

Variables can also be accessed using **aliases** — alternative names drawn from other naming conventions (e.g. PISM) or longer descriptive names. Aliases carry no runtime cost for the canonical names listed below. See the [Developer: Aliases](../developer/aliases.md) section for full details.

<div class="tutorial-cards">

  <a class="tutorial-card" href="../variables/igm/">
    <div class="tutorial-card-tag">Reference</div>
    <h3>IGM Canonical Names</h3>
    <p>The names used internally by IGM. Every module and config references these.</p>
    <div class="tutorial-card-footer">View table →</div>
  </a>

  <a class="tutorial-card" href="../variables/pism/">
    <div class="tutorial-card-tag">PISM</div>
    <h3>PISM Aliases</h3>
    <p>Map PISM variable names to IGM canonical names.</p>
    <div class="tutorial-card-footer">View table →</div>
  </a>

  <a class="tutorial-card" href="../variables/descriptive/">
    <div class="tutorial-card-tag">Descriptive</div>
    <h3>Descriptive Aliases</h3>
    <p>Map long English names (e.g. <code>bed_elevation</code>, <code>temperature</code>) to IGM canonical names.</p>
    <div class="tutorial-card-footer">View table →</div>
  </a>

</div>

---

## Dependency Graph

The interactive graph below shows how core modules are connected through shared state variables. **Nodes** are state variable groups. **Edges** point from the module that writes a variable to the module that reads it.

Use the filter buttons to highlight edges for a specific module, or drag nodes to rearrange the layout.

<div style="width: 100%; height: 800px; border: 1px solid rgba(128,128,128,0.2); border-radius: 8px; overflow: hidden;">
<iframe
  src="../../assets/dependency_graph.html"
  style="width: 100%; height: 100%; border: none;"
  title="IGM module dependency graph">
</iframe>
</div>
