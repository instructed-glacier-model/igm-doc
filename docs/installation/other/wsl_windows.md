```bash
wsl --install Ubuntu-22.04
sudo apt update
sudo apt upgrade
```

and then, install the NVIDIA drivers if not done (if you get no output from `nvidia-smi`), and if you wish to use the GPU.

The rest -- installation of conda or venv environment and the installation of IGM -- are the same as above on Linux.