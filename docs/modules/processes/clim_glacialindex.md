# Module `clim_glacialindex`

Module `clim_glacialindex` loads two climate snapshots (associated with certain periods) and interpolates them using a climate signal and a glacial index approach [1]. It is suitable for paleo-glacier modeling.

For this purpose, we define a function GI (Glacier Index) that maps time $t$ to a scalar with two extreme states: one state ${\rm CL}_0$ with nearly no ice corresponding to GI=$0$, and one maximum state ${\rm CL}_1$ in terms of glacier extent corresponding to GI=$1$. The climate ${\rm CL}$ consists of a set of variables: mean temperature, temperature variability, mean precipitation, and lapse rate:

$${\rm CL}(t) =(T^{\rm mean}(t),T^{\rm std}(t),P^{\rm mean}(t), {\rm LR}(t)),$$

and is assumed to be a linear combination:

$${\rm CL}(t) = {\rm GI}(t) \times {\rm CL}_{\rm 1} (t) + (1-{\rm GI}(t)) \times {\rm CL}_{\rm 0} (t),$$

where the two climate states are:

$$\begin{align} {\rm CL}_0(t) & = ( T_0^{\rm mean}(t),T_0^{\rm std}(t),P_0^{\rm mean}(t), {\rm LR}_0(t)), \\
{\rm CL}_1(t) & = ( T_1^{\rm mean}(t),T_1^{\rm std}(t),P_1^{\rm mean}(t), {\rm LR}_1(t)), \end{align}$$

corresponding to GI=$0$ and GI=$1$, respectively. Lastly, the GI function is built by linearly rescaling a climate proxy signal so that GI is close to 1 at the ice maximum and close to 0 at the ice minimum. For example, we may use the Antarctica EPICA temperature anomaly signal, which is available for the last 800,000 years.

Note that the two climates ${\rm CL}_0$ and ${\rm CL}_1$ are defined on two different reference topographies. Therefore, it is necessary to correct the temperature for a shift in elevation using a vertical lapse rate between the modeled ice surface elevation and the reference surface.

**Contributors:** G. Jouvet

**Reference:** [1] Jouvet, Guillaume, et al. "Coupled climate-glacier modelling of the last glaciation in the Alps." Journal of Glaciology 69.278 (2023): 1956-1970.

## Config Structure  
~~~yaml
{% include  "../../../igm/igm/conf/processes/clim_glacialindex.yaml" %}
~~~

## Parameters

{% set config = load_yaml('igm/igm/conf/processes/clim_glacialindex.yaml') %}
{% set help = load_yaml('igm/igm/conf_help/processes/clim_glacialindex.yaml') %}
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
</script> -->
