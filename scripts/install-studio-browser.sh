#!/usr/bin/env bash
set -euo pipefail
prefix="${RUNNER_TEMP:?}/invito-browser"
npm install --prefix "$prefix" --no-save --package-lock=false --ignore-scripts playwright@1.56.1
# GitHub's Ubuntu runner already has browser libraries. Keep Chromium independent of unrelated APT feeds.
"$prefix/node_modules/.bin/playwright" install --only-shell chromium
node - "$prefix" <<'JS'
const {chromium} = require(process.argv[2] + "/node_modules/playwright");
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent("<title>Chromium ready</title>");
    if (await page.title() !== "Chromium ready") throw Error("Chromium launch smoke failed");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
JS
if ! command -v pdftoppm >/dev/null || ! command -v pdfinfo >/dev/null; then
  apt_sources=(-o Dir::Etc::SourceList=/etc/apt/sources.list.d/ubuntu.sources -o Dir::Etc::SourceParts=-)
  sudo apt-get "${apt_sources[@]}" -o Acquire::Retries=3 update
  sudo apt-get "${apt_sources[@]}" -o Acquire::Retries=3 install -y poppler-utils
fi
echo "STUDIO_BROWSER_PREFIX=$prefix" >> "${GITHUB_ENV:?}"
