# Authors

## Core developers

<div class="credits-table" markdown="1">
| Name | Contributions |
|---|---|
| Guillaume Jouvet (UNIL) | Primary author of most modules and documentation; design of the physics-informed CNN in forward and inverse modes |
| Brandon Finley (UNIL) | Core software design, Hydra integration, code profiling, Docker, documentation framework, `texture` module |
| Thomas Gregov (UNIL) | Refactoring and overhaul of the `iceflow` and `enthalpy` modules — robustness, code quality, benchmarking |
| Sebastian Rosier (UZH) | Refactoring and overhaul of `data_assimilation` and `pretraining` modules; creation of pre-trained emulators |
</div>

## Contributors

*(get in touch if you notice a missing contribution)*

<div class="credits-table" markdown="1">
| Name | Contributions |
|---|---|
| Lucie Bacchin | Tests of the enthalpy module |
| Flavio Calvo | Support from IGM 1 to IGM 2 |
| Samuel Cook | Global-modelling functions in `data_assimilation`; RGI7 support in `oggm_shop` |
| Guillaume Cordonnier | Co-design of the physics-informed CNN; original `thk` module |
| Thomas Frank | time relaxation module generalizing Thomas's original implementation |
| Andreas Henz | Loading ice masks from shapefiles in input modules, avalanche module improvements |
| Oskar Hermann | `anim_plotly` visualisation tool |
| Tancrède Leger | Climate module station |
| Fabien Maussion | Original `oggm_shop` module; oggm-related modules; OGGM integration |
| Jürgen Mey | `avalanche` and `gflex` modules |
| Margot Sirdey | Support from IGM 1 to IGM 2; PyPI setup |
| Gillian Smith | Bug fixes in the data assimilation and the data assimilation |
| Claire-Mathilde Stücki | Vertical velocity computation and particles |
| Ethan Welty | GlaThiDa file reading |
</div>

## Funding

<div class="affiliation-logos">
  <a href="https://www.unil.ch"><img src="../../fig/logo_unil.svg" alt="University of Lausanne (UNIL)"></a>
  <a href="https://www.uzh.ch"><img src="../../fig/logo_uzh.svg" alt="University of Zurich (UZH)"></a>
</div>

IGM is developed at the Universities of Lausanne and Zurich, Switzerland, within the SNSF project RECONCILE (grant 200020_213077/1), by Guillaume Jouvet (UNIL) and Andreas Vieli (UZH).
