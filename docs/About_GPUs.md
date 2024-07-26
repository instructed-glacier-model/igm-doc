
IGM works fine on CPU for small computational domains (typically individual glaciers). In contrast, GPUs will be very advantageous to treat very large computational grids (typically large networks of glaciers) as IGM naturally takes further benefit from parallelism. 


| Resolution                | Minimum computational ressource |
| :------------------------ | ------------------------------- |
| 0.25 K: 256 x 192 pixel   | CPU                             |
| 1 K   : 1024 x 768 pixel  | laptop GPU    e.g., RTX A4000   |
| 4 K   : 3840 x 2160 pixel | excellent GPU  e.g., RTX 4090   |

To illustrate this, I modeled the ice dynamics and glacier evolution over New Zealand by forcing the mass balance with an ELA oscillating between 1000 and 2000 meters a.s.l. The 1000-year-long simulation took about 1.5 hours on the Nvidia RTX 3090 GPU with a 640x700 km computational domain at 200 meters of resolution (i.e. 3200x3500 grid). The animation can be visualized on this [link](https://youtu.be/Sna673xb-PE).
 
