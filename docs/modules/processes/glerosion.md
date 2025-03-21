# glerosion

This IGM module implements change in basal topography (due to glacial erosion). The bedrock is updated (with a frequency provided by parameter `glerosion_update_freq years`) assuming a power erosion law, i.e. the erosion rate is proportional (parameter `glerosion_cst`) to a power (parameter `glerosion_exp`) of the sliding velocity magnitude. 

By default, we use the parameters from
 
```
 Herman, F. et al., Erosion by an Alpine glacier. Science 350, 193-195, 2015.
```

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/modules/glerosion.yaml" %}
~~~

## Arguments
Here we store a table with

{{ read_raw( "../../../igm/igm/conf_help/modules/glerosion.md") }}

## Example Usage

Hi