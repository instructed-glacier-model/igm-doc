---
title: IGM
template: home.html
hide:
  - footer
---

# Before to start

- If you don't know anything about glacier processes, explore this great [website](https://www.antarcticglaciers.org/). If you don't know anything about glacier evolution modeling, you may watch first this [video](https://youtu.be/eJNIr_0zOyk), which gives some basics. 

- **OS:** IGM was developed in a Linux environment but works on Windows and Mac. Windows user are strongly recommended to use [WSL2](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux) for using the GPU and the OGGM shop module. 

- **Disclaimer:** IGM implements empirical physical laws, with an important amount of approximations (of any kind). Make sure to understand what you do, to explore key parameters, and interpret the results with care.

# How to start

Running IGM consists of running a python script `igm_run`, which is made of functions of the IGM python package. This documentation will help you to understand the parameters and, set-up your model by listing the modules you need, customize your own modules for your application.

- First, start with the 10-min [video tutorial](https://vimeo.com/884003820), or a longer [IGS seminar presentation](https://youtu.be/dQH1PGzAF54), and/or look at the in-progress IGM [technical paper](https://github.com/jouvetg/igm-paper/blob/main/paper.pdf).

- Then, [install](https://github.com/jouvetg/igm/wiki/1.-Installation) an igm python environment on your system and starting with [examples](https://github.com/jouvetg/igm/wiki/2.-Examples--(quick-start)).

- Then, learn how to run [IGM](https://github.com/jouvetg/igm/wiki/3.-Runing-IGM) with module list and parameter setting (without extra coding), and explore the [module documentation](https://github.com/jouvetg/igm/wiki/4.-IGM-module-documentation).

- Last, understand the code and write your [own module code](https://github.com/jouvetg/igm/wiki/5.-Custom-modules-(coding)). 
