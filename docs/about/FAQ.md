## Frequently Asked Questions (FAQ)

### Ice is stuck on the border of the domain (no fluxes), what can I do?

Set the parameter `exclude_borders_from_iceflow` to `True`.

### I see some numerical artifacts (e.g., waves) occurring when modeling glacier evolution, what can I do?

Reduce the `CFL` parameter.

### How to create/modify NetCDF files?

There are many ways to prepare NetCDF files (e.g., MATLAB, Python, GIS tools). The [NCO](http://nco.sourceforge.net/) toolkit allows easy operations via command lines, for example:

```bash
ncks -x -v thk file.nc file.nc              # Removes the variable 'thk' from file.nc
ncks -v usurf file.nc file.nc               # Extracts the variable 'usurf' from file.nc
ncap2 -h -O -s 'thk=0*thk' file.nc file.nc  # Performs operations on file.nc, here forcing zero 'thk'
ncrename -v apc,strflowctrl file.nc         # Renames variable 'apc' to 'strflowctrl' in file.nc
```

### OGGM Shop produces an error on Windows

This is expected, as OGGM is [not supported](https://github.com/OGGM/oggm/issues/870) on Windows. However, modifying the `tarfile.py` file at line 2677 from `name == member_name` to `name.replace(os.sep, '/') == member_name` seems to fix the issue on Windows. Thanks to Alexi Morin for proposing this workaround.

### GPU vs CPU

IGM works fine on CPUs for small computational domains (typically individual glaciers). In contrast, GPUs are highly advantageous for very large computational grids (e.g., large networks of glaciers), as IGM naturally benefits from parallelism. See this [example](https://youtu.be/Sna673xb-PE).
