# Module `field_inversion`

!!! info "Brief summary"
    `field_inversion` is IGM's newer inversion route, **set to replace
    `data_assimilation` in the long term**. It inverts for unknown fields (e.g. ice
    thickness) from surface
    observations (e.g. observed surface ice velocities) by iteratively minimising a
    cost function that penalises the misfit between model predictions and observations
    plus a regularization penalty on the control variables. Optionally, the iceflow
    network emulator can be fine-tuned between inversion iterations to keep it
    self-consistent with the updated geometry.

    The **parameters** of the module are described [here](#parameters).

{{ render_module_io("field_inversion") }}

## Overview

`field_inversion` uses gradient-based optimisation to recover one or more control variables (e.g. `thk`, `tau_ref`, `arrhenius`) from surface velocity observations. Each call to `update` performs the following sequence:

1. **DA phase** — minimise the total cost $J(\boldsymbol{\theta})$ ([defined below](#objective-function-objective)) with respect to the control variables using an L-BFGS optimiser with optional box constraints. Snapshots of the cost and the state fields are written to `optimize.nc` every `output.freq` accepted iterations.

2. **Retraining phases** (optional, repeated `optimization.retrain_iter` times) — after each DA phase, fine-tune the pretrained iceflow network emulator on the current glacier geometry, then run another DA phase. This alternation keeps the emulator consistent with the inverted fields as they evolve. Care must be taken to avoid retraining too aggressively however, as this can lead to overfitting and loss of generalization.

The control variables are declared in the [`variables`](#control-variables-variables) list, and the cost function is assembled term by term from the [`objective`](#objective-function-objective) dictionary. The default configuration inverts for `thk` using a surface-velocity Gaussian misfit against `uvelsurfobs`/`vvelsurfobs` and a Laplacian-based smoothness regularization on `thk`.

## Control variables (`variables`)

`variables` is a **list of dictionaries**, one per field to invert. Each entry accepts the following keys:

| Key | Required | Default | Meaning |
|-----|----------|---------|---------|
| `name` | yes | — | Name of the `state` field to invert (e.g. `thk`, `tau_ref`, `arrhenius`). |
| `transform` | no | `identity` | Parameterization used by the optimiser (see below). |
| `lower_bound` | no | unbounded | Lower box constraint, in **physical** units (e.g. metres for `thk`). |
| `upper_bound` | no | unbounded | Upper box constraint, in **physical** units. |
| `mask` | no | `icemask` | Name of a `state` field used as a boolean mask; only cells where the mask is non-zero are optimised, all other cells keep their initial values. Dotted paths (e.g. `iceflow.some_mask`) are resolved on `state`. |

Duplicate variable names are rejected, the mask must have the same shape as the field, and a mask with no active cells is an error.

**Which names can be inverted?** Any field present on `state` can be declared, but a control variable only influences the modelled velocities if it is one of the iceflow emulator's input channels (`processes.iceflow.unified.inputs` — by default `thk`, `usurf`, `arrhenius`, `tau_ref`, `dX`). In practice the supported control variables are:

| Name | Physical meaning | Initialisation at startup |
|------|------------------|---------------------------|
| `thk` | Ice thickness (m) | Estimated from observations (see below), unless `use_existing_thk: true`, in which case the existing `state.thk` is used. |
| `tau_ref` | Sliding reference stress (see `iceflow` sliding physics) | Constant field set to `processes.iceflow.physics.sliding.tau_ref`. |
| `arrhenius` | Arrhenius (rate) factor (see `iceflow` viscosity physics) | Constant field set to `processes.iceflow.physics.viscosity.arrhenius`. |
| `usurf` | Surface elevation (m) | Taken from the existing `state.usurf`. |

**Initial thickness construction** — when `thk` is a control variable (and `use_existing_thk` is false), the module initialises it from a blend of an SIA-based thickness estimate (reliable where speeds are high) and a distance-from-margin estimate (reliable near the margin), blended smoothly by surface speed magnitude, then smoothed and clamped.

### Transforms

The optimiser works on an internal variable $\theta$ related to the physical field $x$ by the chosen `transform`. Bounds are always given in physical space and converted automatically. Available transforms:

| `transform` | Mapping | When to use |
|-------------|---------|-------------|
| `identity` | $x = \theta$ | Default; fields whose natural scale is well-behaved (e.g. `thk`). |
| `log10` | $x = 10^{\theta}$ | Positive fields spanning orders of magnitude (e.g. `arrhenius`, `tau_ref`); guarantees positivity. |
| `softplus` | $x = \log(1 + e^{\theta})$ | Positive fields; smooth alternative to `log10` that behaves linearly for large values. |
| `mpa_to_kpa_theta` | $x\,[\mathrm{MPa}] = \theta / 1000$ | Optimise a stress in kPa while the physical parameter stays in MPa (pure rescaling for better optimiser conditioning). |

Example inverting simultaneously for thickness and sliding:

```yaml
variables:
  - { name: thk,     transform: identity, lower_bound: 0.0, upper_bound: 1000.0, mask: icemask }
  - { name: tau_ref, transform: log10,    lower_bound: 0.001, upper_bound: 1.0 }
```

!!! warning "Simultaneous inversions"
    Simultaneous inversions are largely untested and more work is needed to ensure robustness and convergence. 
    For now we recommend only inverting for one unknown field at a time.

## Objective function (`objective`)

The total cost is the sum of all misfit and regularization terms declared in `objective`:

$$
J(\boldsymbol{\theta}) \;=\; \underbrace{\sum_{i} J^{\text{misfit}}_{i}}_{\text{data misfit}} \;+\; \underbrace{\sum_{j} J^{\text{reg}}_{j}}_{\text{regularization}} .
$$

### Misfit terms (`objective.misfit`)

`objective.misfit` is a **list of dictionaries**. Each entry compares one or more modelled quantities against observation fields on `state`:

| Key | Required | Default | Meaning |
|-----|----------|---------|---------|
| `name` | yes | — | Label for the term (appears in logs as `misfit:<name>`). |
| `kind` | no | `gaussian` | Error model: `gaussian` or `huber`. |
| `components` | no | `[<name>]` | Modelled quantities to compare. Available: `uvelsurf`, `vvelsurf` (surface velocities from the emulator), `divflux` (flux divergence from depth-averaged velocities and `thk`), or the name of any control variable. |
| `obs` | yes | — | Observation fields on `state`, one per component (lengths must match). |
| `std` | yes | — | Observation standard deviation $\sigma$, in the same units as the observations; residuals are scaled by $1/\sigma$. |
| `mask` | no | `icemask` | State field restricting where the misfit is evaluated. |
| `delta` | no | `1.0` | Huber transition point in $\sigma$-units (`huber` only; ignored by `gaussian`). |
| `eps` | no | `1e-12` | Numerical guard added to denominators. |

Cells where **any** observation component is NaN are excluded from the mask automatically — NaN means "no data".

**Gaussian** (`kind: gaussian`) — a standard least-squares misfit. With model components $m_k$, observations $y_k$, and shared standard deviation $\sigma$:

$$
J^{\text{misfit}} \;=\; \frac{1}{2 A_m} \int_{m} \sum_{k} \left( \frac{y_k - m_k}{\sigma} \right)^{\!2} dA .
$$

**Huber** (`kind: huber`) — a robust misfit applied to the residual *norm* (isotropic in component space, not per-component). With $r = \sqrt{\sum_k \left((y_k - m_k)/\sigma\right)^2 + \epsilon}$ and transition $\delta$:

$$
J^{\text{misfit}} \;=\; \frac{1}{A_m} \int_{m} \rho(r)\, dA,
\qquad
\rho(r) =
\begin{cases}
\tfrac{1}{2} r^2 & r \le \delta \\[2pt]
\delta\left(r - \tfrac{1}{2}\delta\right) & r > \delta
\end{cases}
$$

The Huber misfit is quadratic for residuals below $\delta$ (in $\sigma$-units) and linear beyond, capping each pixel's gradient contribution at $\delta$ so observational outliers cannot dominate the inversion. It reduces to the Gaussian misfit as $\delta \to \infty$.

### Regularization terms (`objective.regularization`)

`objective.regularization` is a **list of dictionaries**. Each entry applies a penalty to one control variable:

| Key | Required | Default | Meaning |
|-----|----------|---------|---------|
| `name` | yes | — | Control variable to penalise (must be declared in `variables`). |
| `penalty` | yes | — | Penalty type: `squared_laplacian` or `l2`. |
| `lam` | yes | — | Penalty weight $\lambda$. |
| `mask` | no | full domain | State field restricting where the penalty is evaluated (note: unlike misfits, the default is the **whole grid**, not `icemask`). |
| `ref` / `prior` | no | none | State field $\theta_\text{ref}$ to penalise deviations from; without it the field itself is penalised. Cells where the reference is NaN are excluded. |
| `eps` | no | `1e-12` | Numerical guard. |

**Squared Laplacian** (`penalty: squared_laplacian`) — penalises curvature of the field (or of its deviation from the reference), promoting smoothness:

$$
J^{\text{reg}} \;=\; \frac{\lambda}{2 A_m} \int_{m} \left( \nabla^2_m \left(\theta - \theta_\text{ref}\right) \right)^{2} dA ,
$$

where $\nabla^2_m$ is a 5-point-stencil Laplacian that uses only neighbours **inside the mask**, so values outside the mask never influence the penalty (zero-flux behaviour at the mask boundary). If no `ref` is given, $\theta_\text{ref} = 0$ and the field itself is smoothed.

**L2** (`penalty: l2`) — penalises the magnitude of the field, or its distance to a prior:

$$
J^{\text{reg}} \;=\; \frac{\lambda}{2 A_m} \int_{m} \left(\theta - \theta_\text{ref}\right)^{2} dA .
$$

With `ref` set this is a classical background/prior term pulling the solution toward $\theta_\text{ref}$; without it, it shrinks the field toward zero.

At least one misfit or regularization term must be defined; an empty objective is an error.

**Example** — velocity misfit plus a flux-divergence constraint, smoothness on `thk`, and a prior on `tau_ref`:

```yaml
objective:
  misfit:
    - { name: velsurf, kind: huber, delta: 2.0, components: [uvelsurf, vvelsurf],
        obs: [uvelsurfobs, vvelsurfobs], std: 1.0 }
    - { name: divflux, kind: gaussian, components: [divflux],
        obs: [divfluxobs], std: 0.5 }
  regularization:
    - { name: thk,     penalty: squared_laplacian, lam: 100000.0 }
```

### Retraining losses

When `optimization.retrain_iter > 0`, each retraining phase fine-tunes the emulator by minimising a weighted combination of:

- **Local physics loss** — energy-functional residual on the current glacier inputs.
- **Anchor loss** (`retrain_anchor_weight`) — L2 distance between the current network weights and a snapshot of the pretrained weights, preventing large drift.
- **Replay data loss** (`retrain_replay_data_weight`) — supervised loss against a TFRecord dataset of reference velocity examples (requires `replay_data_dir`).
- **Replay physics loss** (`retrain_replay_phys_weight`) — physics residual evaluated on the replay samples.

Loss scales for the local and replay terms are normalised at the start of each retraining phase to prevent any single term from dominating.

!!! warning "Replay data"
    Note that replay terms are still being tested and the required tfrecord files used to train the offline emulator not yet available on the public version of IGM, pending publication.

## Module ordering

`field_inversion` must appear in the `assimilations` list. It initialises the `iceflow` forward model internally at startup (before the normal processes pass), so `iceflow` must also be present in `processes`.

```yaml
defaults:
  - override /assimilations:
    - field_inversion
  - override /processes:
    - iceflow
```

## Inputs

The module reads the following state fields at each call (they must have been initialised by other modules or loaded from file before `field_inversion.update` is called):

| Field | Description |
|-------|-------------|
| `usurf` | Surface elevation (m) |
| `thk` | Ice thickness (m) — also a control variable in the default config |
| `icemask` | Ice extent mask (1 = ice, 0 = no ice) |
| `uvelsurfobs` | Observed surface velocity, x-component (m yr⁻¹) |
| `vvelsurfobs` | Observed surface velocity, y-component (m yr⁻¹) |

Additional control variables (e.g. `tau_ref`, `arrhenius`) may be declared in `variables`; they are initialised from the relevant `iceflow` physics defaults.

!!! warning "observational data"
    It is important that observational data e.g. `uvelsurfobs` is defined as NaN where data is missing, not a real value e.g. 0.
## Output

At each write (iteration 0, then every `output.freq` accepted optimiser iterations), the module writes a NetCDF file `optimize.nc` containing:

- The 2D fields listed in `output.vars_to_save`. The computed quantities `velbase_mag`, `velsurf_mag`, `velsurfobs_mag`, and `sliding_ratio` are derived automatically when requested.
- Cost-function diagnostics: total cost, data misfit, regularization cost, and the full per-iteration cost history up to that snapshot.
- The current `retrain_iter_num` counter.

## Example usage

### Minimal inversion for ice thickness

```yaml
defaults:
  - override /assimilations:
    - field_inversion
  - override /processes:
    - iceflow

assimilations:
  field_inversion:
    optimization:
      nbitmax: 1000
      minimizer_patience: 20
    output:
      freq: 200
      vars_to_save: [usurf, thk, icemask, velsurf_mag, velsurfobs_mag]
    variables:
      - { name: thk, transform: identity, lower_bound: 0.0, upper_bound: 1000.0, mask: icemask }
    objective:
      misfit:
        - { name: velsurf, kind: gaussian, components: [uvelsurf, vvelsurf],
            obs: [uvelsurfobs, vvelsurfobs], std: 1.0 }
      regularization:
        - { name: thk, penalty: squared_laplacian, lam: 100000.0 }
```

### Inversion with emulator retraining

```yaml
assimilations:
  field_inversion:
    optimization:
      nbitmax: 1000
      minimizer_patience: 20
      retrain_iter: 5
      retrain_lr: 1.0e-5
      retrain_steps: 500
      retrain_anchor_weight: 0.01
    variables:
      - { name: thk, transform: identity, lower_bound: 0.0, upper_bound: 1000.0, mask: icemask }
    objective:
      misfit:
        - { name: velsurf, kind: gaussian, components: [uvelsurf, vvelsurf],
            obs: [uvelsurfobs, vvelsurfobs], std: 1.0 }
      regularization:
        - { name: thk, penalty: squared_laplacian, lam: 100000.0 }
```


## Parameters

The complete default configuration file can be found here: [field_inversion.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/assimilations/field_inversion.yaml).

{% set config = load_yaml('../igm/conf/assimilations/field_inversion.yaml') %}
{% set help = load_yaml('../igm/conf_help/assimilations/field_inversion.yaml') %}
{% set header = load_yaml('../igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_tree.j2" %}

{{ render_contributors("field_inversion") }}
