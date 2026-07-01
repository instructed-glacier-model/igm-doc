# Migrating from IGM 3.1 to 3.2

IGM 3.2 is a large but mostly mechanical migration. The headline change is the
ice-flow engine: the old `emulated` mode is reworked into a cleaner, benchmarked
**`unified` stack**, now the default. Around it, the **physics config is regrouped
and renamed** (`sliding:` / `viscosity:`), assimilation modules move into a new
**`assimilations`** category, the `smb_*` / `climate_*` modules collapse into
umbrella **`smb`** / **`climate`**, **`enthalpy`** is split into standalone pieces,
and the whole thing now runs on **TensorFlow 2.17 / Keras 3**. Most existing setups
need only a handful of edits — this page lists them.


??? abstract "Migration at a glance — the checklist"
    - [ ] **Reinstall** in a TF 2.17 / Keras 3 environment (§1)
    - [ ] Move to the **`unified`** ice-flow stack (§2)
    - [ ] Rename friction scalar **`slidingco` → `tau_ref`** on unified (§3)
    - [ ] Optionally adopt new **sliding laws** — `budd`, `mohr_coulomb`, `regu_coulomb` (§4)
    - [ ] Apply the **`sliding:` / `viscosity:`** physics-key renames (§5)
    - [ ] Update **assimilation** module paths & changed defaults (§6–8)
    - [ ] Switch to umbrella **`smb` / `climate`** via `method:` (§9)
    - [ ] If you use **`enthalpy`**: add `subglacial_hydrology` + `arrhenius`, enable `vertical_velocity` (§10)

---

### 1. Reinstall IGM (now requires TensorFlow 2.17 / Keras 3)

**Do:** reinstall into a fresh environment with **TF ≥ 2.16 / Keras ≥ 3.12**
(`pip install -e .`). The old TF 2.15 / Keras 2 environment will now **fail at the
first ice-flow solve**.

??? note "Why — Keras 3 only"
    The new stack is tested **only** on TF ≥ 2.16 / Keras ≥ 3.12 and uses
    Keras-3-only APIs, so it cannot run on the previous environment. Reinstalling
    from `setup.py` pulls in the updated dependencies automatically.

### 2. Switch to the `unified` ice-flow stack

The former `emulated` mode has been reworked into a cleaner **`unified` stack**, now
the **default and recommended** way to run ice flow. A bare run (no `iceflow`
overrides) uses `unified` + a from-scratch `dahunet` emulator.

**Online vs. offline — same stack, two flavours.** `unified` minimises the *same*
Blatter–Pattyn energy but lets you choose how the velocity field is represented. In
the **online** flavour the network is trained *on-the-fly* within the time loop (like
a self-tuning solver) — flexible, tunable numerics, works for any ice flow. In the
**offline** flavour a network trained before *once for all* is used in inference only —
more reliable for data assimilation, but limited to the fixed, existing
pre-trained emulators (best for "standard" mountain glaciers). For now both give
roughly similar accuracy and performance; pick offline if you want a fixed emulator
and clean assimilation, online if you want full control over the numerics.

**Try both on Aletsch.** The `igm-examples/aletsch` tutorial lets you switch between
the two with a single defaults entry:

```yaml
defaults:
  - common: iceflow_offline   # or: iceflow_online
```

where `common/iceflow_offline.yaml` (resp. `iceflow_online.yaml`) ships the
recommended parameters for each flavour — the easiest way to compare them on a real
glacier.

**Do (recommended):** move to `unified` and update the emulator parameters per §3–5.
**Do (temporary fallback):** to keep the old behaviour, pin
`iceflow.method: emulated`, `iceflow.numerics.Nz: 10`, and `physics.sliding.u_ref: 1.0`.

!!! warning "Legacy modes are deprecated"
    `emulated` and `solved` are kept for backward compatibility only and **will be
    removed in a future version**. Please migrate to `unified`.

??? note "What changes by default (you shouldn't need to touch these)"
    The from-scratch defaults were tuned to maximize accuracy while minimizing
    compute time, so a standard run needs no manual tuning. In short:

    | Parameter | Old (`emulated`) | New (`unified` / `dahunet`) |
    |---|---|---|
    | `iceflow.method` | `emulated` | `unified` |
    | `numerics.Nz` | 10 | 4 |
    | network | (cnn) | `dahunet` (cnn backend, residual) |
    | `nb_out_filter` | 32 | 24 |
    | `nb_layers` | 8 | 6 |
    | `conv_ker_size` | — | 3 |
    | `nbit_init` | 500 | 300 |
    | `nbit` | 1 | 5 |
    | `retrain_freq` | 1 | 5 |
    | `adam.lr_init` | 1.0e-03 | 2.0e-03 |
    | `adam.lr` | 5.0e-04 | 5.0e-04 (unchanged) |

    Network knobs now live under `unified.network.params`; the friction control is
    `tau_ref` instead of `slidingco` (see §3–5).

### 3. Friction scalar `slidingco` → `tau_ref` (unified stack only)

**Do:** on the **unified** stack, rename `sliding.slidingco` → `sliding.tau_ref`. 
Leave `slidingco` as-is on the legacy stack.

`tau_ref` *is* the old `slidingco`, just renamed and given physical meaning: it is
the basal shear stress (in MPa) needed to reach the reference sliding speed `u_ref`.
The 3.2 unified default reads *"≈2 bar of basal shear stress drives 100 m/yr of
sliding"* (`u_ref = 100 m/yr`, `tau_ref ≈ 0.215 MPa`) — physically identical to the
3.1 default (`u_ref = 1`, `slidingco = 0.0464`).

??? note "The maths: why `tau_ref` / `u_ref`, and how to convert"
    The Weertman sliding law is now written in reference-point form

    ```
    tau_b = tau_ref · (|u_b| / u_ref)^(1/m)
    ```

    where `m` is `sliding.exponent` (= 3, the classic Weertman exponent in
    `u_b ∝ tau_b^m`). The drag multiplying `u_b^(1/m)` is `C = tau_ref / u_ref^(1/m)`.

    There is **no nonlinear transformation** between old and new: `slidingco` was
    already defined at an implicit `u_ref = 1`, i.e. `slidingco = C`. So at the
    default `u_ref = 1`:

    ```
    tau_ref = slidingco            (both in MPa, u_ref = 1)
    ```

    To keep **identical physics** while moving `u_ref` to a meaningful reference
    speed `U₀`, hold `C` fixed and rescale:

    ```
    tau_ref(U₀) = slidingco · U₀^(1/m)
    ```

    So `(u_ref, tau_ref)` is just a re-parameterisation of `slidingco` into two
    physically interpretable quantities — directly comparable across sliding laws,
    unlike the abstract coefficient `C` whose units depend on `m`. The 3.2 unified
    default `u_ref = 100`, `tau_ref = 0.0464 · 100^(1/3) ≈ 0.215 MPa` is exactly
    equivalent (same drag `C`) to the 3.1 default.


!!! info "`u_ref` is unified-only"
    The legacy emulated/solved stack uses `slidingco` directly as the drag
    at an implicit `u_ref = 1`. Running those methods with any other `u_ref` is
    **refused at startup** — keep `processes.iceflow.physics.sliding.u_ref: 1.0`.

### 4. New sliding laws: `budd`, `mohr_coulomb`, `regu_coulomb`

**Opt-in — no action needed if you stay on `weertman`.** Three
effective-pressure-dependent sliding laws were added, selectable via `sliding.law`.
All consume `state.effective_pressure` (see §10, `subglacial_hydrology`).

??? note "The three new laws"
    - **`budd`** — adds a `q_exponent` for sublinear effective-pressure dependence.
    - **`mohr_coulomb`** — `N·tan(phi)` reference shear stress, with an optional
      bed-elevation-dependent friction angle.
    - **`regu_coulomb`** — a regularised Coulomb law.

### 5. Physics keys regrouped under `sliding:` / `viscosity:`

Glen viscosity parameters and the per-law sliding parameters are regrouped under
`viscosity:` and `sliding:`. The per-law sub-blocks (`weertman:`, `coulomb:`,
`budd:`, `mohr_coulomb:`) under `sliding:` **no longer exist** — their keys move one
level up under `sliding:` directly, and only the keys matching your chosen
`sliding.law` are read.

**Do:** apply the renames (full table below). Old keys **hard-fail at startup** with
a message naming the replacement — the change is purely cosmetic (same physics,
values, and units).

```yaml
processes:
  iceflow:
    physics:
      sliding:
        law: weertman
        tau_ref: 0.215     # unified at u_ref=100 (legacy: slidingco: 0.0464 at u_ref=1)
        exponent: 3.0
        u_ref: 100.0       # unified only; legacy requires u_ref: 1.0
      viscosity:
        arrhenius: 78.0
        enhancement_factor: 1.0
        exponent: 3.0
```

??? note "Full old → new key mapping"
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

### 6. Assimilation modules move to a new `assimilations` category

The former `data_assimilation` module was misplaced in `processes`. Assimilation
modules now live in their own **`assimilations`** category. `data_assimilation` was
rewritten & improved into a new module, **`field_inversion`** (§7); the legacy
`data_assimilation` also moves to `assimilations` (deprecated, removed long-term).
The category also hosts the new modules `time_relaxation` (§8) and `pretraining`.

**Do:** update the module paths to `assimilations`. If you relied on legacy
`data_assimilation` defaults, note that five changed in 3.2 — set them explicitly.

??? note "Changed legacy `data_assimilation` defaults"
    | Parameter | Section | Old default | New default |
    |-----------|---------|-------------|-------------|
    | `retrain_iceflow_model` | `optimization` | `true` | `false` |
    | `fix_opti_normalization_issue` | `optimization` | `false` | `true` |
    | `obstacle_constraint` | `optimization` | `[reproject, penalty]` | `[reproject]` |
    | `smooth_anisotropy_factor` | `regularization` | `0.2` | `1.0` |
    | `convexity_weight` | `regularization` | `0.002` | `0.0` |

### 7. New module `field_inversion` (overhauled `data_assimilation`)

Infers control fields (by default `thk`, with bounds and an `icemask`) by minimising
a misfit-plus-regularisation objective — e.g. a Gaussian surface-velocity misfit
(`uvelsurfobs` / `vvelsurfobs`) plus a squared-Laplacian smoothness penalty on the
thickness. See its module doc for details.

### 8. New module `time_relaxation`

Data assimilation by **time relaxation** (e.g. Frank & van Pelt): the forward model
is run forward in time and, each step, control fields (`smb`, `topg`, `thk`,
`slidingco`/`tau_ref`, …) are nudged toward observations, so the modelled state
relaxes to the observed targets while staying dynamically consistent. See its module
doc for details.

### 9. `smb_simple` / `clim_*` → umbrella `smb` / `climate`

The individual `smb_*` and `climate_*` modules were merged into single umbrella
modules; you select the implementation via `method:`.

**Do:** replace the individual modules with `smb` / `climate` and set `method:`:

- `smb` → `simple` / `oggm` / `accpdd`
- `climate` → `simple` / `oggm` / `glacialindex` / `station`

### 10. `enthalpy` users: several pieces split out

Several pieces formerly bundled in `enthalpy` were split out or changed. **If you run
`enthalpy`, apply all four changes below.**

**Do (summary):** add `subglacial_hydrology` and `arrhenius` to your process list,
remove `vert_flow` and set `iceflow.vertical_velocity.enabled: true`, and re-add
`T` / `omega` to your outputs if you need them.

??? note "The four changes in detail"
    1. **Subglacial hydrology / effective pressure** — moved out of `enthalpy` into a
       dedicated `subglacial_hydrology` module (which also adds simpler
       effective-pressure parametrisations, e.g. a percentage of the ice column). It
       still returns `state.effective_pressure` (usable with the Budd sliding law).
       **Do:** add `subglacial_hydrology` and pick a `mode:` (e.g. `till_storage`).
    2. **Vertical velocity** — the former `vert_flow` module was removed and folded
       into `iceflow`; it is required to run `enthalpy` (and for particle tracking
       with the 3D-velocity option). **Do:** remove `vert_flow` and set
       `iceflow.vertical_velocity.enabled: true`.
    3. **Arrhenius** — the temperature-dependent rate-factor update (formerly inside
       `enthalpy`) is now a standalone `arrhenius` process. **Do:** add `arrhenius`
       to your process list.
    4. **Output defaults** — `enthalpy` diagnostics were simplified: `T` (temperature)
       and `omega` (water content) are **no longer saved by default** (diagnostic
       variables are now opt-in), and `enthalpy` now also publishes `temppasurf` /
       `temppabase` on state. **Do:** if your post-processing needs `T` / `omega`, add
       them explicitly to your output variable list.

