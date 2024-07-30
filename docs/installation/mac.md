IGM core library native Tensorflow is not supported on Mac for GPU usage. Instead, a "Tensorflow for Mac", called [tensorflow-metal](https://developer.apple.com/metal/tensorflow-plugin/), was developed as workaround. To install IGM on Mac, you may follow the linux workflow, however, you will need to change in setup.py tensorflow by tensorflow-macos. Here is a working procedure (tested on MacBook Pro M2) -- still we recommend using a virtual environment such as conda or venv as on linux:

```bash
git clone -b develop https://github.com/jouvetg/igm
cd igm
```
You need to edit "install_requires=[...]" in the file "setup.py":

* To use only the CPUs: `tensorflow-macos==2.14.0`
* To use the GPUs: `tensorflow-macos==2.14.0, tensorflow-metal,`

and then
```bash
pip install -e .
```