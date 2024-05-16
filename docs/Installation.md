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

1. Install NVIDIA drivers

If you aim to use only the CPU or already get an output from `nvidia-smi`, you can skip this step.
```bash

# get the latest libraries from apt
sudo apt update
sudo apt upgrade

# choose which driver version is compatible with your GPU device (in this case 510)
sudo apt install nvidia-driver-510 nvidia-dkms-510
sudo reboot # you wont see the changes until after you reboot
```
After rebooting, you can check your driver version with the command `watch -d -n 0.5 nvidia-smi` should give you live information on your GPU device.

2. Install anaconda and create a virtual environment (strongly recommended) with conda or venv:

```bash
# install anaconda
wget https://repo.anaconda.com/archive/Anaconda3-2023.09-0-Linux-x86_64.sh
bash Anaconda3-2023.09-0-Linux-x86_64.sh
 
# create new environment
conda create --name igm python=3.10

# activate environment to install IGM
conda activate igm
```
or

```bash
# create igm venv environment
python3.10 -m venv igm

# activate environment to install IGM
source igm/bin/activate
```

3. Install IGM

For simple usage, you can install the latest **IGM stable** version and its dependencies from the Pypi as follows:
```bash
pip install igm_model
```
OR for using all and recent features, you can install the IGM **development version** from the github repository as follows:
```bash
git clone https://github.com/jouvetg/igm.git
cd igm
pip install -e .
```
After that, you may run any example (``igm_run``). As IGM is being updated often, make sure you have the latest version, you may run
```bash
git pull
```

#  Windows

Tensorflow does not allow us to run IGM on GPU directly on Windows, and the module `oggm_shop` does not work on windows. Therefore, we recommend windows-user to install WSL2-ubuntu, which provides a linux/ubuntu terminal. WSL2 terminal can be nicely linked with VS code (with an extension). First, install WSL2-ubuntu

```bash
wsl --install Ubuntu-22.04
sudo apt update
sudo apt upgrade
```
and then, install the NVIDIA drivers if not done (if you get no output from `nvidia-smi`), and if you wish to use the GPU.

The rest -- installation of conda or venv environment and the installation of IGM -- are the same as above on Linux.

# Mac

IGM core library native Tensorflow is not supported on Mac for GPU usage. Instead, a "Tensorflow for Mac", called [tensorflow-metal](https://developer.apple.com/metal/tensorflow-plugin/), was developed as workaround. To install IGM on Mac, you may follow the linux workflow, however, you will need to change in setup.py tensorflow by tensorflow-macos. Here is a working procedure (tested on MacBook Pro M2) -- still we recommend using a virtual environment such as conda or venv as on linux:

```bash
git clone -b develop https://github.com/jouvetg/igm
cd igm
```
You need to edit "install_requires=[...]" in the file "setup.py":

* To use only the CPUs: `tensorflow-macos==2.14.0`
* To use the GPUs: `tensorflow-macos==2.14.0, tensorflow-metal,`

and then
```bash
pip install -e .
```
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


 