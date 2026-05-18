# Module `calving_rate`

{{ render_module_io("calving_rate") }}

The `calving_rate` module computes the **calving rate** at tidewater or lake-terminating glacier fronts. The computed rate is then used by the `thk` module to remove mass at the ice front.

Four parameterisations are available, selected via the `law` parameter:

| Law | Formula | Reference |
|---|---|---|
| `zero` | $c = 0$ | No calving |
| `water_depth` | $c = k \cdot D_w$ | Brown, Meier & Post (1982) |
| `eigen` | $c = K_2 \cdot \max(e_1, 0) \cdot \max(e_2, 0)$ | Levermann et al. (2012) |
| `thickness_threshold` | $c = c_{max}$ where $H < H_{cr}$ | Threshold-based |

where $D_w$ is the water depth, $e_1$ and $e_2$ are the principal strain rates, and $H_{cr}$ is a critical thickness threshold.

## Parameters

Default configuration file ([calving_rate.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/processes/calving_rate.yaml)):

~~~yaml
{% include  "../../../../igm/conf/processes/calving_rate.yaml" %}
~~~
