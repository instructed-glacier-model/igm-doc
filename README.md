
# This gives the main steps to maintain and publish this IGM documentation

Here we use mkdocs with thema material (https://pawamoy.github.io/mkdocs-gallery/)

```bash
pip install mkdocs
pip install mkdocs-material
```

URL of the documentatiON : https://jouvetg.github.io/igm-doc.github.io/ (not ideal, to be changed)


We mostly follow the instruction from : https://dev.to/ar2pi/publish-your-markdown-docs-on-github-pages-6pe

Here will be to ensure versionning : https://github.com/squidfunk/mkdocs-material-example-versioning
(example : https://squidfunk.github.io/mkdocs-material-example-versioning/0.2/)

Build the website and test in a browser: (Navigate to http://127.0.0.1:8000/ to view your site)

```bash
mkdocs serve
```

Pulish the website:

```bash
make publish
```


