#!/usr/bin/env bash
set -euo pipefail
export NEXT_PUBLIC_PAGES_BASE_PATH=/invito
rm -rf 'src/app/[locale]/templates' 'src/app/[locale]/editor' 'src/app/[locale]/i'
rm -f 'src/app/[locale]/page.tsx' src/app/robots.ts src/app/sitemap.ts
rm -rf .next out
cat > next.config.ts <<'CONFIG'
import type { NextConfig } from "next";
const config: NextConfig = {
  output: "export",
  basePath: "/invito",
  images: { unoptimized: true },
  trailingSlash: true,
};
export default config;
CONFIG
npm run build
test -f out/ru/admin/studio/index.html
test -f out/ru/admin/studio-v2/index.html
test -f out/ky/admin/studio-v2/index.html
touch out/.nojekyll
printf '%s\n' "${GITHUB_SHA:-$(git rev-parse HEAD)}" > out/studio-build.txt
cat > out/index.html <<'HTML'
<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0;url=/invito/ru/admin/studio-v2/">
<title>INVITO Studio</title></head><body><a href="/invito/ru/admin/studio-v2/">Открыть INVITO Studio</a></body></html>
HTML
