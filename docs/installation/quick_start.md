# Quick Start


This guide serves as the fastest way to install IGM. It assumes that you are installing IGM inside of an existing virtual environment and that your computer recognizes that you have a GPU or not. If these are not properly configured, please go to [getting started](). Once this is done, the options are the following

1. pip
2. github
3. docker

## Pip

To install the latest version of IGM, simply run

```{.bash .annotate}
pip install igm_model
```
<!-- 1. This is a code annotation -->

For reproducibility purposes, one might want to install a specific version of IGM. In order to do this, one can specify the version (*note*, this version must exist on the PyPI [servers](https://pypi.org/project/igm-model/#history)).

```{.bash .annotate}
pip install igm_model==2.2.2
```

## Github

If one wants to have the latest versions, or even, work on a specific hash for reproducibility, one can download IGM through the github [repository](). This is useful for developers, and researchers alike, who want to have the latest features as well as contribute to IGM's model personally.


## Docker

For even more granular control, one can opt to use the docker image instead of the github version. This maximizes the chances of reproducibility stability as the virtual environmnet is part of the installation of IGM. ... Assuming you have [docker]() installed already, you can download the docker image through two ways

1. Docker CLI
2. DockerHub

In order to download IGM through the commandline, you can run the following command

```{.bash .annotate}
docker ...
```