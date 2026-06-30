# Module `live_dashboard`

This IGM output module provides a real-time visualization dashboard for glacier simulations. It supports two rendering modes selectable via the `mode` parameter:

## 2D mode (matplotlib)

A three-panel planview dashboard updated live during the simulation:

- **Ice Thickness** (left): ice thickness over a hillshaded bedrock, using the `cividis` colormap. The colorbar range is controlled by `thk_max`.
- **Velocity** (right): vertically-averaged ice speed on a log scale over hillshaded bedrock, using the `inferno` colormap. The colorbar range is controlled by `vel_max`. An ice-edge contour is overlaid in blue.
- **Time series** (bottom, full width): dual y-axis plot showing the Equilibrium Line Altitude (ELA, left axis) and ice volume (right axis) over time.

The current simulation time is displayed as a centered title above the panels. A status bar above the time series shows `dt`, volume, area, max velocity, and time.

**ELA computation:** If the `smb` module is running with `method: simple` (detected via `state.smbpar`), the full ELA forcing curve is shown as a dashed line from the start. Otherwise, the module computes a live ELA estimate at each save step as the mean surface elevation where $|SMB| < 0.5$ m/yr and ice thickness $> 1$ m.

The figure size adapts automatically to the domain's aspect ratio: the configured width (`figsize[0]`) is used, and the height is computed so that the two map panels fill their space without dead space.

If `save_frames` is set to `true`, PNG frames are saved at each update step (named `dashboard_XXXXXX.png`).

## 3D mode (PyVista)

A GPU-accelerated 3D visualization with:

- **Bedrock** rendered as a semi-transparent grey surface.
- **Ice surface** colored by speed using the `inferno` colormap, with a persistent horizontal colorbar at the bottom.
- **Time title** displayed prominently at the top center.
- **Stats overlay** (upper left) showing volume, area, max speed, dt, and wall time.
- **Inset chart** (bottom left) showing the same ELA/volume time series as in 2D mode.

The initial camera is automatically positioned at 300% of the elevation range above the glacier, offset to the south and looking north toward the glacier center. The view is interactive and can be rotated/zoomed during the simulation.

## Requirements

- **2D mode**: `matplotlib` with `TkAgg` backend (interactive window).
- **3D mode**: `pyvista` (GPU rendering via VTK).

## Usage

Activate it in your `params.yaml`:

```yaml
outputs:
  - live_dashboard
```

## Parameters

Default configuration file ([live_dashboard.yaml](https://github.com/instructed-glacier-model/igm/blob/main/igm/conf/outputs/live_dashboard.yaml)):
~~~yaml
{% include  "../../../../igm/conf/outputs/live_dashboard.yaml" %}
~~~

{% set config = load_yaml('../igm/conf/outputs/live_dashboard.yaml') %}
{% set help = load_yaml('../igm/conf_help/outputs/live_dashboard.yaml') %}
{% set module_key = config.keys() | list | first %}
{% set module = config[module_key] %}
{% set module_help = help %}

{% include "includes/_config_table_notree.j2" %}

