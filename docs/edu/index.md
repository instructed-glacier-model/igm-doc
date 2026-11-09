# Teaching with IGM

IGM runs a 3D ice-flow model on any glacier of the world from a short configuration file, which makes it a good tool
to teach glacier modelling. With [`oggm_shop`](../modules/inputs/oggm_shop.md), a glacier is set up from its RGI ID
alone; students can then calibrate the model, and run its past and future evolution in a few minutes.

[**Glacier Modelling**](https://jouvetg.github.io/glamod){:target="_blank"}, a Master course at the University of
Lausanne, is built on IGM, and all its material is open. Each student picks a glacier by its RGI ID and, step by
step in a notebook, calibrates the ice flow (sliding and ice softness) against observed speeds, calibrates the
surface mass balance so that the glacier reaches its Little Ice Age moraines and its present extent, then runs it
into the future under climate scenarios and estimates its response time. The notebooks run online on any Jupyter
service (Colab, Binder, …) or locally.

!!! tip "Light emulator for teaching"

    Choose the pretrained emulator `dahunet_edu`: it is very small and runs fast on a laptop CPU. It is less accurate
    than the standard emulators, but good enough for students to explore.

    ```yaml
    processes:
      iceflow:
        numerics:
          Nz: 2
          basis_horizontal: q1
          basis_vertical: molho
        unified:
          nbit_init: 0
          retrain_freq: 0
          network:
            pretrained: true
            pretrained_path: dahunet_edu.keras
    ```
