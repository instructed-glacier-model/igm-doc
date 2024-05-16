# References

There is currently an in-progress IGM [technical paper](https://github.com/jouvetg/igm/blob/main/technical-paper/paper.pdf) that will give you an overview of the physical components, modules, and capabilities of IGM.

If you use IGM in publications, make sure to cite one of the following papers and the code version you used.

	@article{IGM,
	  author       = "Jouvet, Guillaume and Cordonnier, Guillaume and Kim, Byungsoo and Lüthi, Martin and Vieli, Andreas and Aschwanden, Andy",  
	  title        = "Deep learning speeds up ice flow modelling by several orders of magnitude",
	  DOI          = "10.1017/jog.2021.120",
	  journal      = "Journal of Glaciology",
	  year         =  2021,
	  pages        = "1–14",
	  publisher    = "Cambridge University Press"
	}

	@article{IGM-inv,
	  author       = "Jouvet, Guillaume",
	  title        = "Inversion of a Stokes ice flow model emulated by deep learning",
	  DOI          = "10.1017/jog.2022.41",
	  journal      = "Journal of Glaciology",
	  year         = "2022",
	  pages        = "1--14",
	  publisher    = "Cambridge University Press"
	}

	@article{IGM-PINN,
  	  title={Ice-flow model emulator based on physics-informed deep learning},
  	  author={Jouvet, Guillaume and Cordonnier, Guillaume},
  	  journal={Journal of Glaciology},
  	  pages={1--15},
  	  year={2023},
  	  publisher={Cambridge University Press},
  	  doi={10.1017/jog.2023.73}
	}
 
 
# Acknowledgements

I greatly thank [Guillaume Cordonnier](https://www-sop.inria.fr/members/Guillaume.Cordonnier/) for his valuable help with the TensorFlow implementation. The [Parallel Ice Sheet Model](https://pism-docs.org) has greatly inspired the naming of variables, as well as the format of input and output NetCDF files.
 
