#!/usr/bin/env bash
set -euo pipefail
prefix="${RUNNER_TEMP:?}/invito-browser"
npm install --prefix "$prefix" --no-save --package-lock=false --ignore-scripts playwright@1.56.1
"$prefix/node_modules/.bin/playwright" install --with-deps chromium
echo "STUDIO_BROWSER_PREFIX=$prefix" >> "$GITHUB_ENV"
