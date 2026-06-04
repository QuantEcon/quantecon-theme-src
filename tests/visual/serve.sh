#!/usr/bin/env bash
#
# Serve the visual-regression fixture with a chosen theme, for Playwright.
#
#   THEME_TEMPLATE   theme under test — either a local theme *build* directory
#                    (the 2.0.0 candidate) or a GitHub archive zip URL such as
#                    the deployed v1.1.1 baseline:
#                      https://github.com/QuantEcon/quantecon-theme/archive/refs/heads/main.zip
#   PORT             port to serve on (default 3111, matching playwright.config.ts)
#
# Used as Playwright's `webServer.command`.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
cd "$here/fixture"

: "${THEME_TEMPLATE:?set THEME_TEMPLATE to a local theme build dir or a zip URL}"

# Substitute the chosen theme into myst.yml, escaping sed replacement
# specials: backslash, ampersand (whole-match), and the `|` delimiter.
esc=$(printf '%s' "$THEME_TEMPLATE" | sed 's/[\\&|]/\\&/g')
sed "s|__THEME__|${esc}|" myst.yml.in > myst.yml

echo "[serve] template: $THEME_TEMPLATE"
echo "[serve] port:     ${PORT:-3111}"
exec myst start --port "${PORT:-3111}"
