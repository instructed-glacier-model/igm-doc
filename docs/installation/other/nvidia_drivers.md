If you aim to use only the CPU or already get an output from `nvidia-smi`, you can skip this step.

! Give instructions for the driver version depending on the Tensorflow / GPU version

```bash

# get the latest libraries from apt
sudo apt update
sudo apt upgrade

# choose which driver version is compatible with your GPU device (in this case 510)
sudo apt install nvidia-driver-510 nvidia-dkms-510
sudo reboot # you wont see the changes until after you reboot

```
After rebooting, you can check your driver version with the command `watch -d -n 0.5 nvidia-smi` should give you live information on your GPU device.

! Give Photo