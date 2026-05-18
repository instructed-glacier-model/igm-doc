# NVIDIA Drivers

From TensorFlow 2.14 onward, **only the NVIDIA driver is required** — you no longer need to install CUDA or cuDNN manually. This page explains how to check your current driver and install or update it if needed.

## Check your current driver

```bash
nvidia-smi
```

If a driver is installed, you will see a table similar to this:

```
+---------------------------------------------------------------------------------------+
| NVIDIA-SMI 535.183.01   Driver Version: 535.183.01   CUDA Version: 12.2              |
|-----------------------------------------+----------------------+----------------------+
|   0  NVIDIA RTX A3000 12GB          Off | 00000000:01:00.0 Off |                  Off |
|  N/A   50C    P0              N/A / 90W |      8MiB / 12288MiB |      0%      Default |
+-----------------------------------------+----------------------+----------------------+
```

!!! note
    The CUDA version shown is the **maximum supported** by your driver, not an installed version. You do not need to install CUDA separately.

If `nvidia-smi` is not found or the driver is outdated, follow the steps below.

---

## Install or update the driver

### Update package lists

```bash
sudo apt update && sudo apt upgrade
```

### List compatible drivers for your GPU

```bash
sudo ubuntu-drivers list
```

You will see output like:

```
nvidia-driver-535
nvidia-driver-545
nvidia-driver-570
...
```

### Install the latest driver

Pick the highest non-`open` non-`server` version from the list:

```bash
sudo apt install nvidia-driver-570
sudo reboot
```

### Verify

After rebooting, run `nvidia-smi` again. The new driver version should be shown.

---

## Minimum driver version

The driver must support a CUDA version compatible with TensorFlow. You can always check the required CUDA version for the TensorFlow release used by IGM in [`setup.py`](https://github.com/instructed-glacier-model/igm/blob/main/setup.py), then cross-reference it with the [TensorFlow GPU build table](https://www.tensorflow.org/install/source#gpu) and the [CUDA–driver compatibility table](https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html).

As a rule of thumb, **driver version ≥ 525** supports CUDA 12.x and is sufficient for all recent IGM releases.
