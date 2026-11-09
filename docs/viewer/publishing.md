# Publishing a study

A study in the [map viewer](index.md) is a set of files archived on Zenodo, plus one entry in the viewer's catalogue.
The website holds the page and the catalogue only; the viewer reads the data from the archive by HTTP range requests.

Each study is the data of a paper and is named `YEAR-FirstAuthor-JOURNAL`, e.g. `2026-Doe-TC` for a paper published in
2026 in The Cryosphere whose first author is J. Doe. Use the usual journal abbreviation (`TC`, `GMD`, `JGlac`, `GRL`,
`NatGeo`, …). The viewer lists the studies by this name, most recent first.

## Steps

### 1. Export the outputs

`igm_export_for_viewer` converts the netCDF outputs of IGM (`output.nc`, dimensions `time, y, x`) into the files of a
study. Describe the study in a file, here with two RGI regions:

```yaml
title: Glaciers of the Alps and Iceland to 2100
authors: [Jane Doe, John Roe]
year: 2026
journal: TC
doi: 10.5281/zenodo.XXXXXXX
paper: https://doi.org/10.5194/tc-XX-XXXX-2026
licence: CC-BY-4.0
time_steps: every:5
layers: [thk, usurf, topg, smb, velsurf_mag]
layer_options:
  thk: {vmax: 800}
regions:
  alps:
    file: outputs/alps/output.nc
    crs: EPSG:32632
    label: Central Europe (RGI 11)
  iceland:
    file: outputs/iceland/output.nc
    crs: EPSG:32627
    label: Iceland (RGI 06)
```

```bash
igm_export_for_viewer study.yaml --out viewer_export
```

The study name is built from `year`, the family name of the first author and `journal`; give `id` to set it yourself.
`doi` and `paper` are optional. `time_steps` is `all`, `every:N` or a list of times. `layer_options` overrides the
default colour scale or labels of a layer (`vmin`, `vmax`, `colormap`, `log`, `label`, `unit`); `valid_min` and
`valid_max` drop values outside a range, e.g. placeholder values in the netCDF. `mask: ice` keeps a layer only where there
is ice (for a layer that does not change in time, where there is ice at any time step), `mask: domain` everywhere. `crs` is needed when
the netCDF has no `pyproj_srs` attribute. Region names are short lowercase words; they appear in the file names and in
the links to the viewer.

`file` may also be a list of files or a pattern (`outputs/C*.nc`): runs made on tiles of one aligned grid, with the
same times, are merged into one map. Merging keeps the number of files small, as a Zenodo record holds at most 100.
`time_offset` is added to the times of the netCDF, e.g. `time_offset: 2020` for runs whose time starts at 0 in 2020.
`igm_version` records the version of IGM used for the runs when it is not the installed one.

The 3D view of the viewer uses `usurf` for the ice surface and `topg` elsewhere: keep both layers to offer it.

#### Scenarios

When the study compares several runs of the same regions (climate scenarios, sensitivity experiments, …), list them
under `scenarios:` instead of `regions:`. Each scenario has a label and its own regions, which must be the same in
every scenario and on the same grid:

```yaml
scenarios:
  ssp126:
    label: SSP1-2.6
    regions:
      alps: {file: outputs/alps_ssp126/output.nc}
      iceland: {file: outputs/iceland_ssp126/output.nc}
  ssp585:
    label: SSP5-8.5
    regions:
      alps: {file: outputs/alps_ssp585/output.nc}
      iceland: {file: outputs/iceland_ssp585/output.nc}
```

Keys given at the top of the study file (`crs`, `time_offset`, …) apply to every scenario, and can be set again in a
scenario or a region. The viewer then shows one button per scenario, keeps the place, layer, year and colour scale
when switching, and draws one curve per scenario in the time series of a cell. The colour scale of a layer is the same
for all scenarios. Scenario names are short lowercase words.

#### Studies made of GeoTIFF tiles

Global studies are often delivered as one GeoTIFF per glacier and layer, each in its own projection. Give them under
`tiles:` instead of `regions:`:

```yaml
tiles:
  layers:
    thk: "data/Thk/RGI-*/**/*_thk.tif"
    topg: "data/Topg/RGI-*/**/*_topg.tif"
  group: "RGI-(\\d\\d)"
  name: "rgi{group}"
  labels: {"11": "Central Europe", "13": "Central Asia"}
  resolution: 100
```

Files of the same glacier share their name up to the last `_`. Tiles are grouped by the part of their path matched by
`group`; within a group, nearby glaciers are gathered into regions (`gap_km`, default 150), each on its own equal-area
grid at `resolution` metres and below `max_cells` cells (default 2e8). Regions are named after `name`, with `-1`,
`-2`, … when a group is split. Such studies have no time axis.

A study with a single run can be exported without a study file:

```bash
igm_export_for_viewer outputs/alps/output.nc --id 2026-Doe-TC --region alps --crs EPSG:32632 \
    --title "Glaciers of the Alps to 2100" --out viewer_export
```

Layers missing from a netCDF are skipped; speeds are computed from their components when needed. The tool prints the
size of each layer and writes, in the output folder, the two files to upload (`igm_viewer.json` and `data.bin`) and
`studies_entry.json`, the entry for the catalogue.

### 2. Check it locally

```bash
igm_export_for_viewer --serve viewer_export
```

opens a local server and prints a link to the viewer showing the exported study, before anything is uploaded.

### 3. Upload to Zenodo

Create a new Zenodo record titled like the study, upload the two files `igm_viewer.json` and `data.bin` as they are,
and publish it:

```text
Zenodo record 1234567   2026-Doe-TC   doi:10.5281/zenodo.1234567
├── igm_viewer.json     description of the study, its layers and where their data are in data.bin
└── data.bin            the data: Cloud-Optimized GeoTIFFs placed one after the other
```

A study of any size fits in these two files (a very large study gets `data_1.bin`, `data_2.bin`, … of 20 GB each), so
the record stays far below the Zenodo limits of 100 files and 50 GB. Note the record number.

### 4. Add the study to the catalogue

The catalogue is the file `docs/viewer/app/studies.json` of the
[documentation repository](https://github.com/instructed-glacier-model/igm-doc){:target="_blank"}. To add a study,
open a pull request:

1. On GitHub, open
   [`docs/viewer/app/studies.json`](https://github.com/instructed-glacier-model/igm-doc/blob/main/docs/viewer/app/studies.json){:target="_blank"}
   and click the pencil (*Edit this file*). GitHub makes a fork of the repository for you.
2. Paste the content of `studies_entry.json` into the list, replace `<record>` by the record number, and add the DOI
   of the data:

    ```json
    {"studies": [
      {"id": "2026-Doe-TC", "title": "Glaciers of the Alps and Iceland to 2100",
       "base_url": "https://zenodo.org/api/records/1234567/files", "url_suffix": "/content",
       "doi": "10.5281/zenodo.1234567"}
    ]}
    ```

    Separate entries by commas; their order does not matter.

3. Click *Commit changes*, then *Propose changes*, and *Create pull request*. Give the study name as title and the
   paper in the description.

The maintainers check that the study opens in the viewer and merge the pull request. The study appears on the website
at the next deployment of the documentation, and can then be linked directly, e.g.
`https://igm-model.org/latest/viewer/#study=2026-Doe-TC&region=iceland&layer=thk&t=2050`.

## Format

The data of a study are Cloud-Optimized GeoTIFFs in the CRS of the model grid, with 256 × 256 blocks and overviews,
one per region, scenario, layer and chunk of time steps. The time steps of a chunk are stored together in each pixel
(`INTERLEAVE=PIXEL`, band *k* described as `TIME=<year>`): one request returns a block for every step of the chunk,
which keeps animations and time series fast and within the request limits of Zenodo. A chunk holds the whole series up
to 40 steps, and 25 steps beyond (`time_chunk` in the study file or `--time-chunk` to change it). Values are stored as
`int16`, `stored = round(value × scale)`, nodata `-32768`; layers that do not change in time have a single band. Ice
fields are masked where `thk` is below 1 m (`ice_threshold` in the study file).

`data.bin` holds these files one after the other, and `igm_viewer.json` (schema `igm_viewer/2`) gives the scenarios,
the regions with their grid, the layers with their scale, unit, label and default colour scale, the time axis, and for
each chunk its file name and position in `data.bin`. With more than one region, a 1 to a few km overview of the last time step
makes a world overview region, clickable to open each region (`overview: true` or `false` in the study file to force it).

To get the GeoTIFFs as plain files, for QGIS, GDAL or `rasterio`:

```bash
igm_export_for_viewer --unpack viewer_export
```

writes them into `viewer_export/files`. Export with `--no-container` to get the plain files directly, e.g. to host a
study elsewhere than on Zenodo; the server must then answer HTTP range requests and send
`Access-Control-Allow-Origin: *`.

## Size

Glacier-masked, one time step of one layer takes about 0.1 to 0.5 MB per million grid cells. For example, the European
Alps at 100 m (17 million cells) with 3 scenarios, 5 layers and 7 time steps take 36 MB. A screen reads a few blocks
of the chunk holding the current step; moving in time, playing and time series then need few or no more requests.
Use `time_steps: every:N` to thin long runs.
