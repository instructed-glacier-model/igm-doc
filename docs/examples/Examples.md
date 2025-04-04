# Examples

Once IGM is installed, it is time to make your first runs. The best and quickest way to get to know IGM is to run given examples. For that, you may download dedicated IGM examples or run the `quick-demo` presented hereafter if you want to go faster.

## IGM examples

Download the following repository that contains a gallery of ready-to-run setups (incl. parameter file, data, user modules if any), check at individual instructions:

```bash
git clone https://github.com/instructed-glacier-model/igm-examples
```

Then, you may simply run the command `igm_run +experiment=params` (or replace `params` with the actual name of your parameter file) in the corresponding folder to execute the example.

## Quick demo

Copy and paste the following YAML parameter file (name it `params.yaml`), place it in a folder named `experiment`, and then run the command `igm_run +experiment=params`. This will model the Glacier with RGI ID `RGI60-11.01450` (the Great Aletsch Glacier, Switzerland) from 2020 to 2100, assuming a temperature increase of 4 degrees by 2100 relative to 1960–1990. 

The run will:
1. Use the `oggm_shop` module to download all necessary data via OGGM.
2. Execute a forward model combining the OGGM-based SMB model and the IGM-based ice flow model.
3. Write and plot the results in real time.

**Warning:** This setup is provided as an example and has not been validated against historical data. It should not be interpreted as a scientifically accurate simulation. After running this example, you can explore different glaciers by selecting a different ID (refer to the [GLIMS Viewer](https://www.glims.org/maps/glims)), modify parameters, or experiment with additional modules.

```yaml title="params.yaml"
# @package _global_

defaults:
  - override /inputs: 
    - oggm_shop
    - local
  - override /processes: 
    - clim_oggm
    - smb_oggm
    - iceflow
    - time
    - thk
  - override /outputs: 
    - write_ncdf
    - plot2d

inputs:
  oggm_shop:
    RGI_ID: "RGI60-11.01450"
    RGI_version: 6

processes:
  clim_oggm:
    clim_trend_array: 
      - ["time", "delta_temp", "prec_scal"]
      - [ 2020,           0.0,         1.0]
      - [ 2100,           4.0,         1.0]
  iceflow:
    physics:
      init_slidingco: 0.25
  time:
    start: 2200.0
    end: 2100.0
    save: 10.0

outputs:
  plot2d:
    live: true
```
 