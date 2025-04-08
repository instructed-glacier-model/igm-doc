To use IGM, it is recommended to use a virtual environment. This is because within IGM there exists specific versions of not only Tensorflow but many other packages dowloaded from PyPi and Conda. In short, to properly manage conflicts, we suggest installing IGM within a virtual environment. To do this, there exist a few different options. If you just want to install a basic virtual environment, then using Python could be the simplest option. However, we recommend using Conda for more complex projects where you might have different versions of packages. Both methods are illustrated below.

## Using Conda

To create a virtual environment with conda, we first must install [anaconda](). The script below serves as an example for Linux, but one can also install it on windows. However, please note that IGM, and by consequence Tensorflow, as issues with native windows, so we recommend using either Linux or WSL windows. 

First, we install anaconda for our machine architecture by going to the [archive](https://repo.anaconda.com/archive/). For example, this is for a Linux x86 64 bit machine.

```bash
wget https://repo.anaconda.com/archive/Anaconda3-2023.09-0-Linux-x86_64.sh
bash Anaconda3-2023.09-0-Linux-x86_64.sh
```

Next, we can create our virtual environment.

!!! note

	Make sure to choose a python version that is in alignment with IGM's install requirements. You can check this by going [here](https://github.com/jouvetg/igm/blob/main/setup.py#L33).

```bash
conda create --name igm python=3.10
```

Now, we can activate our environment so that we can install IGM.

```
conda activate igm
```

## Using Python Virtual Environments

Alternatively, one can install a virtual environment without needing to use conda by using the `venv` module that is built-in to `python`. This method is less flexible for complex environments but is easier to setup as you only need python installed.

Simularly, we need to pick a correct version of python that is in line with the current IGM one wants to download.

Then, using that python version, we can create a virtual environment

```bash
python3.10 -m venv igm
```

Lastly, we can activate this environment and install IGM.

```
source igm/bin/activate
```