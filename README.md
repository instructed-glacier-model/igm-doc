
# This gives the main steps to maintain and publish this IGM documentation

# Set-up the first time

```bash
git clone https://github.com/instructed-glacier-model/igm
cd igm/
git checkout feature/hydra
git submodule update --init
```

# Then, when you do a change : Do this in 1) igm-doc, and then in 2) igm ...

```bash
git pull
# DO THE CHANGES
git add .
git commit -m "removed help submodule testing"
git push  
```


