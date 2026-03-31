.PHONY: build-IssuerAgentFunction

build-IssuerAgentFunction:
	yarn install --frozen-lockfile
	yarn build
	cp -r dist node_modules package.json $(ARTIFACTS_DIR)/
