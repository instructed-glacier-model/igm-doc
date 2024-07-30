Tensorflow does not allow us to run IGM on GPU directly on Windows, and the module `oggm_shop` does not work on windows. Therefore, we recommend windows-user to install WSL2-ubuntu, which provides a linux/ubuntu terminal. WSL2 terminal can be nicely linked with VS code (with an extension). First, install WSL2-ubuntu

```bash
wsl --install Ubuntu-22.04
sudo apt update
sudo apt upgrade
```
and then, install the NVIDIA drivers if not done (if you get no output from `nvidia-smi`), and if you wish to use the GPU.

The rest -- installation of conda or venv environment and the installation of IGM -- are the same as above on Linux.