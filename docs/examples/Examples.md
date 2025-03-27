# Examples

Once IGM is installed, it is time to make your first runs. The best and quickest way to get to know IGM is to run given examples. For that, you may run the `quick-demo` presented hereafter, or download the following repository that contains an gallery of ready-to-run setups (incl. parameter file, data, user modules if any), check at individual instructions:

```bash
git clone https://github.com/instructed-glacier-model/igm-examples
```

then you may simply run `igm_run +experiment=params` (or adapt `params` to the name of the file) in each folder to run the example.

## Quick demo

Copy paste the following YAML parameter file (named it `params.yaml`), put in a folder `experiment`, and then run the comand `igm_run +experiment=params`. By doing so, you will model Glacier with RGI ID `RGI60-11.01450` (the great Aletsch Glacier, Switzerland) from 2020 to 2100 assuming an increase of temperature of 4 degree by 2100 relative to 1960-1990. The run i) use module `oggm_shop` to download all the data via OGGM, ii) run a forward model that combine OGGM-based SMB model, and IGM-based iceflow, iii) write and plot the results in live time. **Warning:** this setup is just an example, that should not be intepreted (as it has not been validated against past period). After running, this example, you may explore different glaciers picking a different ID (check the [GLIMS Viewer](https://www.glims.org/maps/glims)), explore different parameters, explore additional modules, ...

```yaml title="params.yaml"
# @package _global_

defaults:
  - override /inputs: 
    - oggm_shop
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
    iceflow:
      init_slidingco: 0.25
  time:
    start: 2200.0
    end: 2100.0
    save: 10.0

outputs:
  plot2d:
    live: true
```
 