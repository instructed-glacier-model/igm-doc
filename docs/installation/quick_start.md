

# Quick Start

This guide serves as the fastest way to install IGM. It assumes that have already

1. Downloaded the [nvidia drivers](other/nvidia_drivers.md)
2. Have a working [virtual environment](other/virtual_environment.md)

If this is the case, you can skip to the next section.
!!! note

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
3. docker

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
!!! note

    IGM core library native Tensorflow is not supported on Mac for GPU usage. Instead, a "Tensorflow for Mac", called [tensorflow-metal](https://developer.apple.com/metal/tensorflow-plugin/), was developed as workaround. To install IGM on Mac, you may follow the linux workflow, however, you will need to change in setup.py tensorflow by tensorflow-macos. Here is a working procedure (tested on MacBook Pro M2) -- still we recommend using a virtual environment such as conda or venv as on linux:

    ```bash
    git clone -b develop https://github.com/jouvetg/igm
    cd igm
    ```
    You need to edit "install_requires=[...]" in the file "setup.py":

    * To use only the CPUs: `tensorflow-macos==2.14.0`
    * To use the GPUs: `tensorflow-macos==2.14.0, tensorflow-metal,`

```bash
cd igm
pip install -e .
```

After that, you may run any example (``igm_run``). As IGM is being updated often, make sure you have the latest version, you may run

```bash
git pull
```

### Docker

For even more granular control, one can opt to use the docker image instead of the github version. This maximizes the chances of reproducibility stability as the virtual environmnet is part of the installation of IGM. ... Assuming you have [docker]() installed already, you can download the docker image through two ways

1. Docker CLI
2. DockerHub

In order to download IGM through the commandline, you can run the following command

```{.bash .annotate}
docker ...
```