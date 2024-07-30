# Setup

``` yaml title="config.yaml"
modules_preproc:
  - load_ncdf
modules_process:
  - smb_simple
  - iceflow
  - time
  - thk
  - vert_flow
  - particles
modules_postproc:
  - write_ncdf
  - plot2d
  - print_info
  - print_comp
smb_simple_array:
  - ["time", "gradabl", "gradacc", "ela", "accmax"]
  - [1900, 0.009, 0.005, 2800, 2.0]
  - [2000, 0.009, 0.005, 2900, 2.0]
  - [2100, 0.009, 0.005, 3300, 2.0]
time_start: 1900.0
time_end: 2000.0
url_data: https://www.dropbox.com/scl/fo/kd7dix5j1tm75nj941pvi/h?rlkey=q7jtmf9yn3a970cqygdwne25j&dl=0
lncd_input_file: data/input.nc
plt2d_live: true
time_save: 10.0
```
