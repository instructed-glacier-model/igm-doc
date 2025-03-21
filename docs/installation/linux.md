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