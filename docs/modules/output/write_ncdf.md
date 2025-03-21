# write_ncdf

This IGM module writes 2D field variables defined in the paramer list `wncd_vars_to_save` into the NetCDF output file given by parameter `wncd_output_file` (default output.nc). The saving frequency is given by parameter `time_save` defined in module `time`.

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/output/write_ncdf.yaml" %}
~~~

## Parameters

{{ read_raw( "../../../igm/igm/conf_help/output/write_ncdf.md") }}

## Example Usage