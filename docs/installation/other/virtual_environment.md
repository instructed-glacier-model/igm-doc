Install anaconda and create a virtual environment (strongly recommended) with conda or venv:

```bash
# install anaconda
wget https://repo.anaconda.com/archive/Anaconda3-2023.09-0-Linux-x86_64.sh
bash Anaconda3-2023.09-0-Linux-x86_64.sh
 
# create new environment
conda create --name igm python=3.10

# activate environment to install IGM
conda activate igm
```

or one can install a virtual environment without needing to use conda by using the `venv` module that is built-in to `python`

```bash
# create igm venv environment
python3.10 -m venv igm

# activate environment to install IGM
source igm/bin/activate
```