IGM is a Python package, which works **on any OS** on 

 * CPU (not computationally efficient, but fine for small applications like individual glaciers),
 * GPU (the most **computationally efficient** way, especially relevant for large-scale and high-resolution applications). 

IGM can be installed with the 

 * the **main version** for stable application (the latest available tag), not all modules,
 * the **development version** to get the latest feature with all modules (at the possible price of unrevealed bugs). 

Both versions are now on the same (main) branch. IGM is rapidly changing, keep track of updates on the [release page](https://github.com/jouvetg/igm/releases) for the tagged versions or/and on this [page](https://github.com/jouvetg/igm/commits/develop) for the development version.

**Note that the igm package installs most of dependent packages, but not all. For using some post-processing modules, the user has to install additional packages (e.g., mayavi, plotly, ect.).**

We first describe the installation in Linux (the preferred OS), and then on Windows and Mac.

# Linux



#  Windows



# Mac


# Troubleshooting

Main source of issues are linked to Tensorflow and the use of GPU. Hopefully, the installation is significantly easier since tensorflow 2.14.0 since it can install all necessary GPU/cuda dependent packages with the right version automatically. Note that **to ensure smooth usage of GPU with cuda and tensorflow libraries**, one has to make sure that i) cuda ii) cudnn iii) tensorflow are [compatible](https://www.tensorflow.org/install/source#gpu), and your Nvidia driver is [compatible](https://docs.nvidia.com/deploy/cuda-compatibility/) with the version of cuda. Such incompatibility is the most common source of issue. 

For instance, it is possible do install tensorflow-2.12.0 by setting `tensorflow==2.12.0` in the setup.py and

	conda install -c conda-forge cudatoolkit=11.8.0
	pip install nvidia-cudnn-cu11==8.6.0.163

	mkdir -p ${CONDA_PREFIX}/etc/conda/activate.d
	D=${CONDA_PREFIX}/etc/conda/activate.d/env.sh
	echo 'export PYTHONNOUSERSITE=1' >> $D
	echo 'export LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:${CONDA_PREFIX}/lib' >> $D
	echo 'export CUDNN_PATH=$(dirname $(python -c "import nvidia.cudnn;print(nvidia.cudnn.__file__)"))' >> $D
	echo 'export LD_LIBRARY_PATH=$CONDA_PREFIX/lib/:$CUDNN_PATH/lib:$LD_LIBRARY_PATH' >> $D


 