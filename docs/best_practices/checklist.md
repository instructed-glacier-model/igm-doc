# Best Practices Checklist

The checklist below helps you avoid common pitfalls before finalising your study.

---

## Numerical stability

- [ ] **Verify CFL stability and time-step size.** Reduce the `CFL` parameter if you see oscillations, waves, or sudden thickness spikes (a value below 0.5 is typically safe). Also examine `dt` in the output: very small adaptive time steps can indicate near-instability. See [Numerical Tips](numerical_tips.md#time-stepping-and-the-cfl-condition) for details.
- [ ] **Vary solver settings.** Check that results do not change significantly when you double `nbit` (iceflow solver iterations). If using the network emulator with periodic re-training, also test sensitivity to the retrain frequency and learning rate — these three interact.
- [ ] **Validate the iceflow solver.** If using `mapping: network`, run at least one short test with `mapping: identity` to confirm the emulator is not introducing significant error for your domain. Note that `lr` / `lr_init` differ substantially between the two (~0.9 for `identity`, ~1e-5–1e-3 for `network`) — see [Numerical Tips](numerical_tips.md#iceflow-solver-modes) for guidance.

---

## Physical plausibility

- [ ] **Volume and area time series.** Plot total ice volume and area over time. Abrupt jumps or monotonic growth to unrealistic values are red flags.
- [ ] **Mass balance.** Confirm the chosen SMB module is appropriate for your application — see the [FAQ](faq.md) for a quick comparison of `smb_simple`, `smb_oggm`, and `smb_accpdd`.
- [ ] **Ice velocity.** Compare modelled surface velocities against observations where available. Values exceeding a few km yr⁻¹ for alpine glaciers are unusual.

---

## Data assimilation *(if applicable)*

- [ ] **Cost function convergence.** Residuals should decrease monotonically (at least on average). A stalling or erratic cost function often points to a learning rate or regularisation issue.
- [ ] **Regularisation.** Apply regularisation (e.g. `regu_slidingco`, `regu_arrhenius`) to avoid over-fitting noisy observations — verify that inferred fields are physically smooth.
- [ ] **Inversion step count.** A modest number of inversion steps is usually sufficient for a good initialisation; the forward simulation is more sensitive to the initial geometry than to the exact inversion accuracy.

See [Numerical Tips](numerical_tips.md#data-assimilation-and-inversion) for deeper guidance, including scalar parameter calibration with Hydra + Optuna.

---

## Parameter sensitivity

- [ ] **Sensitivity to physical parameters.** Use Hydra multirun to test key parameters such as the Arrhenius factor, sliding coefficient, or ELA gradient:

    ```bash
    igm_run +experiment=params \
      processes.smb_simple.grad_abl=0.005,0.007,0.009 \
      --multirun
    ```

- [ ] **Sensitivity to initial conditions.** If initialising from observations via data assimilation, check how sensitive projections are to the initial ice thickness.
- [ ] **Run multiple times.** Due to the stochastic nature of neural-network training (random weight initialisation, mini-batch sampling), results can vary between runs. Repeat the simulation at least a few times and verify that key outputs (volume, velocities) are consistent across runs.

---

## Reproducibility

- [ ] **Record the configuration.** Every run saves its full resolved configuration in `.hydra/config.yaml`. Keep this file with your results.
- [ ] **Record the IGM version.** Log the commit hash printed at startup, or note the version installed via pip (`pip show igm`).
- [ ] **Use version-controlled params.** Keep your `params.yaml` in a git repository alongside the analysis scripts.

---

## Before finalising your study

- [ ] Document which IGM version and which modules were used.
- [ ] Cite the relevant IGM references — see [Citing IGM](../about/cite.md).
