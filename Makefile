.PHONY: check build-theme build-zip

# Releases ship via the tag-triggered GitHub Release workflow
# (.github/workflows/release.yml) — see CONTRIBUTING.md "Releases".
# The old `make deploy` flow (pushing the bundle to the now-archived
# QuantEcon/quantecon-theme build repo) was retired with it.

THEME = quantecon-theme
VERSION = $(shell cat package.json | jq -r '.version')

check:
	@which jq > /dev/null || (echo "Error: the jq command is not available. Please install it first (brew install jq | apt-get install jq)." && exit 1)

# Assembles the same bundle the release workflow ships into .deploy/$(THEME).
# Used by the visual/FOUC test harness (THEME_TEMPLATE=$$PWD/.deploy/$(THEME))
# and for local artifact testing.
build-theme: check
	rm -rf .deploy/$(THEME)
	mkdir -p .deploy/$(THEME)
	find template -type f -exec cp {} .deploy/$(THEME) \;
	npm run prod:build
	cp -r public .deploy/$(THEME)/public
	cp -r build .deploy/$(THEME)/build
	cp CHANGELOG.md .deploy/$(THEME)/CHANGELOG.md
	sed -i.bak "s/VERSION/$(VERSION)/g" .deploy/$(THEME)/package.json && rm .deploy/$(THEME)/package.json.bak
	sed -E "s/^version: .*/version: $(VERSION)/" template.yml > .deploy/$(THEME)/template.yml
	cd .deploy/$(THEME) && npm install

# Zips the bundle for testing the release artifact locally (the release
# workflow attaches the equivalent zip to the GitHub Release).
build-zip: build-theme
	cd .deploy && rm -f $(THEME).zip && zip -rq $(THEME).zip $(THEME) -x "$(THEME)/node_modules/*"
	@echo "Wrote .deploy/$(THEME).zip"
