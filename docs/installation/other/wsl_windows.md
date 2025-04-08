As Tensorflow does not have GPU support for native windows, it is recommended to use WSL windows, which is essentially a way to use Linux on a windows machine. You must do this step before proceeding to installing the Nvidia drivers and ultimately IGM.

# Installing WSL

To get started, we first install wsl (more info [here](https://learn.microsoft.com/en-us/windows/wsl/install)).

```bash
wsl --install Ubuntu-22.04
```

Then, we can proceed to install the NVIDIA drivers if you wish to use the GPU. At this step, you can go to the [guide](nvidia_drivers.md) and follow the rest of the steps (installing the drivers and then IGM) as you are now using a Linux system.