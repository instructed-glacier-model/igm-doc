# Citing IGM

## Primary reference

When using IGM in your research, please cite the model development paper:

> IGM authors (in prep.). **IGM: a differentiable, modular, and GPU-accelerated ice flow model.** doi:[10.31223/x5t99c](https://doi.org/10.31223/x5t99c)

{% raw %}
```bibtex
@article{IGM,
  title  = {IGM: a differentiable, modular, and GPU-accelerated ice flow model},
  author = {{IGM authors}},
  year   = {in prep.},
  doi    = {10.31223/x5t99c},
}
```
{% endraw %}

---

## Foundational papers

The approach underlying IGM builds on a line of methodological papers. Depending on which features you use, you may also wish to cite:

**Physics-informed ice flow solver:**

> Jouvet, G., & Cordonnier, G. (2023). Ice-flow model emulator based on physics-informed deep learning. *Journal of Glaciology*, 69(278), 1941–1955. [doi:10.1017/jog.2023.73](https://doi.org/10.1017/jog.2023.73)

```bibtex
@article{IGM-pinn,
  author  = {Jouvet, Guillaume and Cordonnier, Guillaume},
  title   = {Ice-flow model emulator based on physics-informed deep learning},
  journal = {Journal of Glaciology},
  year    = {2023},
  volume  = {69},
  number  = {278},
  pages   = {1941--1955},
  doi     = {10.1017/jog.2023.73},
}
```

**Inversion / data assimilation:**

> Jouvet, G. (2023). Inversion of a Stokes glacier flow model emulated by deep learning. *Journal of Glaciology*, 69(273), 13–26. [doi:10.1017/jog.2022.41](https://doi.org/10.1017/jog.2022.41)

```bibtex
@article{IGM-inv,
  author  = {Jouvet, Guillaume},
  title   = {Inversion of a {Stokes} ice flow model emulated by deep learning},
  journal = {Journal of Glaciology},
  year    = {2023},
  volume  = {69},
  number  = {273},
  pages   = {13--26},
  doi     = {10.1017/jog.2022.41},
}
```

**Data-driven ice flow emulator:**

> Jouvet, G., Cordonnier, G., Kim, B., Lüthi, M., Vieli, A., & Aschwanden, A. (2022). Deep learning speeds up ice flow modelling by several orders of magnitude. *Journal of Glaciology*, 68(270), 651–664. [doi:10.1017/jog.2021.120](https://doi.org/10.1017/jog.2021.120)

```bibtex
@article{IGM-data-driven,
  author  = {Jouvet, Guillaume and Cordonnier, Guillaume and Kim, Byungsoo
             and L{\"u}thi, Martin and Vieli, Andreas and Aschwanden, Andy},
  title   = {Deep learning speeds up ice flow modelling by several orders of magnitude},
  journal = {Journal of Glaciology},
  year    = {2022},
  volume  = {68},
  number  = {270},
  pages   = {651--664},
  doi     = {10.1017/jog.2021.120},
}
```
