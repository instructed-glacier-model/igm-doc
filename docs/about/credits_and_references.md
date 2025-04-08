# Credits

## Main developpers

| Name | Contributions |
|----------|----------|
| Guillaume Jouvet    | Primary source code author of most of modules and their documentation, design of the PI-CNN in forward [1,3] and inverse modes [2]. |
| Brandon Finley      | Core code and software design, hydra integration, code profiling, docker, documentation framework design, `texture` module, TBC |

## Contributors

*(get in touch if you notice any missing contribution)*

| Name | Contributions |
|----------|----------|
| Samuel Cook | Implementation of functions specific for global modelling in the `data_assimilation` module, inclusion of RGI7 in `oggm_shop` |
| Guillaume Cordonnier | Co-design of the PI-CNN in forward mode, original implementation of the `thk` module |
| Alex Jarosch  | Bueler2005C's benchmark case in the example gallery |
| Andreas Henz | Loading icemasks from shape files in input modules |
| Tancrède Leger | Climate module `XXXX` |
| Fabien Maussion | Original `oggm_shop` module, and support for the integration of OGGM-based `clim_oggm` and `smb_oggm` modules, and instructed OGGM routine. |
| Jürgen Mey | `avalanche` and `glex` modules |
| Oskar Hermann | Vizualization tool `anim_plotly` |
| Dirk Scherler | Support for the verication of the `particle` module |
| Gillian Smith | Bug fixes |
| Patrick Schmitt | Vizualization tool, TBC |
| Claire-Mathile Stücki | Update of `vert_flow` and `particle` modules |
| Ethan Welthy | GlaThiDa file reading |

## Citing IGM

The foundational concepts of IGM are as follows: The modeling approach using data-driven ice flow convolutional neural networks (CNN) was introduced in [3], the inversion method was introduced in [2], and the physics-informed ice flow surrogate neural network (SNN) was introduced in [13]. There is currently an in-progress IGM [technical paper](https://github.com/instructed-glacier-model/igm-paper) that provides an overview of the physical components, modules, and capabilities of IGM. Until the technical paper is finalized, [1] serves as the most up-to-date reference for understanding IGM concepts, and should therefore be used for referencing IGM.

[1] Jouvet, G., & Cordonnier, G. (2023). Ice-flow model emulator based on physics-informed deep learning. Journal of Glaciology, 69(278), 1941-1955.

[2] Jouvet, G. (2023). Inversion of a Stokes glacier flow model emulated by deep learning. Journal of Glaciology, 69(273), 13-26.

[3] Jouvet, G., Cordonnier, G., Kim, B., Lüthi, M., Vieli, A., & Aschwanden, A. (2022). Deep learning speeds up ice flow modelling by several orders of magnitude. Journal of Glaciology, 68(270), 651-664.

## Bibtex entries

```
@article{IGM,
	author       = "Jouvet, Guillaume and Cordonnier, Guillaume and Kim, Byungsoo and Lüthi, Martin and Vieli, Andreas and Aschwanden, Andy",  
	title        = "Deep learning speeds up ice flow modelling by several orders of magnitude",
	DOI          = "10.1017/jog.2021.120",
	journal      = "Journal of Glaciology",
	year         =  2021,
	pages        = "1–14",
	publisher    = "Cambridge University Press"
}
```
```
@article{IGM-inv,
	author       = "Jouvet, Guillaume",
	title        = "Inversion of a Stokes ice flow model emulated by deep learning",
	DOI          = "10.1017/jog.2022.41",
	journal      = "Journal of Glaciology",
	year         = "2022",
	pages        = "1--14",
	publisher    = "Cambridge University Press"
}
```
```
@article{IGM-PINN,
	title={Ice-flow model emulator based on physics-informed deep learning},
	author={Jouvet, Guillaume and Cordonnier, Guillaume},
	journal={Journal of Glaciology},
	pages={1--15},
	year={2023},
	publisher={Cambridge University Press},
	doi={10.1017/jog.2023.73}
}
```
```
@Misc{Yadan2019Hydra,
  author =       {Omry Yadan},
  title =        {Hydra - A framework for elegantly configuring complex applications},
  howpublished = {Github},
  year =         {2019},
  url =          {https://github.com/facebookresearch/hydra}
}
```
 
