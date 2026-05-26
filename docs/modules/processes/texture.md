# Module `texture`

This module generates photorealistic surface imagery from glacier state variables (ice thickness, velocity, surface elevation, and related fields) using a pre-trained [Pix2PixHD](https://github.com/NVIDIA/pix2pixHD) image-to-image neural network. The output is an RGB image saved as PNG or GeoTIFF at each time step, suitable for visualisation and for producing synthetic remote-sensing training data. Pre-trained model weights must be downloaded separately before use (a link is provided if the weights are not found at startup).
## Parameters

Default configuration file ([texture.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/texture.yaml)):
~~~yaml
{% include  "../../../../igm/conf/processes/texture.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/processes/texture.yaml') %}
{% set help = load_yaml('../igm/conf_help/processes/texture.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}

{{ render_contributors("texture") }}
