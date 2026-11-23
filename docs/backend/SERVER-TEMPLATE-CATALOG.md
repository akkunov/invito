# Eventiq — public server template catalog (stage 2)

## Status

The public catalog API, Next.js listing and shared Studio v2 preview are wired.
The customer editor and customer-specific publication workflow are **not** wired
to server templates yet. Existing hardcoded demonstration templates still work.

## API

- `GET /api/v1/catalog/templates?page=1&limit=24&category=WEDDING&search=editorial`
  Anonymous; lists only `Template.status=PUBLISHED` with non-null `publicSlug`.
  Response `{items,total,page,limit,nextPage}`. Short-lived signed R2 image URL
  `coverUrl` may be null; do not persist or indefinitely cache signed URLs.
- `GET /api/v1/catalog/templates/:slug`
  Anonymous; returns published template metadata, latest immutable Studio v2
  document, personalization contract, version ID, and short-lived media URL map.
- `POST /api/v1/workspaces/:workspaceId/templates/:templateId/publish`
  Requires Supabase Bearer JWT and `ADMIN`/`OWNER` membership of the target
  Workspace. Body `{"publicSlug":"editorial-ivory"}`.
  Validates the contract, cover page and same-Workspace READY assets; publishes
  the template. Duplicate global public slugs return 409.

### Import → publish example

1. Import the JSON envelope documented in
   [TEMPLATE-PACKAGE-V1.md](./TEMPLATE-PACKAGE-V1.md). It creates a DRAFT template.
2. With an ADMIN/OWNER token, POST the publish request above for the imported ID.
3. Refresh `/ru/templates` (or `/ky/templates`). Published server templates
   appear as a distinct collection above the legacy demo designs.
4. Open `/ru/catalog/:slug` to preview the Studio v2 document on mobile.
5. Do not promise customer editing from that page yet: the mobile customer editor
   still uses legacy `seed-templates`. This is stage 3.

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
The implementation was committed to GitHub but local DB/R2 smoke tests still
need to run in an environment with the actual services.
