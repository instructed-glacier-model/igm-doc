# IGM-Related Tools

Here are some tools we recommend for handling data, coding, visualizing results, etc. These tools integrate well with the IGM ecosystem.

## Data Handling

Unless using the `oggm_shop`, you need to prepare data for IGM. IGM preferably takes NetCDF files. Below are some tools to handle NetCDF (or TIFF) files:

- **ncview**: A lightweight utility for quick visualization of NetCDF files.
- **nco**: A suite of command-line tools for performing operations on NetCDF files. You can also produce or modify NetCDF files using independent Python scripts.
- **gdal**: A powerful library and set of tools for working with TIFF files (and NetCDF files as well).

## Editor: VS Code

VS Code is an excellent editor and is highly recommended for working with IGM. It offers features such as:
- Syntax highlighting for Python, YAML, and other languages.
- Integration with AI tools like Copilot and OpenAI.
- Remote server connection for coding and running IGM remotely.
- Powerful extensions, such as **H5Web**, for visualizing NetCDF files.

## Visualization

- **`utils/anim_plotly.py`**: Enables interactive 3D visualization of IGM results by reading NetCDF files. It uses the `dash` and `plotly` libraries (`pip install dash plotly`). This script creates a Dash app accessible via a browser (usually at `http://127.0.0.1:8050/`). The app displays a 3D plot of the glacier's surface over the surrounding bedrock. Surface color can represent ice thickness, velocity magnitude, or surface mass balance. Variables can be selected from a dropdown menu, and a slider allows navigation through different time steps. This tool was implemented by [Oskar Herrmann](https://github.com/ho11laqe).

- [Glacier:3D-Viz tool](https://github.com/OGGM/glacier3dviz) is a visualization tool developed by the OGGM team (Patrick Schmitt) to create 3D visualizations of changing glaciers. It is primarily built on the `PyVista` package. Glacier:3D-Viz can read IGM-like output data. Refer to their documentation for more information.

- **`utils/anim_mayavi.py`**: Creates a 3D animated plot from the NetCDF output (default `output.nc`) file produced by IGM. This module depends on the `mayavi` and `pyqt5` libraries (`pip install mayavi pyqt5`).  
    **Note:** This module works only with Python versions <= 3.10.

- **`utils/anim_video.py`**: Generates an animated MP4 video of ice thickness over time from the NetCDF output (default `output.nc`) file produced by IGM. This module depends on the `xarray` library.

- **`utils/make_film.py`**: A utility for creating MP4 films from a set of images (developed by T. Leger).

