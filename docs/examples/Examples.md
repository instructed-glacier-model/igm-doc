The best and quickest way to get to know IGM is to run given examples. Having IGM installed on your machine, you can simply run `igm_run` in a folder that contains the following parameter file `params.json`:

```json
{
  "modules_preproc": ["oggm_shop"],
  "modules_process": ["clim_oggm",
                      "smb_oggm",
                      "iceflow",
                      "time",
                      "thk"
                      ],
  "modules_postproc": ["write_ncdf",
                       "plot2d",
                       "print_info",
                       "print_comp"],
  "clim_oggm_clim_trend_array": [
                        ["time", "delta_temp", "prec_scal"],
                        [ 1900,           0.0,         1.0],
                        [ 2020,           0.0,         1.0],
                        [ 2100,           4.0,         1.0]
                                 ],
  "oggm_RGI_ID": "RGI60-11.01450",
  "time_start": 1800.0,
  "time_end": 2100.0,
  "plt2d_live": true,
  "iflo_init_slidingco": 0.25
}
```


You may run other ready-to-use examples in the folder `test/examples/` in the develop version, which contains input data and parameter files. To run the example, just go in each folder and run `igm_run` there. You have the following examples available:

<!-- You can do this with online Colab Notebook or locally on your machine:

* The easiest way is to run notebooks in [![Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/jouvetg/igm/), which offers free access to GPU. Advantageously, you don't have to install anything, all is done.

* If you have IGM installed on your machine, you may already run ready-to-use examples in the folder `examples/`, which contains input data and parameter files. To run the example, just go in each folder and run `igm_run` there. You have the following examples available:

-->

   - **quick-demo** provides a set-up to model any glacier given an RGI ID, with a OGGM-based climate forcing and SMB. 

   -  **quick-demo-mysmb** is like **quick-demo** but wirh a own user-defined SMB module / parametrization.

   - **aletsch-basic** provides a simple set-up for an advance-retreat simulation of the largest glacier of the European Alps -- Aletsch Glacier, Switzerland -- using a simple parametrization of the mass balance based on time-varying Equilibrium Line Altitudes (ELA).
 
   - **aletsch-1880-2100** gives the set-up to reproduce the [simulations](https://jouvetg.github.io/the-aletsch-glacier-module) of the Great Aletsch Glacier (Switzerland) in the [past](https://www.cambridge.org/core/journals/journal-of-glaciology/article/modelling-the-retreat-of-grosser-aletschgletscher-switzerland-in-a-changing-climate/C877413079F73C5FC6131FC7BC031B69) and in the [future](https://www.cambridge.org/core/journals/journal-of-glaciology/article/future-retreat-of-great-aletsch-glacier/EB46DC696E0AB9528168F42595EE23D9) based on the CH2018 climate scenarios and an accumulation/melt model.

   - **aletsch-invert** and **rhone-invert** gives an example of data assimilation with IGM (Warning: inverse modelling requires tuning parameters for each glacier). **rhone-invert** is the most advanced/recent setting.


   - **paleo-alps** consists of a simple set-up to run a paleo glacier model in the European Alps in paleo times with different catchments (lyon, ticino, rhine, linth glaciers) with IGM around the last glacial maximum (LGM, about 24 BP in the Alps).

   - **synthetic** permits to make simple numerical experiments with simple synthetic bedrock topographies.
 