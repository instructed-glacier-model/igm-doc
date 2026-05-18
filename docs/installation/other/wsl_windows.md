# WSL2 on Windows

TensorFlow does not support GPU acceleration natively on Windows, and `oggm_shop` does not work on Windows. The recommended solution is **WSL2 (Windows Subsystem for Linux)**, which provides a full Ubuntu terminal and automatically inherits your host machine's NVIDIA drivers — no separate driver installation inside WSL is needed.

!!! note
    Only the NVIDIA driver on the Windows host is required. You do not need to install CUDA or cuDNN inside WSL.

---

## Verify or update your NVIDIA driver on Windows

Open PowerShell or Windows Terminal and run:

```bash
nvidia-smi
```

If this prints a valid driver table, your drivers are sufficient. If the command is not found or the driver version is outdated, download the latest driver for your GPU from the [NVIDIA driver portal](https://www.nvidia.com/en-us/drivers/) (your GPU model is listed in **Task Manager → Performance** or **Device Manager**), then reboot.

---

## Install WSL2

In PowerShell (run as Administrator):

```bash
wsl --install Ubuntu-22.04
sudo apt update && sudo apt upgrade
```

After installation, open the Ubuntu terminal and confirm that the NVIDIA driver is visible:

```bash
nvidia-smi
```

!!! warning
    If `nvidia-smi` fails inside WSL after a successful run on Windows, your Windows driver is likely too old. Update it (Step 1) and reinstall WSL.

---

## Install IGM

Inside the WSL Ubuntu terminal, follow the standard [Installation](../quick_start.md) instructions — create a virtual environment, then `pip install igm-model`.
