# Module `oggm_shop`

This IGM module utilizes OGGM utilities and the GlaThiDa dataset to prepare data for the IGM model for a specific glacier given its RGI ID (parameter `RGI_ID`). You can check the [GLIMS Viewer](https://www.glims.org/maps/glims) to find the RGI ID of your glacier. By default, IGM references RGI 7.0C, which can be found [here](https://nsidc.org/data/nsidc-0770/versions/7). Altering the `RGI_product` parameter ('C' for glacier complex or 'G' for individual glacier) allows you to switch between these options. By default, data is preprocessed (`preprocess` parameter is set to True) with a spatial resolution of 100 meters and a border size of 30 meters. To customize the spatial resolution and the size of the 'border' to maintain a safe distance from the glacier margin, you need to set the `preprocess` parameter to False, and then set the `dx` and `border` parameters as desired. 

When this module is executed, it automatically downloads a suite of data (refer to the table above) associated with the specified glacier (individual or complex). These data are stored in a directory named after the RGI ID within the `data` folder. Subsequently, a file named `input.nc` is created, containing the relevant variables renamed according to IGM's naming conventions.

**Important:** The `oggm_shop` module must be followed by the `local` inputs module, which reads `data/input.nc` and loads the 2D gridded variables as TensorFlow objects in IGM.

If IGM is run a second time, it will not re-download the OGGM data or recreate `data/input.nc` as long as the data remain in the `data` folder. This is particularly useful for parameter analysis, as it avoids redundant data downloads during multiple runs. The `oggm_shop` module provides all the necessary data variables required to run IGM for forward glacier evolution simulations, assuming the availability of basal topography (`topg`) and ice thickness (`thk`). 

Additionally, it supports preliminary data assimilation and inverse modeling tasks within the `iceflow` module. These tasks typically involve variables such as `icemaskobs`, `thkinit`, `uvelsurf`, `vvelsurf`, `thkobs`, and `usurfobs`.

Data available via the shop are listed in the table below. Users can specify the source for ice thickness using the `thk_source` parameter (options: `millan_ice_thickness` or `consensus_ice_thickness` dataset) and for ice velocities using the `vel_source` parameter (options: `millan_ice_velocity` or `its_live` dataset).

Set `include_glathida` to True to retrieve the GlaThiDa ice thickness profiles for data assimilation purpose. When using RGI 6.0, these profiles are sourced from the [GlaThiDa repository](https://gitlab.com/wgms/glathida). For RGI 7.0, GlaThiDa data specific to the glacier, identified by its RGI ID, are retrieved from the OGGM server. These data are saved as a text file named `glathida_data.csv` in the module's download directory. In both cases, the data are read, rasterized with the label `thkobs`, and any pixels lacking observations are marked with NaN values.

| Variable              | Reference                              |
|-----------------------|----------------------------------------|
| Ice thickness profile | GlaThiDa                               |
|-----------------------|----------------------------------------|
| Surface DEM           | Copernicus DEM GLO-90                  |
| Ice thickness         | Millan et al. (2022)                   |
| Ice thickness         | Farinotti et al. (2019)                |
| Surface ice speeds    | Millan et al. (2022)                   |
| Surface ice speeds    | [its-live.jpl.nasa.gov](https://its-live.jpl.nasa.gov) |
| Glacier mask          | Randolph Glacier Inventory             |
| Ice thickness profile | GlaThiDa                               |
| Glacier change        | Hugonnet et al. (2021)                 |
| Climate data          | GSWP3_W5E5                             |
| Flowline              | OGGM                                   |

**Table:** Products available with the `oggm_shop` module.

The module depends (of course) on the `oggm` library. Unfortunately the module works on linux and Max, but not on windows (unless using WSL).

**Contributors:** F. Maussion, G. Jouvet, E. Welty (GlaThiDa-related code), S. Cook (RGI 7.0 modifications).

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/inputs/oggm_shop.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/inputs/oggm_shop.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/inputs/oggm_shop.yaml') %}
{% set header = load_yaml('igm/igm/conf_help/header.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

<table>
  <thead>
    <tr>
      <th>Name</th>
      {% for key in header %}
      <th>{{ key }}</th>
      {% endfor %}
      <th>Default Value</th>
    </tr>
  </thead>
  <tbody>
    {% for key, value in module.items() %}
    <tr>
      <td>{{ key }}</td>
      <td>{{ module_help[key].Type}}</td>
      <td>{{ module_help[key].Units}}</td>
      <td>{{ module_help[key].Description}}</td>

      <td>{{ value }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>

<script type="text/javascript">
  MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
</script>

## Example Usage