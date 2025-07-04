SHELL := /bin/bash
	
.PHONY: deploy-tag
deploy-tag:
	mike deploy --config-file mkdocs.yml --remote origin --push --update-aliases TAG latest --allow-empty

.PHONY: deploy-latest
deploy-latest:
	mike deploy --config-file mkdocs.yml --remote origin --push --update-aliases latest --allow-empty
