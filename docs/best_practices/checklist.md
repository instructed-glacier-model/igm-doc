# Best Practices Checklist

IGM implements empirical physical laws with a range of approximations. The checklist below helps you avoid common pitfalls and ensures your results are reliable before publication.

!!! warning "Interpret results with care"
    IGM is an approximation of a highly complex physical system. No model output should be taken at face value without a basic sanity check.

---

## Numerical stability

- [ ] **Check for border artefacts.** If ice accumulates unrealistically on the domain edges, set `exclude_borders_from_iceflow: True` in the `iceflow` configuration.
- [ ] **Verify CFL stability.** Reduce the `CFL` parameter if you see oscillations, waves, or sudden thickness spikes. A value below 0.5 is typically safe.
- [ ] **Vary `nbit`.** The number of iceflow solver iterations (`nbit`) controls accuracy vs. speed. Check that your results do not change significantly when you double `nbit`.
- [ ] **Check the time-step size.** Examine `dt` in the output time series. Very small adaptive steps may indicate near-instability.

---

## Physical plausibility

- [ ] **Volume and area time series.** Plot total ice volume and area over time. Abrupt jumps or monotonic growth to unrealistic values are red flags.
- [ ] **Mass balance.** Confirm the chosen SMB module is appropriate for your application (elevation-dependent `smb_simple`, OGGM-calibrated `smb_oggm`, or explicit snowpack `smb_accpdd`).
- [ ] **Ice velocity.** Compare modelled surface velocities against observations where available. Values exceeding a few km yr⁻¹ for alpine glaciers are unusual.
- [ ] **Bed topography.** Verify that `topg` (bedrock) is physically reasonable. Errors in the bed are the most common source of unrealistic dynamics.

---

## Parameter sensitivity

- [ ] **Sensitivity to physical parameters.** Use Hydra multirun to test key parameters such as the Arrhenius factor, sliding coefficient, or ELA gradient:

    ```bash
    igm_run +experiment=params \
      processes.smb_simple.grad_abl=0.005,0.007,0.009 \
      --multirun
    ```

- [ ] **Sensitivity to initial conditions.** If you are initialising from observations via data assimilation, check how sensitive projections are to the initial ice thickness.
- [ ] **Iceflow method.** If using the emulated solver, run at least one short test with `method: solved` (or `unified`) to confirm the emulator is not introducing significant error for your domain.

---

## Reproducibility

- [ ] **Record the configuration.** Every run saves its full resolved configuration in `.hydra/config.yaml`. Keep this file with your results.
- [ ] **Record the IGM version.** Log the commit hash printed at startup, or note the version installed via pip (`pip show igm`).
- [ ] **Use version-controlled params.** Keep your `params.yaml` in a git repository alongside the analysis scripts.

---

## Before publishing

- [ ] Verify results against at least one independent observable (e.g. observed retreat, geodetic mass balance, surface velocities).
- [ ] Document which IGM version and which modules were used.
- [ ] Cite the model development paper — see [Cite IGM](../about/cite.md).
