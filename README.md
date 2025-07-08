
# This gives the main steps to maintain and publish this IGM documentation


# First get the igm, with the submdule igm-doc

```bash
git clone https://github.com/instructed-glacier-model/igm
cd igm/
git checkout feature/hydra
git submodule update --init
```

# Second, ...

```bash
git switch main
# MAKE CHANGE
git add .
git commit -m "removed help submodule testing"
git push  
make deploy-latest
```


