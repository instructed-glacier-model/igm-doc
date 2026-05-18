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

### Process

<div class="module-cards">
  <a class="module-card" href="../processes/time/">
    <span class="module-card-name">time</span>
    <p>Advance the simulation clock and compute an adaptive time step from the CFL stability condition</p>
  </a>
  <a class="module-card" href="../processes/iceflow/">
    <span class="module-card-name">iceflow</span>
    <p>Compute 3D ice velocities by minimizing the Blatter-Pattyn energy functional — direct solver or physics-informed neural network</p>
  </a>
  <a class="module-card" href="../processes/thk/">
    <span class="module-card-name">thk</span>
    <p>Evolve ice thickness and surface elevation via mass conservation using a finite-volume upwind scheme</p>
  </a>
  <a class="module-card" href="../processes/vert_flow/">
    <span class="module-card-name">vert_flow</span>
    <p>Diagnose the 3D vertical velocity field from the horizontal velocity divergence (incompressibility)</p>
  </a>
  <a class="module-card" href="../processes/smb_simple/">
    <span class="module-card-name">smb_simple</span>
    <p>Compute surface mass balance from a user-defined elevation–SMB profile with time-varying ELA</p>
  </a>
  <a class="module-card" href="../processes/enthalpy/">
    <span class="module-card-name">enthalpy</span>
    <p>Solve the 3D enthalpy equation to compute ice temperature, liquid water content, and basal melt rate</p>
  </a>
</div>

!!! note "Additional SMB modules"
    IGM provides two further surface mass balance modules of increasing physical complexity, each requiring climate forcing inputs: a monthly **temperature-index model** calibrated against geodetic mass balance observations (based on OGGM), and a **positive degree-day** scheme with explicit snowpack tracking and separate melt factors for snow and ice. These are available as community/user modules; see the source repository for documentation.

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

<div class="module-cards">
  <a class="module-card" href="../processes/avalanche/">
    <span class="module-card-name">avalanche</span>
    <p>Redistribute snow from slopes exceeding the angle of repose to prevent unrealistic accumulation at high elevations</p>
  </a>
  <a class="module-card" href="../processes/calving_rate/">
    <span class="module-card-name">calving_rate</span>
    <p>Compute the calving flux at a marine or lacustrine ice front from ice thickness and velocity</p>
  </a>
  <a class="module-card" href="../processes/clim_glacialindex/">
    <span class="module-card-name">clim_glacialindex</span>
    <p>Interpolate two climate snapshots using a glacial index approach for palaeo-glacier modelling</p>
  </a>
  <a class="module-card" href="../processes/clim_oggm/">
    <span class="module-card-name">clim_oggm</span>
    <p>Distribute monthly GSWP3-W5E5 climate data from oggm_shop across the glacier domain with lapse-rate correction</p>
  </a>
  <a class="module-card" href="../processes/clim_station/">
    <span class="module-card-name">clim_station</span>
    <p>Generate temperature and precipitation fields from simplified weather-station-type forcing with elevation lapse rate</p>
  </a>
  <a class="module-card" href="../processes/data_assimilation/">
    <span class="module-card-name">data_assimilation</span>
    <p>Invert for optimal ice thickness and flow parameters by minimising the misfit against observed surface velocities and thickness profiles</p>
  </a>
  <a class="module-card" href="../processes/effective_pressure/">
    <span class="module-card-name">effective_pressure</span>
    <p>Compute basal effective pressure N = pᵢ − pᵥ required by the Budd and Coulomb sliding laws</p>
  </a>
  <a class="module-card" href="../processes/flow_accumulation/">
    <span class="module-card-name">flow_accumulation</span>
    <p>Compute subglacial water routing and flow accumulation from bed topography</p>
  </a>
  <a class="module-card" href="../processes/gflex/">
    <span class="module-card-name">gflex</span>
    <p>Compute isostatic bedrock adjustment in response to ice load changes using a thin-plate flexure model</p>
  </a>
  <a class="module-card" href="../processes/glerosion/">
    <span class="module-card-name">glerosion</span>
    <p>Estimate glacial erosion rates and update bedrock topography from basal sliding velocities</p>
  </a>
  <a class="module-card" href="../processes/particles/">
    <span class="module-card-name">particles</span>
    <p>Seed and advect Lagrangian particles with the 3D velocity field to visualise ice flow paths and estimate ice age</p>
  </a>
  <a class="module-card" href="../processes/pretraining/">
    <span class="module-card-name">pretraining</span>
    <p>Pre-train the ice flow emulator on a glacier catalogue to improve accuracy in subsequent forward runs</p>
  </a>
  <a class="module-card" href="../processes/read_output/">
    <span class="module-card-name">read_output</span>
    <p>Read a previously generated NetCDF output file as if freshly computed, for testing post-processing in isolation</p>
  </a>
  <a class="module-card" href="../processes/rockflow/">
    <span class="module-card-name">rockflow</span>
    <p>Simulate the transport of supraglacial and englacial debris coupled to ice flow</p>
  </a>
  <a class="module-card" href="../processes/smb_accpdd/">
    <span class="module-card-name">smb_accpdd</span>
    <p>Positive degree-day surface mass balance model with explicit snowpack tracking and separate melt factors for snow and ice</p>
  </a>
  <a class="module-card" href="../processes/smb_oggm/">
    <span class="module-card-name">smb_oggm</span>
    <p>Monthly temperature-index surface mass balance model calibrated against geodetic mass balance data via OGGM</p>
  </a>
  <a class="module-card" href="../processes/texture/">
    <span class="module-card-name">texture</span>
    <p>Track a passive scalar (e.g. sediment concentration, chemical tracer) transported through the ice</p>
  </a>
</div>

