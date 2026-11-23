# Eventiq Template Package v1 — first server import slice

This is a **JSON-only** package contract. It is intentionally distinct from the existing
browser-local `.invito.json` format and is not a ZIP/media uploader. Admin Studio v2 remains untouched.

## Purpose

An administrator may prepare a Studio v2 template outside the online designer, upload
its images/audio through the existing authenticated R2 media flow, then submit a versioned
JSON package. The backend creates a **DRAFT** Template and immutable TemplateVersion 1.
This does not make the design public or create a customer invitation.

## Package

```json
{
  "format": "eventiq-template",
  "version": 1,
  "manifest": {
    "slug": "editorial-ivory",
    "name": "Editorial Ivory",
    "description": "Minimal wedding invitation",
    "category": "WEDDING",
    "tags": ["wedding", "editorial"],
    "coverPageId": "cover"
  },
  "document": {},
  "personalization": {
    "version": 1,
    "locales": ["ru", "ky"],
    "fields": []
  }
}
```

`document` above is a **placeholder**; a real import requires a valid
`ProjectDocumentV2` snapshot, with the coverPageId found in its pages. The
`personalization` contract must point to existing binding keys, image nodes,
widgets and themes in that document. Use non-empty permissions for customer-editable
templates. Invalid contract targets fail with 422.

### Media workflow

1. Authenticate as an ADMIN/OWNER of the destination Workspace.
2. Upload files through `POST /api/v1/workspaces/:workspaceId/media/uploads`,
   PUT to the signed R2 URL, then call `POST /api/v1/workspaces/:workspaceId/media/:id/complete`.
3. Reference verified `asset:UUID` keys in the Studio document and match its asset metadata.
   Local keys (`local:`), foreign Workspace assets and arbitrary URLs are rejected.
   Only the existing explicitly trusted built-in static images may use `/images/...` keys.
4. Submit the JSON object to:

   `POST /api/v1/workspaces/:workspaceId/template-packages/import`

   Include the Supabase Auth `Authorization: Bearer <access_token>` header.
   A successful import responds with template ID, slug and latestVersion 1.
5. Review the imported template separately; public catalog publication and
   customer-editor wiring are **not implemented by this endpoint**.

## Security and behavior

- Workspace ID comes from the authenticated route, not the package.
- Only ADMIN/OWNER may import. An authenticated non-member receives 404;
  insufficient role receives 403.
- Strict Zod manifest validation, shared Studio snapshot and personalization
  verification, same-Workspace READY asset verification and Prisma transactional
  create are reused.
- Duplicate Workspace slug returns 409. No executable HTML/CSS/JavaScript is accepted
  as a direct package entry; content is rendered only by approved Studio components.
- Current API uses NestJS/Express's JSON body parsing size policy. Large packages
  may exceed that limit; do not enlarge it without reviewing request quotas and DoS controls.
- This API **does not** grant customers ownership or publication rights. A separate
  customer Invitation model and release flow are the next stage.

## Local verification

```powershell
cd server
npm ci
npm run typecheck
npm test
```

The dedicated `test/template-package.test.ts` verifies the package envelope.
Integration testing additionally requires a Workspace with ADMIN/OWNER membership,
PostgreSQL and a valid Studio snapshot. No live R2/DB is exercised by the schema-only test.
