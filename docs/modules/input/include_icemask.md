# include_icemask

This IGM module loads a shapefile (ESRI shapefile) and creates an ice mask from it.
The shapefile can be either the coordinates where there should be no glacier (default)
or where there should be glaciers (`mask_invert` = True). 

Input: Shapefile (.shp) exported from any GIS program (e.g. QGIS).
Output: state.icemask

This module can be used with any igm setup that calculates the new glacier surface via the `state.smb` variable.
    For example add to `smb_simple.py`:

```python
    # if an icemask exists, then force negative smb
    if hasattr(state, "icemask")
        state.smb = tf.where((state.smb<0)|(state.icemask>0.5),state.smb,-10)
```

Add this module in the list of "modules_preproc" after loading the topography input.

The input can be one or more polygon features. Sometimes it is easier to select the valley where the glacier should be (`mask_invert` = True)
or draw polygons where the glacier should not be (e.g. side valleys with no further interest).

IMPORTANT: Be aware of the coordinate system used in the nc file and the shapefile.

Author: Andreas Henz, andreas.henz@geo.uzh.ch  (06.09.2023)

## Config Structure  

~~~yaml
{% include "../../../igm/igm/conf/input/include_icemask.yaml" %}
~~~

## Arguments
Here we store a table with

{{ read_raw("../../../igm/igm/conf_help/input/include_icemask.md") }}

## Example Usage