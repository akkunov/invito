# ADR-018 — Professional Print (#28.7.3)

## User workflow

In Template Manager > Professional Print select the page, media width in mm and optional inward bleed (0–10 mm). The existing artwork is not distorted or automatically extended. Media is the complete artwork; trim is inset by bleed on all four sides. For example, 111 mm media width with 3 mm bleed means 105 mm trim width. Extend backgrounds and keep important content inside the trim in Studio.

- **Vector PDF (print)** opens the browser print dialog on the same measured, styled and self-contained artboard, using an isolated iframe and physical CSS page geometry. Choose Save as PDF, default scale, no margins or headers, background graphics enabled. Supported text/shape primitives remain vector; CSS effects and photographs may be rasterized by Chromium. Browser PDFs are RGB, not certified PDF/X, and have no separate trim/bleed metadata.
- **Package for CMYK / PDF/X-4** downloads a self-contained .invito-print.json file including static DOM, embedded raster resources, computed styles, media and trim geometry. No server or external requests. Only export packages from trusted Studio projects. It is not yet a PDF.

## Local conversion

Prerequisites: Node.js 22+, Playwright with Chromium available locally, appropriate system fonts (Arial/Georgia or their compatible substitutes, including Cyrillic), Ghostscript 10.06+ for CMYK and PDF/X-4 (use a current patched release). Install Playwright separately from the static Next runtime, e.g. npm install --no-save --package-lock=false playwright and npx playwright install chromium, or use STUDIO_BROWSER_PREFIX from the existing CI install script.

```sh
npm run print:professional -- design.invito-print.json design-vector.pdf vector
npm run print:professional -- design.invito-print.json design-cmyk.pdf cmyk /path/to/press.icc "Actual press condition"
npm run print:professional -- design.invito-print.json design-x4.pdf pdfx4 /path/to/press.icc "Actual press condition"
```

The ICC is supplied by the print provider; no arbitrary default or naive RGB-to-CMYK formula. Header validation requires a complete CMYK printer/output profile. Color conversion uses the Ghostscript CMS and target profile; no forced downsampling. The PDF/X-4 path adds embedded OutputIntent, trim/bleed metadata, and uses Ghostscript's PDF/X-4 generation and compatibility abort policy. **It requires INVITO_PDFX_VALIDATOR**, the absolute path to an independently configured preflight executable, receiving one candidate PDF path and returning 0 only if it passes PDF/X-4 conformance. For example, integrate a licensed preflight tool with a wrapper using the vendor's documented CLI and PDF/X-4 validation profile. Without this configuration, conversion rejects before creating output. INVITO_GS optionally selects the installed Ghostscript executable. Ordinary CMYK output is not PDF/X-4 and does not claim it.

Use a current patched Ghostscript installation and review AGPL/commercial license requirements before distributing it or running a proprietary hosted service. Local CLI is not an HTTP service. External executable paths must be operator-controlled; never expose them to public client input. A server-side queue/auth, resource limits and network isolation belong to #29. Local converter currently launches Chromium with JS disabled and external requests blocked, and invokes Ghostscript using argument arrays and SAFER permissions; temporary files are removed.

## Verification and limits

Unit tests check geometry, package and CMYK ICC header, generated PostScript intent and trim offsets. Chromium pipeline test exports actual Studio artwork, creates PDF with the local vector path, checks searchable Cyrillic text, font embedding, one page and physical dimensions using Poppler. These tests do **not** verify a real CMYK press profile or full PDF/X-4 compliance; that requires installed Ghostscript and independent preflight tool with the actual profile, plus a proof review. CSS filters may flatten part of the artwork; not a promise that every element is vector. No automatic CMYK soft proof, spot colors, professional ink limits or imposition in browser.

References: Playwright page.pdf (https://playwright.dev/docs/api/class-page#page-pdf); Ghostscript PDF/X options (https://ghostscript.readthedocs.io/en/gs10.06.0/VectorDevices.html); PDF Association requirements (https://pdfa.org/technical-side-and-requirements-of-pdfx).
