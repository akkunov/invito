# INVITO Studio v2 — audit of routes, exposed features and numeric fields

Date: 2026-11-20  
Scope: current `main` after #29.5 and improvements proposed via `fix/studio-v2-number-fields-and-route-audit`.

## Route matrix

| Surface | Route / API prefix | Source | Expected |
| --- | --- | --- | --- |
| Main site RU/KY | `/{locale}` | `src/app/[locale]/page.tsx` | Next.js |
| Customer editor | `/{locale}/editor` | `src/app/[locale]/editor/page.tsx` | Next.js |
| Studio v2 | `/{locale}/admin/studio-v2` | `src/app/[locale]/admin/studio-v2/page.tsx` | Next.js |
| Template collection | `/{locale}/templates` | `src/app/[locale]/templates/page.tsx` | Next.js |
| Template detail | `/{locale}/templates/:slug` | `src/app/[locale]/templates/[slug]/page.tsx` | Next.js |
| Guest invitation | `/{locale}/i/:slug` | `src/app/[locale]/i/[slug]/page.tsx` | **Dynamic SSR**, not GitHub Pages |
| Upload/verify private media | `/api/v1/workspaces/:workspaceId/media/{uploads,:assetId/complete}` | `server/src/modules/media/media.controller.ts` | NestJS + OIDC |
| Project revisions | `/api/v1/projects/:id/revisions/:number` | `server/src/modules/documents/documents.controller.ts` | NestJS + OIDC |
| Publication management | `/api/v1/projects/:projectId/{publish,unpublish,publication}` | `server/src/modules/publications/publications.controller.ts` | NestJS + OIDC |
| Private guest answers | `/api/v1/projects/:projectId/rsvp` and `/rsvp/summary` | same | NestJS + DB role |
| Public invitation API | `/api/v1/public/invitations/:slug` | same | NestJS, no OIDC |
| Public RSVP | `/api/v1/public/invitations/:slug/rsvp` | same | NestJS, Turnstile in production |

## Audit of visible entry points

- **Export and print:** dedicated **Экспорт** toolbar action opens `StudioV2PrintDialog`; it shares `TemplateOutput` with Template Manager (PNG, vector RGB print, print package). Browser CI downloads a real PNG. **PDF/X-4 validation and conversion requires the separate professional-print CLI + ICC settings**; ordinary browser PDF is not CMYK PDF/X-4.
- **Publication:** visible **Публикация** action opens either the authenticated panel or an accurate missing-setup state; it never creates an implicit session.
- **Cloud:** visible **Облако** action opens the authenticated sync panel or a missing-setup state; IndexedDB and local files are not sent automatically.
- **Media:** verified R2 uploads, guest signed reads, and music widget input are wired via the existing backend, although live R2 configuration is not yet available.
- **Templates:** Template Manager remains mounted as a separate action.
- **Responsive, motion, styles, Inspector, and layers:** inspector navigation, responsive editor, motion controls and style binding modules remain reachable. Studio root should stay limited to navigation; individual controls live in their respective inspectors.
- **Numeric fields:** 9 Studio component modules share one native `<input type="number">` editor. Focus selects the value, blanks/negative/draft input remain editable, Escape reverts, Enter commits, and invalid edits do not turn into 0. Main X/Y/W/H/rotation fields expose optional small steppers and Shift+Arrow acceleration. Browser tests cover this.

## Deployment conditions

**Do not mistake source integration for production availability.** Studio's browser can work locally without cloud services. Full guest publishing needs real OIDC access tokens, a PostgreSQL migration, private Cloudflare R2, Next.js SSR deployment and production Cloudflare Turnstile. The GitHub Pages static workflow strips the dynamic `/i/:slug` route intentionally.

## Priority recommendations

1. **P0 — Deployment integration:** configure real identity provider, backend host, migrations, private R2 bucket, CORS and Turnstile in staging; test a full Studio -> cloud save -> publish -> RSVP -> unpublish lifecycle with actual devices.
2. **P0 — Production authorization:** keep backend RBAC and guest-data access server-side; audit DNS/HTTPS/CORS, release URLs and abuse thresholds under real traffic.
3. **P1 — Cloud identity:** store project-to-workspace link in the user's authenticated account rather than relying only on browser `localStorage` for the current cloud project ID; support cross-device project discovery.
4. **P1 — Inspector ergonomics:** consolidate X/Y/W/H/rotation, opacity and min/max constraints under reusable field groups with clearer units, multi-select mixed values and a single undo operation for each editing session. Avoid placing animation controls inside the Design tab.
5. **P1 — Public media:** consider a public delivery proxy/domain with expiring capability strategy and caching policy so signed URL rotation does not cause unnecessary image loads.
6. **P1 — RSVP management:** add export, advanced filtering, retention and guest-data deletion settings with a visible privacy notice. Rate limiting and Turnstile need external staging verification.
7. **P2 — Print:** automate color-profile selection and PDF/X-4 compliance tests with the printing house; keep RGB browser output labeled accurately.
8. **P2 — UX tests:** keep full Chromium tests in PR CI for export, cloud/publish setup, numeric inspector, editor routing, guest RSVP and GitHub Pages static preview.

### Validation contracts

`npm run test:studio-v2-route-audit` checks the route matrix, module entrypoints, and native numeric field adoption. Existing CI additionally runs PostgreSQL E2E, TypeScript, Next.js build and real Chromium tests. These checks cannot substitute for a live production smoke test.
