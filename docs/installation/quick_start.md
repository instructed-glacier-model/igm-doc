

# Quick Start

This guide serves as the fastest way to install IGM. It assumes that have already

1. Downloaded the [nvidia drivers](other/nvidia_drivers.md)
2. Have a working [virtual environment](other/virtual_environment.md)

If this is the case, you can skip to the next section.
!!! note "Installing on Windows"

    Tensorflow does not allow us to run IGM on GPU directly on Windows, and the module `oggm_shop` does not work on windows. Therefore, we recommend windows-user to install WSL2-ubuntu, which provides a linux/ubuntu terminal. WSL2 terminal can be nicely linked with VS code (with an extension). First, install WSL2-ubuntu

    ```bash
    wsl --install Ubuntu-22.04
    sudo apt update
    sudo apt upgrade
    ```

## Installing Methods

Once this is done, the options are the following

1. pip
2. github
<!-- 3. docker -->

<style>

.heading2 {
	color: hsl(243, 100.00%, 48.00%);
    font-weight:900;
    font-style:bold;
    font-size: 36px;
	line-height: 30px;
}

</style>


### Pip
<!-- <heading2 >Heading level 1</heading2> -->
To install the latest version of IGM, simply run

```{.bash .annotate}
pip install igm_model
```
<!-- 1. This is a code annotation -->

For reproducibility purposes, one might want to install a specific version of IGM. In order to do this, one can specify the version (*note*, this version must exist on the PyPI [servers](https://pypi.org/project/igm-model/#history)).

```{.bash .annotate}
pip install igm_model=='2.2.2'
```

### Github

If one wants to have the latest versions, or even, work on a specific hash for reproducibility, one can download IGM through the github [repository](). This is useful for developers, and researchers alike, who want to have the latest features as well as contribute to IGM's model personally.

One can download the latest version of IGM with `git clone`

```bash
git clone https://github.com/jouvetg/igm.git
```

!!! note "A Note about IGM's Install Location"

    Please note that where you decide to clone IGM is purely the location where IGMs source code will be installed. After you install IGM with `pip install -e` (more on this below), you can run IGM from *any* location on your computer. This is because installing IGM will create a symbolic link to wherever this folder is installed.

!!! note "Installing on Mac"

    IGM's core package, Tensorflow, is unfortunately not natively supported on Mac OS for GPUs. Instead, a "Tensorflow for Mac", called [tensorflow-metal](https://developer.apple.com/metal/tensorflow-plugin/), was developed as a workaround. To install IGM on Mac, you can still clone the repository with the above line, but you must additionally change `tensorflow` to `tensorflow-macos` in `setup.py` *before* running `pip install -e`. Here is a working procedure (tested on MacBook Pro M2); we still recommend using a virtual environment such as conda or venv when installing.

    ```bash
    git clone https://github.com/jouvetg/igm
    cd igm
    ```
    Now, in the `setup.py` file, you will need to edit the "install_requires=[...]" line depending on your requirements:

    * To use only the CPU: `tensorflow-macos==2.14.0`
    * To use the GPU: `tensorflow-macos==2.14.0, tensorflow-metal,`

Now, once the `setup.py` file is ready for your machine and operating system, one can install IGM inside his or her virtual environment. To do this, run the following command in the same level as the `setup.py` file:

```bash
pip install -e .
```

Note that while the user installs 

As IGM is being updated often, make sure you have the latest version by running the following command inside the `igm` folder

```bash
git pull
```

<!-- ### Docker

For even more granular control, one can opt to use the docker image instead of the github version. This maximizes the chances of reproducibility and stability as the virtual environmnet is part of the installation of IGM. ... Assuming you have [docker]() installed already, you can download the docker image through two ways

1. Docker CLI
2. DockerHub

In order to download IGM through the commandline, you can run the following command

```{.bash .annotate}
docker ...
``` -->