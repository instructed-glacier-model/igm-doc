# Overview

IGM is built around a **modular architecture**: every physical process and every I/O operation is encapsulated in a self-contained module with its own parameters, source code, and documentation. Modules can be combined, reordered, or replaced from the configuration file — no source-code editing required.

## Architecture

A simulation is assembled from three categories of modules:

- **Input modules** load data (bedrock, observations, climate) into the shared model state before the time loop begins.
- **Process modules** update state variables at every time step — ice flow, mass balance, thermodynamics, and more.
- **Output modules** write or visualise results at regular intervals during the time loop.

```
inputs → [initialize] → time loop { processes → outputs } → [finalize]
```

The shared **state object** (`state`) carries all glacier fields as TensorFlow tensors. Any module can read or write any field; changes propagate to all subsequent modules in the pipeline. See [State Variables](state_variables.md) for the complete list of fields and their dependencies.

## Core modules

Maintained by the IGM development team, well-tested, and stable across releases.

### Input

<div class="module-cards">
  <a class="module-card" href="../inputs/local/">
    <span class="module-card-name">local</span>
    <p>Load initial fields (ice thickness, bedrock, velocities) from local NetCDF or GeoTIFF files</p>
  </a>
  <a class="module-card" href="../inputs/load_ncdf/">
    <span class="module-card-name">load_ncdf</span>
    <p>Load one or more fields from a NetCDF file at an explicit path</p>
  </a>
  <a class="module-card" href="../inputs/load_tif/">
    <span class="module-card-name">load_tif</span>
    <p>Load fields from GeoTIFF raster files</p>
  </a>
  <a class="module-card" href="../inputs/oggm_shop/">
    <span class="module-card-name">oggm_shop</span>
    <p>Automatically download and prepare glacier data (DEM, ice thickness, RGI outline) from the OGGM database</p>
  </a>
</div>

### Assimilation

{{ render_assimilation_cards(kind="core") }}

### Process

{{ render_process_cards(kind="core") }}

### Output

<div class="module-cards">
  <a class="module-card" href="../outputs/local/">
    <span class="module-card-name">local</span>
    <p>Write selected state fields to a NetCDF file in the run output folder</p>
  </a>
  <a class="module-card" href="../outputs/write_ncdf/">
    <span class="module-card-name">write_ncdf</span>
    <p>Write fields to a NetCDF file at an arbitrary path</p>
  </a>
  <a class="module-card" href="../outputs/write_vtp/">
    <span class="module-card-name">write_vtp</span>
    <p>Write fields to VTK PolyData format for 3D visualisation in ParaView</p>
  </a>
  <a class="module-card" href="../outputs/write_tif/">
    <span class="module-card-name">write_tif</span>
    <p>Write fields to GeoTIFF rasters (georeferenced)</p>
  </a>
  <a class="module-card" href="../outputs/write_ts/">
    <span class="module-card-name">write_ts</span>
    <p>Write scalar time series (volume, area, mass balance, …) to a CSV file</p>
  </a>
  <a class="module-card" href="../outputs/plot2d/">
    <span class="module-card-name">plot2d</span>
    <p>Save 2D map snapshots as PNG images at each output time step</p>
  </a>
  <a class="module-card" href="../outputs/live_dashboard/">
    <span class="module-card-name">live_dashboard</span>
    <p>Display an interactive real-time dashboard of key fields during the simulation</p>
  </a>
</div>

## Community modules

Contributed by the broader research community. These modules extend IGM with specialised or experimental physics and may evolve more rapidly than core modules.

### Process

<details class="community-modules">
<summary>Show / hide community process modules</summary>
<div class="community-modules-body">

{{ render_process_cards(kind="community") }}

</div>
</details>
