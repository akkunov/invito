# Studio v2 delivery policy — Editor Pro

Every module is implemented in its own branch from current main. Keep the established Studio design, backward-compatible document contracts, shared command and rendering engines, RU/KY content, and legacy invitations intact. One module = one reviewable PR and a regression suite. No direct untested pushes to main.

## Required gates

1. Implement the module + pure regression tests, including history, validation and migration/compatibility cases where relevant.
2. Run the existing GitHub Actions quality suite: all prior regression tests, TypeScript, production build and public route checks.
3. Build exactly the static GitHub Pages preview with scripts/build-studio-pages.sh. On PRs, host that export locally under /invito and use real Chromium to verify representative desktop and mobile behavior, persistence, runtime errors and screenshots. Add new user workflows to the browser suite as each module is implemented.
4. Only merge a PR after all required checks for the current head SHA are successful; do not merge failing or pending checks. Recheck mergeability and the expected head SHA.
5. The main Pages workflow builds and deploys the same static preview. It verifies the commit identity at /invito/studio-build.txt and runs Chromium against the real public URL. Save screenshots as workflow artifacts. Do not start the next dependent module until the deployment and post-deploy test succeed. Fix failures first; do not describe an unverified deployment as passed.
6. Manual visual review / native Safari, iOS and Android checks are distinct from Chromium automation. Never claim these were performed without evidence.

GitHub Pages has one public deployment for this repository: PR testing uses an isolated static build, not overwriting the public demo. Post-merge smoke testing uses the actual published URL. Static Pages is a demo only; it cannot verify a future server-side publishing/RSVP backend.

## Roadmap

- #28.1 Canvas & Selection Pro — PR #41.
- #28.2 Advanced Properties & Page Management — PR #42.
- #28.3 Linked Components & Variants Pro — stable master IDs, overrides and reconciliation.
- #28.4 Design Tokens & Shared Styles.
- #28.5 Animation Engine & Timeline.
- #28.6 Responsive Editing Pro.
- #28.7 Template Manager & full import/export.
- #28.8 Simple Editor / Studio Pro.
- #28.9 Performance, Browser QA & Recovery.
- #29 Backend, Auth & Publishing.
- #30 QA & Migration.

Keep future feature contracts in versioned ADRs. No mass replacement of templates or rework of approved design without an explicit product decision.
