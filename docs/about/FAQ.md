* Ice is stuck on the border of the domain (no fluxes), what can I do?

Set parameter exclude_borders_from_iceflow to True

* I see some numerical artifacts (e.g. waves) occurring when modeling glacier evolution, what can I do?

Reduce the CFL parameter

* How to create/modify NetCDF files?

There are many ways to prepare NetCDF files (matlab, python, GIS tools, ...). The [NCO](http://nco.sourceforge.net/) toolkit permits easy operations in command lines, e.g.

       ncks -x -v thk file.nc file.nc              # this removes the variable 'thk' from file.nc
       ncks -v usurf file.nc file.nc               # this extracts the variable usurf from file.nc
       ncap2 -h -O -s 'thk=0*thk' file.nc file.nc  # this does operations on file.nc, here force zero thk
       ncrename -v apc,strflowctrl file.nc         # this renames varible apc to strflowctrl in file.nc

* oggm_shop produces error on windows

This is expected, OGGM is [not supported](https://github.com/OGGM/oggm/issues/870) on windows, however, modifying the tarfile.py file at line 2677 from name == member_name to name.replace(os.sep, '/') == member_name seems to fix the issue on Windows. Thanks Alexi Morin for proposing this workaround.

* GPU vs CPU

IGM works fine on CPU for small computational domains (typically individual glaciers). In contrast, GPUs will be very advantageous to treat very large computational grids (typically large networks of glaciers) as IGM naturally takes further benefit from parallelism (see this [example](https://youtu.be/Sna673xb-PE)).
 
