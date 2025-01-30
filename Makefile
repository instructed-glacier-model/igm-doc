SHELL := /bin/bash
GH_PAGE := igm-doc.github.io

.PHONY: update-build-version
update-build-version:
	git submodule update --remote --merge
	git add $(GH_PAGE)
	git commit -m "ci: update build version"
	
.PHONY: publish
publish: deploy update-build-version
	git push

.PHONY: deploy
deploy:
	cd $(GH_PAGE) && mkdocs gh-deploy --config-file ../mkdocs.yml --remote-branch main

# mike deploy --config-file ../mkdocs.yml --remote origin --push --update-aliases 2.2.3 latest --allow-empty