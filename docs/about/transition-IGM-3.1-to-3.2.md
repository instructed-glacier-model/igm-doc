# Migrating to IGM 3.1 -> 3.2

> 📖 This document tells you **what to change in an existing setup** to run on 3.2.0.
> For an exhaustive, module-by-module list of *everything* that changed (including
> changes that need no action), see the full release notes in GitHub.

---

### 1. Environment: reinstall IGM (TensorFlow 2.17 / Keras 3 now required)
The new stack is tested **only on TF ≥ 2.16 / Keras ≥ 3.12** and uses Keras-3-only.
On the old TF 2.15 / Keras 2 env it now **fails at the first ice-flow solve**.
**Do:** reinstall IGM from `setup.py` (e.g. `pip install -e .`) in an environment with
TF 2.17 / Keras 3 — this pulls in the updated dependencies.

**Note:** that if you use a GPU with the blackwell architecture (like RTX 5090 or 6000), the only way to to use the Nvidia NGC docker container (the last one released is 25.02-tf2-py3, with tensorflow 2.17.0).

### 2. Switch to the `unified` ice-flow stack
The former `emulated` mode has been **reworked into a new, much cleaner `unified`
stack**, which is now the default and the recommended way to run ice flow. A bare run
(no `iceflow` overrides) now uses `unified` + a from-scratch `dahunet` emulator (the
default `numerics.Nz` also dropped 10 → 4).

The legacy `emulated` and `solved` modes are **kept for backward compatibility only**
and **will be removed in a future version** — please migrate to `unified`.

Switching modes also changes the **emulator parameters**: the network is now `dahunet`, 
its knobs live under `unified.network.params`, and the friction control
is `tau_ref` instead of `slidingco` (see steps 3–5).

**Do (recommended):** move to `unified` and update the emulator parameters per steps
3–5.
**Do (temporary fallback):** to keep the old behaviour for now, pin
`iceflow.method: emulated` and `iceflow.numerics.Nz: 10`.

**Default `unified` / `dahunet` emulator parameters.** The from-scratch defaults were
optimized to maximize accuracy while minimizing computational time, and you should not
need to touch them for a standard run. In short: the default `iceflow.method` is now
`unified` (was `emulated`) and `numerics.Nz` is `4` (was `10`); the `dahunet` network
(under `unified.network.params`) uses a `cnn` backend with `nb_out_filter: 24` (was 32),
`nb_layers: 6` (was 8), `conv_ker_size: 3` and residual connections; and the Adam
training schedule was retuned to fewer, periodic retraining steps — `nbit_init: 300`
(was 500), `nbit: 5` (was 1), `retrain_freq: 5` (was 1), `adam.lr_init: 2.0e-03`
(was 1.0e-03), `adam.lr: 5.0e-04` (unchanged).

### 3. Friction scalar `slidingco` → `tau_ref` (unified stack only)
**Do:** on the **unified** stack rename `sliding.slidingco` → `sliding.tau_ref`, and
the same under `unified.inputs`. Leave `slidingco` as-is on the legacy stack.

**Why `tau_ref` (with `u_ref`).** The Weertman/Budd sliding law is now written in a
reference-point form

```
tau_b = tau_ref · (|u_b| / u_ref)^(1/m)
```

where `m` is `sliding.exponent`. This is mathematically equivalent to the old
`u_b = slidingco · tau_b^m`, with

```
slidingco = u_ref / tau_ref^m
```

The pair `(u_ref, tau_ref)` is just a re-parameterisation of `slidingco` into two
physically interpretable quantities: **`tau_ref` is the basal shear stress (in MPa)
needed to produce the reference sliding velocity `u_ref`** — directly comparable across
sliding laws, unlike `slidingco` whose units depended on `m`.

By default `u_ref = 1 m/yr`, so `tau_ref` alone carries the calibration. The intended
use, though, is to **fix `u_ref` at a meaningful sliding speed** and read `tau_ref` as a
drag: e.g. `u_ref = 35 m/yr` with `tau_ref = 0.2 MPa` means *"2 bar of basal shear
stress is required to drive 35 m/yr of basal sliding"* (0.2 MPa = 2 bar).

### 4. New sliding laws (`budd`, `mohr_coulomb`, `regu_coulomb`)
Beyond `weertman`, three effective-pressure-dependent sliding laws were added and are
selectable via `sliding.law`: **`budd`** (with a `q_exponent` for sublinear
effective-pressure dependence, `1.0` = linear, `0.5` = Tsai), **`mohr_coulomb`**
(`N·tan(phi)` reference shear stress, with an optional bed-elevation-dependent friction
angle), and **`regu_coulomb`** (a regularised Coulomb law). All consume
`state.effective_pressure` (see the `subglacial_hydrology` step). These are opt-in — no
action needed if you stay on `weertman`.

### 5. Physics keys regrouped under `sliding:` / `viscosity:`
Glen viscosity parameters and the per-law sliding parameters are regrouped under
`viscosity:` and `sliding:`. The per-law sub-blocks (`weertman:`, `coulomb:`, `budd:`,
`mohr_coulomb:`) under `sliding:` no longer exist — their keys move one level up under
`sliding:` directly. Only the keys that apply to your chosen `sliding.law` are read.

**Do:** apply the renames below. Old keys hard-fail at startup with a message naming the
replacement — the change is purely cosmetic (same physics, values, and units).

| Old key | New key |
|---|---|
| `iceflow.physics.init_slidingco` | `iceflow.physics.sliding.slidingco` *(legacy stack)* |
| `iceflow.physics.init_slidingco` | `iceflow.physics.sliding.tau_ref` *(unified stack)* |
| `iceflow.physics.init_arrhenius` | `iceflow.physics.viscosity.arrhenius` |
| `iceflow.physics.enhancement_factor` | `iceflow.physics.viscosity.enhancement_factor` |
| `iceflow.physics.exp_glen` | `iceflow.physics.viscosity.exponent` |
| `iceflow.physics.regu_glen` | `iceflow.physics.viscosity.regularization` |
| `iceflow.physics.sliding.<law>.regu` | `iceflow.physics.sliding.regularization` |
| `iceflow.physics.sliding.<law>.exponent` | `iceflow.physics.sliding.exponent` |
| `iceflow.physics.sliding.<law>.u_ref` | `iceflow.physics.sliding.u_ref` |
| `iceflow.physics.sliding.budd.N_ref` | `iceflow.physics.sliding.N_ref` |
| `iceflow.physics.sliding.budd.q_exponent` | `iceflow.physics.sliding.q_exponent` |
| `iceflow.physics.sliding.coulomb.mu` | `iceflow.physics.sliding.mu` |

New yaml shape (example):

```yaml
processes:
  iceflow:
    physics:
      sliding:
        law: weertman
        slidingco: 0.0464 
        exponent: 3.0
        u_ref: 1.0
      viscosity:
        arrhenius: 78.0
        enhancement_factor: 1.0
        exponent: 3.0
```

### 6. New assimilation-type of modules to `/assimilations`
The former modules `data_assimilation` module was wrongly set in `processes`, while
other "assimilation" modules are expected to populate IGM. Therefore, it was decided
to split "assimilation" modules into a new category "assimilations". The "data_assimilation"
module has been completly rewritten & improved and is now 
in "assimilation", and was renamed `field_inversion`.
The former / legacy "data_assimilation" is left in processes for 
compat, but will be removed on the long term. Note that the "assimilation" also contains
new module such as  `time_relaxation` and `pretraining`.

### 7. New module `field_inversion` (overhauled `data_assimilation`)
It infers control fields (by default `thk`, with bounds
and an `icemask`) by minimising a misfit-plus-regularisation objective — e.g. a Gaussian
surface-velocity misfit (`uvelsurfobs`/`vvelsurfobs`) plus a squared-Laplacian smoothness
penalty on the thickness. Check its doc for more details.

### 8. New module `time_relaxation`
Data assimilation by **time relaxation** (e.g. Frank & van Pelt method): the forward model is
run forward in time and, each step, control fields (`smb`, `topg`, `thk`,
`slidingco`/`tau_ref`, …) are nudged toward observations so the modelled state relaxes to
the observed targets while staying dynamically consistent. Check its doc for more details.

### 9. `smb_simple` / `clim_*` → umbrella `smb` / `climate`
Former modules smb_* and climate_* were merged for simplicity, wahc one can be called
using their keyword method (s.t `simple`, `oggm` ...)
**Do:** replace the individual modules with the umbrella `smb` / `climate` modules and
select the implementation via `method:` (`simple`/`oggm`/`accpdd`,
`simple`/`oggm`/`glacialindex`/`station`).

### 10. `enthalpy` users
Several pieces formerly bundled in `enthalpy` were split out or changed. If you run
`enthalpy`, apply all of the following:

1. **Subglacial hydrology / effective pressure** — moved out of `enthalpy` into a
   dedicated `subglacial_hydrology` module (which also adds simpler effective-pressure
   parametrisations, e.g. a percentage of the ice column). It still returns
   `state.effective_pressure` (usable with the Budd sliding law). **Do:** add
   `subglacial_hydrology` and pick a `mode:` (e.g. `till_storage`).
2. **Vertical velocity** — the former `vert_flow` module was removed and folded into
   `iceflow`; it is required to run `enthalpy` (and for particle tracking with the
   3D-velocity option). **Do:** remove `vert_flow` and set
   `iceflow.vertical_velocity.enabled: true`.
3. **Arrhenius** — the temperature-dependent rate-factor update (formerly inside
   `enthalpy`) is now a standalone `arrhenius` process. **Do:** add `arrhenius` to your
   process list.
4. **Output defaults** — `enthalpy` diagnostics were simplified: `T` (temperature) and
   `omega` (water content) are **no longer saved by default** (diagnostic variables are
   now opt-in), and `enthalpy` now also publishes `temppasurf` / `temppabase` on state.
   **Do:** if your post-processing needs `T`/`omega`, add them explicitly to your output
   variable list.
