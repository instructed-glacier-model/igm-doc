TensorFlow does not allow us to run IGM on GPU directly on Windows, and the module `oggm_shop` does not work on windows. Therefore, we recommend window users to install WSL2-ubuntu, which provides a linux/ubuntu terminal. This faciliates the installation process of TensorFlow by using the host machine's (i.e. windows not WSL) nvidia drivers. Thus, if the nvidia drivers are installed on your windows machine, it should automatically be detected within the WSL system. As a concrete step-by-step procedure, we thus have the following:

!!! note "Nvidia Drivers vs. CUDA"

    Please note that similar to linux, the *only* requirement is the correct nvidia drivers. This means there is no need to install the CUDA or CUDNN to make TensorFlow work. 

First, make sure your windows host machine has updated nvidia drivers. A simple check is to run the following command in Powershell or Windows terminal

```bash
nvidia-smi
```

If this returns a valid response and the nvidia driver is up to date (see xxx for what this actually means), then, you can procede to installing `wsl` and it should inherit the correct nvidia drivers, making it possible to then install IGM.

If, however, it does not i) generate a response or ii) your drivers are too outdated, you will need to update your drivers. To do this, windows users can install the most up to date version of the drivers from [here](https://www.nvidia.com/en-us/drivers/). All you need is your nvidia GPU model, typically found within "Task Manager" or "Device Manger."

!!! note "Nvidia Drivers and WSL"

    If your host machine can correctly run `nvidia-smi` but after installing `wsl`, you can not run `nvidia-smi`, then most likely the nvidia drivers are too out-of-date. Please go back a step to update your nvidia drivers and then try to install `wsl` again.

After installing the new drivers, please reboot your machine and try again to run the following command, where you will see a response with the updated nvidia-drivers for you machine:

```bash
nvidia-smi
```

Finally, you can install `wsl` which then should automatically detect the new nvidia drivers.

```bash
wsl --install Ubuntu-22.04
```

The rest of the installation of IGM then follows the same procedure: first you install the virtual environment and then IGM with either PyPi or Git.