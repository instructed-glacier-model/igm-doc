# The pretrained ice-flow emulator (DahuNet)

!!! info "Brief summary"

    IGM ships a set of **pretrained neural ice-flow emulators** that predict higher-order
    (Blatter–Pattyn) horizontal velocities **in a single forward pass**, with **no
    glacier-specific retraining and no iterative solve**. They are trained offline on a
    large synthetic catalogue of mountain-glacier states, and their weights are then frozen.
    Because the training was done under a **fixed set of physical and numerical settings**,
    these emulators are only valid inside that regime — IGM enforces this automatically when
    the artifact is loaded. This page explains what the emulators are, how they were trained,
    what you must not change, and how to use them.

This page complements the [`iceflow`](../modules/processes/iceflow.md) module page, which describes the
underlying physics, discretization and optimization framework. Read that page first if you
are not already familiar with IGM's mapping concept.

---

## Three ways to get a velocity field

IGM's unified iceflow framework always solves the *same* problem: minimize the discretized
Blatter–Pattyn energy $\mathcal{J}_H$ over a mapping $\mathcal{M}$ that produces the
velocity degrees of freedom,

$$
\boldsymbol{\theta}^{*} = \arg\min_{\boldsymbol{\theta}}\;
\mathcal{J}_H\!\left[\mathcal{M}(\boldsymbol{\theta};\mathbf{Z}_H)\right],
\qquad
\mathbf{U}_H = \mathcal{M}(\boldsymbol{\theta}^{*};\mathbf{Z}_H).
$$

What differs between configurations is **what $\boldsymbol{\theta}$ is**, and **how often it
is re-optimized during a simulation**. This gives three practically distinct modes, which
are easy to confuse because two of them share `unified.mapping: network`.

| | **Identity mapping** | **Network mapping, retrained online** | **Network mapping, pretrained (offline)** |
|---|---|---|---|
| Config | `unified.mapping: identity` | `unified.mapping: network`<br>`network.pretrained: false` | `unified.mapping: network`<br>`network.pretrained: true`<br>`network.pretrained_path: dahunet_mini.keras` |
| $\boldsymbol{\theta}$ is | the velocity field itself | network weights | network weights |
| Optimized during the run? | **Yes** — every solve | **Yes** — every `retrain_freq` steps | **No** — weights frozen |
| Number of unknowns | grows with domain size | fixed (network size) | fixed (network size) |
| Needs training data? | no | no (self-supervised on $\mathcal{J}_H$) | already trained, offline |
| Accuracy | reference solution | good, but depends on optimizer settings | fixed; good inside the training regime |
| Cost per step | highest | intermediate | lowest (one forward pass) |
| Role | ground truth / verification | general-purpose solver | cheap drop-in for mountain glaciers |

!!! info "A fourth option: the legacy `pinnbp` emulators"

    IGM also still ships the older `pinnbp` emulators [@Jouvet2023], selected by setting
    `pretrained: true` with an **empty** `pretrained_path`. They remain supported and valid,
    but they are chosen from your configuration rather than by name, and they are designed to
    be **retrained online** rather than frozen. Everything below concerns the DahuNet
    emulators; the legacy ones are covered separately in the
    [appendix](#appendix-legacy-pinnbp-emulators).

!!! note "Terminology"

    Throughout, **emulator** means the network mapping evaluated at *fixed, offline-trained*
    weights. Where the same architecture is re-optimized during a simulation, we call it the
    **online neural solver** — that is a solver, not an emulator, even though the code path
    is the same.

### Identity mapping — the reference

$\boldsymbol{\theta}$ *is* $(\mathbf{u}_H,\mathbf{v}_H)$. Minimizing $\mathcal{J}_H$ is
therefore a direct solve in the full discrete velocity space, and gives the most accurate
solution available within a given discretization. This is what generated every training
target used by the emulators, and it is what you should compare against when validating a
new setup. It is also the slowest option, and the number of unknowns grows with the domain.

### Network mapping with online retraining

$\boldsymbol{\theta}$ are the network weights, optimized against the *same* discrete energy
during the simulation (the Deep Ritz idea [@E2018] as adapted to ice flow by
[@Jouvet2023]). The dimension of the optimization is fixed and much smaller than the number
of velocity DOFs, which is what makes it cheap relative to the identity mapping. The network
does not need to generalize: it is continually re-fitted to the glacier in front of it.

The cost is that retraining is not free and introduces user choices — `retrain_freq`,
`nbit`, learning rates, warm-up — that have to be tuned and validated. This is the mode
IGM's older `pinnbp` emulators are designed for: they are *pretrained starting points* that
are expected to keep being optimized during the run.

### Network mapping with a pretrained emulator — no retraining

$\boldsymbol{\theta}$ are held at the values $\widehat{\boldsymbol{\theta}}$ found once,
offline, across a large training catalogue. Applying the emulator to a new glacier requires
**no solve of either kind** — velocity is a single evaluation of a fixed differentiable
mapping. There are no optimizer settings to tune, because there is no optimizer.

The trade-off is that a fixed mapping **cannot specialize itself** to a state it handles
poorly. Everything therefore depends on the state being inside the distribution the emulator
was trained on — which is why the rest of this page is mostly about the boundaries of that
distribution.

---

## How the emulators were trained — in brief

The DahuNet emulators were trained offline, once, on a synthetic catalogue of **347,751
higher-order velocity solutions** generated with IGM itself. Synthetic glaciers were grown on
mostly ice-free mountain topography across five regions, spanning a wide range of grid
spacings, ice rheologies, basal resistances and climate histories; every training target was
then recomputed with the **identity mapping**, so the emulator is fit to reference
higher-order solutions rather than to another network's output. Training combined a
supervised velocity misfit with a variational penalty based on the same discretized
Blatter–Pattyn energy.

The practical consequence — and the only part that affects how you use the emulator — is
that the training catalogue defines a **regime of validity**, described in
[What you must not change](#what-you-must-not-change-and-why) and
[Validity envelope](#validity-envelope) below.

!!! tip "If you want the full story"

    The training-set construction, network architecture, hybrid objective and validation are
    described in full in the accompanying paper — see [Citation](#citation). To train your
    own emulator with the same machinery, see the
    [`pretraining`](../modules/assimilations/pretraining.md) module.

---

## Available pretrained emulators

Three DahuNet variants are bundled with IGM in
`igm/processes/iceflow/emulate/emulators/`. They share the same input representation,
$5\times5$ residual convolutions, and $N_z=2$ MOLHO/Q1 velocity basis, and differ only in
depth and width.

| Artifact | Depth (conv layers) | Filters/layer | Parameters | GPU mem. (inference)[^mem] |
|---|---|---|---|---|
| `dahunet.keras` | 12 | 64 | 1,234,703 | 125 MiB |
| **`dahunet_mini.keras`** *(recommended)* | 8 | 48 | 464,271 | 93 MiB |
| `dahunet_micro.keras` | 6 | 32 | 155,343 | 73 MiB |

[^mem]: Peak allocation for a single forward pass on a $256\times256$ grid, excluding fixed
runtime overhead.


---

## Using a pretrained emulator

A minimal configuration:

```yaml
processes:
  iceflow:
    method: unified
    numerics:
      Nz: 2
      basis_vertical: molho
      basis_horizontal: q1 
    physics:
      sliding:
        u_ref: 100.0
    unified:
      mapping: network
      inputs: [thk, usurf, arrhenius, tau_ref, dX]
      network:
        pretrained: true
        pretrained_path: dahunet_mini.keras
      nbit_init: 0
      nbit: 0
      retrain_freq: 0
```

!!! danger "Defaults will not work unchanged"

    IGM's default `iceflow` configuration uses `Nz: 4`, `basis_vertical: Lagrange` and
    `basis_horizontal: central`. **All three must be overridden** as shown above, or the
    artifact will refuse to load. This is intentional — see below.

A bare filename in `pretrained_path` resolves to an emulator bundled with IGM; give a full
path to load your own artifact, with or without the trailing `emulator.keras`.

### Running it truly offline

The three settings `nbit_init: 0`, `nbit: 0` and `retrain_freq: 0` are what make the run
*offline*. Leaving them at their defaults will re-optimize the pretrained weights, which is a
different (and much more expensive) experiment:

- `retrain_freq: 0` disables periodic retraining during the simulation.
- `nbit: 0` makes any retraining that is still triggered a no-op.
- `nbit_init: 0` skips the initial optimization at model start-up.

If you leave retraining enabled, you are no longer using the emulator as characterized here,
and the accuracy and cost figures below do not apply.

### Input normalization

Do not set `unified.normalization` for a pretrained artifact. Normalization statistics are
stored **inside** the `.keras` file and are applied by the artifact itself; IGM detects the
pretrained path and skips the configured normalization layer entirely.

### Reading the load banner

On a successful load IGM prints a panel reporting the architecture, the input/output counts,
$N_z$, and the resolved artifact path. If you do not see it, the emulator was not loaded and
you are running something else.

---

## What you must not change, and why

A pretrained emulator is only meaningful together with the physics and discretization it was
trained under. The network learned a mapping *conditioned on* those settings; they are not
inputs it can adapt to. Changing one silently would produce velocities that look plausible
but are simply wrong — and the error would be invisible, because there is no residual to
inspect and no solver to fail to converge.

IGM therefore stores the training settings inside the artifact and validates them against
your configuration every time the emulator is loaded
(`igm/processes/iceflow/emulate/utils/artifacts.py`). Settings fall into two registries.

### Hard checks — mismatch raises an error

These change the physical or numerical problem the network was trained to represent, or the
meaning of its input and output channels. A mismatch aborts the run.

| Config path (relative to `processes.iceflow`) | Value in the bundled artifacts | Why it is locked |
|---|---|---|
| `numerics.Nz` | `2` | Sets the number of output channels ($2N_z = 4$ velocity DOFs per cell). |
| `numerics.basis_vertical` | `molho` | The outputs *are* MOLHO coefficients (basal motion + SIA shear); they mean nothing in a Lagrange basis. |
| `numerics.basis_horizontal` | `q1` | Sets the quadrature used to assemble $\mathcal{J}_H$ and hence the targets the network was fit to. |
| `physics.sliding.u_ref` | `100.0` | Fixes the units of `tau_ref`; the input channel scaling depends on it. |
| `unified.inputs` | `[thk, usurf, arrhenius, tau_ref, dX]` | Input channel **set and order** are part of the model contract. |
| `physics.ice_density` | `910.0` | Enters the driving stress and hence the energy the targets minimize. |
| `physics.gravity_cst` | `9.81` | Same. |
| `physics.energy_components` | `[viscosity, gravity, sliding]` | Which physics the targets contain (order is ignored; duplicates are not). |
| `physics.sliding.law` | `weertman` | A different sliding law is a different basal boundary condition. |
| `physics.sliding.exponent` | `3.0` | The Weertman exponent $m$; the sliding response is trained at $m=3$. |
| `physics.viscosity.exponent` | `3.0` | The Glen exponent $n$; the deformation response is trained at $n=3$. |
| `unified.network.output_scale` | `1.0` | Rescales network outputs; anything else rescales the velocities. |

### Warning checks — mismatch warns but continues

These are regularization and threshold parameters. They perturb the trained regime rather
than redefining it, so IGM issues a `UserWarning` and proceeds. Treat a warning as a reason
to validate against an identity-mapping run before trusting the results.

| Config path | Value in the bundled artifacts |
|---|---|
| `physics.sliding.regularization` | `1e-10` |
| `physics.viscosity.regularization` | `1e-5` |
| `physics.thr_ice_thk` | `0.1` m |
| `physics.min_sr` | `1e-20` |
| `physics.max_sr` | `1e+20` |

### What you *are* free to change

Everything the emulator takes as an **input field** is free, because it was varied during
training:

- **Ice thickness and surface elevation** — the evolving state.
- **Arrhenius factor** `physics.viscosity.arrhenius` — trained over 5–140 MPa$^{-3}$ a$^{-1}$.
- **Basal shear-stress scale** `physics.sliding.tau_ref` — trained over the equivalent of
  40–300 kPa.
- **Grid spacing** `dX` — trained over 50–250 m.

Everything outside the `iceflow` module — mass balance, climate forcing, time stepping,
output modules, and so on — is unaffected.

---

## Validity envelope

The checks above catch configuration mismatches. They **cannot** catch a glacier that simply
lies outside the training distribution, and you remain responsible for that. The emulator
should be read as a pretrained mapping over a sampled mountain-glacier state distribution,
not as a general ice-flow solver.

| Dimension | Trained range | Notes |
|---|---|---|
| Glacier type | Land-terminating mountain glaciers and ice caps | No calving, no floating ice, no marine boundary forcing |
| Horizontal grid spacing | 50–250 m | Not stored in the artifact and **not validated** — your responsibility |
| Ice rheology $A$ | 5–140 MPa$^{-3}$ a$^{-1}$, spatially uniform | Spatially variable fields are extrapolation |
| Basal resistance $\tau_{\mathrm{ref}}$ | 40–300 kPa, spatially uniform | Spatially variable fields are extrapolation |
| Boundary condition | Neumann / stress-free | |
| Thermomechanics | None | No coupling to [`enthalpy`](../modules/processes/enthalpy.md) during training |
| Basal hydrology | None | Basal melt was zero throughout |

!!! warning "Resolution is not checked automatically"

    Grid spacing is supplied to the network as an input channel `dX`, but it is **not**
    stored in the artifact and **not** validated at load time. Running at 500 m or 10 m will
    not raise an error; it will simply extrapolate. Stay within 50–250 m, or validate
    explicitly.

---

## Troubleshooting

**`Incompatible emulator artifact: ...`**
: One or more hard-checked settings differ from those the artifact was trained with. The
  message lists each path with both values. Change your configuration to match the artifact
  — not the other way around.

**`Missing emulator artifact settings: ...`**
: The artifact predates the compatibility metadata, or was exported without it. Re-export it
  from a current IGM, or train a new one.

**`UserWarning: Emulator artifact training differences: ...`**
: A soft-checked regularization or threshold differs. The run continues. Validate against an
  identity-mapping run before trusting the output.

**`Loading old-format pretrained emulator.`**
: Expected and harmless *if you meant it*: `pretrained: true` with an empty `pretrained_path`
  selects a [legacy `pinnbp` emulator](#appendix-legacy-pinnbp-emulators) chosen from your
  configuration. If you intended to load a DahuNet artifact, set `pretrained_path`
  explicitly — otherwise you are running a different emulator, with no compatibility
  validation.

**`No pretrained emulator found in the igm package with name <...>`**
: The legacy selection key built from your configuration matches no bundled emulator. Either
  set `pretrained_path` to a DahuNet artifact, or adjust `Nz` / `vert_spacing` /
  `emulator.network.*` to one of the [selectable combinations](#appendix-legacy-pinnbp-emulators).

**`No pretrained emulator selected. Starting from scratch.`**
: `pretrained: false`. You are training a network online, not using the offline emulator.

**Velocities look plausible but the glacier evolves strangely**
: Check that retraining really is disabled (`nbit_init`, `nbit`, `retrain_freq` all `0`), and
  that your domain is inside the [validity envelope](#validity-envelope) — especially grid
  spacing, which is not validated automatically.

---

## Citation

!!! warning "Placeholder — to be updated on publication"

    The DahuNet emulators are described in a manuscript currently in preparation /
    under review. **The citation below is a placeholder and will be replaced once the paper
    has a DOI.** Please check this page, or [Citing IGM](../about/cite.md), before
    submitting work that uses these emulators.

If you use any of the pretrained DahuNet emulators, please cite:

> Rosier, S. H. R., Gregov, T., Jouvet, G., & Vieli, A. (in prep.). **Cheap and accurate
> higher-order ice flow emulator for mountain glaciers.** *[journal]*, doi:`[TBD]`

{% raw %}
```bibtex
@article{DahuNet,
  author  = {Rosier, Sebastian H. R. and Gregov, Thomas and Jouvet, Guillaume and Vieli, Andreas},
  title   = {Cheap and accurate higher-order ice flow emulator for mountain glaciers},
  journal = {TBD},
  year    = {in prep.},
  doi     = {TBD},
}
```
{% endraw %}

Please also cite the [IGM model description](../about/cite.md) itself.

---

## Appendix: legacy `pinnbp` emulators

*This appendix is self-contained. None of the DahuNet guidance above — the bundled artifacts,
the compatibility checks, the validity envelope, or the offline `nbit: 0` recipe — applies to
the emulators described here.*

The DahuNet artifacts are not the only pretrained emulators IGM ships. A set of older
`pinnbp` emulators [@Jouvet2023] is still bundled and **still fully supported**. They are
selected by leaving `pretrained_path` empty:

```yaml
processes:
  iceflow:
    method: unified
    numerics:
      Nz: 10                  # part of the selection key — see below
      vert_spacing: 4.0       # part of the selection key
    unified:
      mapping: network
      network:
        pretrained: true
        pretrained_path: ""   # empty -> legacy pinnbp selection
```

### They are chosen by configuration, not by filename

This is the key difference from the DahuNet artifacts. You do not name a legacy emulator;
IGM **builds a directory name from your configuration** and looks for a bundled emulator
that matches:

```
pinnbp_{Nz}_{vert_spacing}_{architecture}_{nb_layers}_{nb_out_filter}_2_1_{a|e}
```

taken from `numerics.Nz`, `numerics.vert_spacing`, and `emulator.network.architecture`,
`.nb_layers`, `.nb_out_filter`. The trailing letter is `e` if `numerics.basis_vertical` is
Legendre and `a` otherwise. If no bundled emulator matches, the run aborts with
`No pretrained emulator found in the igm package with name <...>`.


### What is and is not checked

Legacy emulators predate the compatibility metadata, so **none of the hard or soft checks
[described above](#what-you-must-not-change-and-why) apply to them**. The only validation is that the input field names in
`fieldin.dat` match your configured inputs. Matching the physics and discretization the
emulator was trained under is therefore entirely your responsibility.

Note also that the bundled `pinnbp` emulators take **`slidingco`**, not `tau_ref`:

```
thk  usurf  arrhenius  slidingco  dX
```

They belong to the legacy friction parametrisation, which requires
`physics.sliding.u_ref: 1.0`. See the
[v3.1 → v3.2 migration guide](../about/transition-IGM-3.1-to-3.2.md).

!!! danger "Legacy emulators expect to be retrained"

    `pinnbp` emulators were designed as *pretrained starting points* for online retraining,
    not as frozen mappings. Do **not** apply the `nbit: 0` / `retrain_freq: 0` recipe above to
    them — used frozen they are substantially less accurate than when retrained, which is
    simply not their intended operating mode. Leave retraining enabled.

---

## See also

- [`iceflow`](../modules/processes/iceflow.md) — the ice-flow module: physics, discretization, mappings, optimizers.
- [`pretraining`](../modules/assimilations/pretraining.md) — train your own emulator on your own catalogue.
- [Citing IGM](../about/cite.md) — full reference list.
