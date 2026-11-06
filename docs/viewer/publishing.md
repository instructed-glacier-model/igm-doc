# Publishing a study

A study in the [map viewer](index.md) is a folder of files archived on Zenodo, plus one entry in the viewer's catalogue.
The website holds the page and the catalogue only; every byte of data is read from the archive by HTTP range requests.

## What a study contains

```
<region>/
   igm_viewer.json        # description of the study and of each layer (see below)
   thk.tif                # one Cloud-Optimized GeoTIFF per layer, one band per saved time
   usurf.tif
   smb.tif
   velsurf_mag.tif
   …
   preview/thk_1km.tif    # optional 1 km overview (EPSG:3857), used to show several regions together
```

A study with several regions (e.g. one per RGI region) has one such folder per region.

### Layer files

| Property | Value | Why |
|---|---|---|
| Format | Cloud-Optimized GeoTIFF, 256 × 256 internal blocks, DEFLATE, overviews | the viewer reads only the blocks on screen |
| Time | **one band per saved time**, band-interleaved; band *k* has the description `TIME=<year>` | one time step is read without downloading the others |
| Values | `int16`, `stored = round(value × scale)`, nodata `-32768` | 2 to 3 times smaller than `float32`; the scale is given in the JSON |
| Static layers | one band (e.g. `topg` when the bed does not change) | |
| CRS | the CRS of the model grid, no reprojection | the values stay those of the model |
| Mask | nodata off the ice for ice fields; whole domain for `topg`, `usurf` | |

Typical scales: 1 for metres and m/yr (`thk`, `usurf`, `topg`, speeds), 100 for SMB and dh/dt (cm precision),
1000 for ratios and friction in MPa. Use `float32` only when the range of a field does not fit in `int16`.

!!! warning "Band interleave with GDAL < 3.11"
    The COG driver of GDAL ≤ 3.10 ignores `INTERLEAVE=BAND` and writes a pixel-interleaved file, which forces the viewer
    to download all time steps of a block at once. With an older GDAL, write a tiled band-interleaved GeoTIFF, build its
    overviews, then copy it with `rasterio.shutil.copy(src, dst, driver="GTiff", tiled=True, interleave="band",
    copy_src_overviews=True)`, which gives the COG layout.

### `igm_viewer.json`

```json
{
  "schema": "igm_viewer/1",
  "study": {"id": "aletsch-2100", "title": "Great Aletsch Glacier to 2100", "authors": "<authors>", "year": 2026,
            "doi": "10.5281/zenodo.XXXXXXX", "paper": "https://doi.org/…", "licence": "CC-BY-4.0", "igm_version": "3.2"},
  "region": "aletsch", "region_label": "Great Aletsch Glacier",
  "crs": "EPSG:32632", "crs_proj4": "+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs",
  "resolution_m": 100.0, "bounds": [xmin, ymin, xmax, ymax], "bounds_wgs84": [lonmin, latmin, lonmax, latmax],
  "grid": [rows, cols],
  "time": [2020.0, 2021.0, …], "time_unit": "yr", "time_label": "year",
  "interleave": "band", "blocksize": 256,
  "fields": {
    "thk": {"file": "thk.tif", "dtype": "int16", "scale": 1, "nodata": -32768, "bands": 81,
            "unit": "m", "label": "ice thickness", "colormap": "viridis", "vmin": 0, "vmax": 900, "log": false,
            "mask": "ice", "preview": "preview/thk_1km.tif"},
    "smb": {"file": "smb.tif", "dtype": "int16", "scale": 100, "nodata": -32768, "bands": 81,
            "unit": "m ice/yr", "label": "surface mass balance", "colormap": "RdBu_r", "vmin": -10, "vmax": 3,
            "log": false, "mask": "ice"}
  }
}
```

`time` has one entry per band (a single entry for a static product). `colormap` is a Matplotlib name among those the
viewer ships (`viridis`, `inferno`, `magma`, `plasma`, `gist_earth`, `RdBu_r`, `coolwarm`, `Reds`, `Set1`); `vmin`,
`vmax` and `log` set the default colour scale. `preview` is optional.

## Steps

1. **Produce the files** from the netCDF output of your run (`output.nc`, dimensions `time, y, x`), one folder per region
   as above. Check them: `rio info thk.tif` must show `interleave: band` and 256 × 256 blocks.
2. **Upload to Zenodo** the files individually (not a zip: a zip cannot be read by ranges). Zenodo records are flat:
   name the files `<region>__<file>`, e.g. `aletsch__thk.tif`, `aletsch__igm_viewer.json`,
   `aletsch__preview__thk_1km.tif`. A record holds up to 100 files and 50 GB. Publish and note the DOI.
3. **Add the study to the catalogue**: open a pull request on the
   [documentation repository](https://github.com/instructed-glacier-model/igm-doc){:target="_blank"} adding an entry to
   `docs/viewer/app/studies.json`:

    ```json
    {"studies": [
      {"id": "aletsch-2100", "title": "Great Aletsch Glacier to 2100",
       "base_url": "https://zenodo.org/records/XXXXXXX/files", "layout": "zenodo-flat",
       "regions": ["aletsch"], "doi": "10.5281/zenodo.XXXXXXX"}
    ]}
    ```

    `base_url` + `/<region>__<file>` must answer HTTP range requests (status 206) with
    `Access-Control-Allow-Origin: *`, which Zenodo does. For a folder layout (`<base_url>/<region>/<file>`, e.g. on S3),
    omit `layout`. An optional `mirror_url` with the same layout is tried first and used when it answers within 2 s.

4. **Check the study** before the pull request: serve the folder locally with a server that supports range requests
   (Python's `http.server` does not), write a local `studies.json`, and open the viewer with
   `…/viewer/app/index.html?catalogue=<url of your studies.json>`.

## Size

A 1000 × 1000 grid in `int16`, glacier-masked, takes 0.3 to 1 MB per time step and layer; overviews add about a third.
A 50-step transient run with 10 layers is therefore 150 MB to 1 GB. One screen of one time step reads 4 to 8 blocks, about
50 to 200 kB, however many time steps the file holds.
