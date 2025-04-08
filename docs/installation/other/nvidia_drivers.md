# Installing Nvidia Drivers

Assuming you have a linux system or installed wsl windows, we can now install the necessary Nvidia Drivers so that tensorflow can find them automatically. It is important to note that from tensorflow 2.14, tensorflow only needs the Nvidia Drivers and nothing [else](https://github.com/tensorflow/tensorflow/releases/tag/v2.14.0). Previously, one would have to install the drivers, cuda, cudnn, etc.

## Do I already have an nvidia driver?

To determine if you already have an nvidia-driver, you can simply run the command

```bash
nvidia-smi
```

<!-- cat /proc/driver/nvidia/version -->

which should produce an output like this (if you have an nvidia-driver)

```
+---------------------------------------------------------------------------------------+
| NVIDIA-SMI 535.183.01             Driver Version: 535.183.01   CUDA Version: 12.2     |
|-----------------------------------------+----------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |         Memory-Usage | GPU-Util  Compute M. |
|                                         |                      |               MIG M. |
|=========================================+======================+======================|
|   0  NVIDIA RTX A3000 12GB La...    Off | 00000000:01:00.0 Off |                  Off |
| N/A   50C    P0              N/A /  90W |      8MiB / 12288MiB |      0%      Default |
|                                         |                      |                  N/A |
+-----------------------------------------+----------------------+----------------------+
                                                                                         
+---------------------------------------------------------------------------------------+
| Processes:                                                                            |
|  GPU   GI   CI        PID   Type   Process name                            GPU Memory |
|        ID   ID                                                             Usage      |
|=======================================================================================|
|    0   N/A  N/A      3914      G   /usr/lib/xorg/Xorg                            4MiB |
+---------------------------------------------------------------------------------------+
```

Above, you will see your driver version. It is important to note that even though it says the CUDA version is 12.2, this is the *maximum* supported version of CUDA given the driver version, not the actual version of your installed CUDA. Now that your machine has a Nvidia driver, you can move onto installing IGM with `pip`. Please go to the quick start [page](../quick_start.md).

## Installing an Nvidia Driver

In general, this installation process explains how to install the Nvidia drivers for any version of IGM (and subsequently tensorflow). The documentation may be out of date in regards to the specific versions but the steps are the same. If you are looking for a quick installation and do not care about the details, you can simply attempt to run the following lines of code, in sequence, (for IGM 2.2.2 - and thus tensorflow 2.15.0). If you have any issues and still can not install the Nvidia drivers properly, please read the rest of the guide.

```bash
sudo apt update
sudo apt upgrade
sudo apt install nvidia-driver-535
sudo reboot
```

### Finding potential Nvidia Drivers
If you do not have an existing Nvidia driver, you can install it directly onto your linux system. To do so, we first make sure we have the updated libraries from apt

```bash
sudo apt update
sudo apt upgrade
```

Next, we can download a specific nvidia driver version. These versions depend on your GPU model, so you may see a different output than what is shown below. In any case, we first need to see which driver versions are compatable with our model (for more info, visit [here](https://documentation.ubuntu.com/server/how-to/graphics/install-nvidia-drivers/index.html)); to do this, we can run the following command

```bash
sudo ubuntu-drivers list
```

If you have an available device, you will see a list of possible drivers like so
```bash
nvidia-driver-535, (kernel modules provided by linux-modules-nvidia-535-generic-hwe-22.04)
nvidia-driver-545-open, (kernel modules provided by nvidia-dkms-545-open)
nvidia-driver-545, (kernel modules provided by nvidia-dkms-545)
nvidia-driver-560-open, (kernel modules provided by nvidia-dkms-560-open)
nvidia-driver-570, (kernel modules provided by nvidia-dkms-570)
nvidia-driver-560-server, (kernel modules provided by nvidia-dkms-560)
...
```

### Selecting an Nvidia Driver
Now, to choose the correct nvidia driver, it will be constrained by the tensorflow version you would like to download. For instance, if IGM currently uses tensorflow 2.15 (you can always check the version of tensorflow in the setup.py file [here](https://github.com/jouvetg/igm/blob/main/setup.py#L35)), you will need a minimum version of CUDA and cuDNN (as shown [here](https://www.tensorflow.org/install/source#gpu)). From the table, we can see that we need a minimum cuDNN and CUDA version of 8.9 and 12.2, respectively.


| Version | Python version | Compiler | Build tools | cuDNN | CUDA |
| --- | --- | --- | --- | --- | --- |
| tensorflow-2.15.0	| 3.9-3.11	| Clang 16.0.0	| Bazel 6.1.0	| 8.9	| 12.2 |
| tensorflow-2.14.0	| 3.9-3.11	| Clang 16.0.0	| Bazel 6.1.0	| 8.7	| 11.8 |


This means that we should install a driver that supports a CUDA version of *at least* 12.2. To check this we can check the minimum required driver version for both linux as well as windows (not wsl-windows) [here](https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html). You will now find that for tensorflow 2.15, which requires a CUDA version of 12.2, we need a minimum driver version of `525.60.13`.
<!-- https://docs.nvidia.com/deploy/cuda-compatibility/index.html -->


| CUDA Toolkit | Minimum Required Driver Version for CUDA Minor Version Compatibility* | |
| --- | --- | --- |
| | Linux x86_64 Driver Version | Windows x86_64 Driver Version |
| CUDA 12.x | >=525.60.13 | >=528.33 |
| CUDA 11.8.x | >=450.80.02 | >=452.39 |


### Installing the new Nvidia Driver

Now, we can install the required driver (ideally not just the minimum version but the latest version). A smaller note is that it is recommended to install the base driver version rather than the `open` or `server` versions.

```bash
sudo apt install nvidia-driver-570 # this is the latest version at the moment
sudo reboot # you wont see the changes until after you reboot
```

After rebooting, you can check your driver version with the `nvidia-smi` command and should see the new changes.