---
hide:
  - toc
---

# Map viewer

Browse the outputs of studies made with IGM: pick a **study**, a **scenario** and a **region** when the study has
several, a **layer** (ice thickness, surface speed, surface mass balance, …) and, for transient runs, a **time step**.

<div class="igm-viewer-frame">
  <iframe id="igm-viewer" src="app/index.html" title="IGM map viewer" allow="fullscreen"></iframe>
</div>
<p style="text-align:right; font-size:.8em"><a id="igm-viewer-full" href="app/index.html" target="_blank">Open the viewer in full screen ↗</a></p>

<script>
  (function () {
    var q = window.location.search, h = window.location.hash;
    if (q || h) {
      document.getElementById("igm-viewer").src = "app/index.html" + q + h;
      document.getElementById("igm-viewer-full").href = "app/index.html" + q + h;
    }
  })();
</script>

<style>
  .igm-viewer-frame { position: relative; width: 100%; height: 75vh; min-height: 480px;
    border: 1px solid var(--md-default-fg-color--lightest); border-radius: 6px; overflow: hidden; }
  .igm-viewer-frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
</style>

## How to use it

| Action | How |
|---|---|
| Change study, scenario, region, layer | panel on the left; on the world overview, click a region outline |
| Move in time (transient studies) | time slider, ← / → keys, ▶ (or space) to play |
| Read a value | move the mouse over the map |
| Time series at a point | click a cell (transient studies), one curve per scenario |
| 3D view | **3D view** shows the current map extent in 3D, following the time slider; drag to move, right drag (or ctrl + drag) to rotate and tilt, wheel to zoom; the ice surface shows the layer or white ice, or the ice is removed to show the bed |
| Colour scale | type the min / max, ↺ resets the study's default |
| Share a view | copy the URL: study, scenario, region, layer, time and 3D are kept in it |

The data are never stored on this website. Each study is a set of
[Cloud-Optimized GeoTIFF](https://cogeo.org/){:target="_blank"} files archived on
[Zenodo](https://zenodo.org/){:target="_blank"} with a DOI; the viewer reads only the pieces it displays. The same files
open directly in QGIS, GDAL or `rasterio`, so the archive of a study is also its data of record.

To add your own study, see [Publishing a study](publishing.md).
