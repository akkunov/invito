# Eventiq — public server template catalog

## Status

The public catalog uses the Studio v2 renderer for template details. The
customer editor creates drafts from the public version. Built-in templates
continue to use their existing routes and draft format.

## API

- `GET /api/v1/catalog/templates?page=1&limit=24&category=WEDDING&search=editorial`
  Anonymous. Lists `Template.status=PUBLISHED` with a public slug and version.
  Response `{items,total,page,limit,nextPage}`. Short-lived signed R2 image URL
  `coverUrl` may be null; do not persist or indefinitely cache signed URLs.
- `GET /api/v1/catalog/templates/:slug`
  Anonymous; returns published template metadata, the pinned immutable Studio v2
  document, personalization contract, version ID, and short-lived media URL map.
- `POST /api/v1/workspaces/:workspaceId/templates/:templateId/publish`
  Requires Supabase Bearer JWT and `ADMIN`/`OWNER` membership of the target
  Workspace. Body `{"publicSlug":"editorial-ivory","expectedVersion":2}`.
  `expectedVersion` is optional for compatibility with earlier callers.
  Publish validates the contract, cover page and same-Workspace READY assets,
  then pins the validated version. A stale version, concurrent publish or
  duplicate global public slug can return 409.

### Import → publish example

1. Import the JSON envelope documented in
   [TEMPLATE-PACKAGE-V1.md](./TEMPLATE-PACKAGE-V1.md). It creates a DRAFT template.
2. With an ADMIN/OWNER token, POST the publish request above for the imported ID.
3. Refresh `/ru/templates` (or `/ky/templates`). Published server templates
   appear as a distinct collection above the legacy demo designs.
4. Open `/ru/catalog/:slug` to preview the Studio v2 document on mobile.
5. Follow the editor link on the detail screen. A new cloud draft can only use
   the currently published version. Existing draft reads, saves and release
   snapshots continue to use their original template version.

## Published versions

`Template.latestVersion` tracks new authoring revisions. `Template.publishedVersionId`
pins the version used by list, detail and new customer drafts. The database
requires the pinned version to belong to the same template. Appending an
authoring revision keeps the published version visible. An explicit publish
moves the pin after validating the new revision. The customer editor still
needs an owner-scoped entry point for reopening older draft versions from a
browser after the public version moves.

The additive `20261124010000_pin_catalog_template_version` migration backfills
only previously visible rows that have a public slug and a matching latest
version. It leaves customer drafts and publication snapshots untouched.
Deploy the backend after applying the migration. For an application rollback,
keep the column and relation in place. The prior API resumes its previous
catalog behavior and does not maintain the pin. Before switching forward again,
verify any templates written during the rollback and republish their intended
versions explicitly.

## Operational requirements

- Next.js server must reach NestJS via `API_INTERNAL_URL` (optional) or
  `NEXT_PUBLIC_API_URL`, default local `http://localhost:4000/api/v1`.
- NestJS needs working Prisma database and private R2 signing credentials for
  asset-backed cover thumbnails and preview media.
- All server fetches are `no-store`, because R2 signed URLs expire quickly.
  Public catalog does not require a browser JWT.
- R2 media assets are verified as READY inside the authoring Workspace before
  publishing; the public detail endpoint refuses unavailable assets.
- Frontend currently catches listing/network failures and preserves the
  legacy demonstration catalog rather than showing a blank page.

## Local checks

```powershell
git pull origin main
cd server
npm ci
npm run typecheck
npm test
npm run start:dev
# second terminal, from project root:
npm ci
npm run typecheck
npm run dev
```

Use Swagger `http://localhost:4000/api/v1/docs` to inspect the Catalog endpoints.
The PostgreSQL E2E suite checks the pinned version, explicit promotion, stale
publish rejection, tenant boundaries and edits to an existing draft. Use a
disposable PostgreSQL database for these tests. Verify R2 signing with a test
bucket before rolling out changes to a live environment.

Playwright Chromium checked the 390 px detail against the real API and a
disposable PostgreSQL database with a published V1 and a distinct V2. The cover
switched only after the successful V2 publish. [V1 while V2 is a draft](catalog-qa/pinned-v1-with-v2-draft.webp) · [V2 following explicit publication](catalog-qa/pinned-v2-after-publish.webp)
