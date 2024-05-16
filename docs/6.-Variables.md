Whenever this is possible, IGM adopts name convention of [PISM](https://www.pism.io/). Here is a minimal list of key variables:

| Variable names |     Shape        | Description                       | Unit    |
| :------------  | :-------------   | :-------------                    | :----   |
| t              | ()               |  Time variable (scalar)           | y       |
| dt             | ()               |  Time step (scalar)               | y       |
| x,y            | (nx)             |  Coordinates vectors              | m       |
| thk            | (ny)             |  Ice thickness                    | m       |
| topg           | (ny,nx)          |  Basal topography (or bedrock)    | m       |
| usurf          | (ny,nx)          |  Surface topography               | m       |
| smb            | (ny,nx)          |  Surface Mass Balance             | m/y ice-eq |
| ubar           | (ny,nx)          |  x- depth-average velocity of ice | m/y     |
| vbar           | (ny,nx)          |  y- depth-average velocity of ice | m/y     |
| U              | (nz,ny,nx)       |  x-horiz. 3D velocity field of ice  | m/y     |
| V              | (nz,ny,nx)       |  y-horiz. 3D velocity field of ice  | m/y     |
| W              | (nz,ny,nx)       |  z-vert.  3D velocity field of ice  | m/y     |
| arrhenius      | (ny,nx)          |  Arrhenius Factor                 | MPa^(-3) y^(-1) |
| slidingco      | (ny,nx)          |  Sliding Coefficient              | MPa m^(-1/3) y^(-1/3) |
| divflux        | (ny,nx)          |  Divergence of the flux           | m/y     |
| icemask        | (ny,nx)          |  Mask to restrict the smb comp.   | -       |
| dtopgdt        | (ny,nx)          |  Erosion rate                     | m/y     |
| xpos,ypos      | (nb particles)   |  x,y position of particles        | m       |
| rhpos          | (nb particles)   |  rel. pos of particles in ice column | m       |
| air_temp       | (nt,ny,nx)       |  seasonal air temperature 2 m above ground | °C  |
| precipitation  | (nt,ny,nx)       |  seasonal precipitation (water eq)         | kg m^(-2) y^(-1) |
