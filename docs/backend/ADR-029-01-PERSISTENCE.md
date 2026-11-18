# ADR-029-01 — INVITO backend persistence architecture

**Status:** accepted as the foundation for #29; no remote API or production database is deployed by #29.1.

## Goals and boundaries

Retain both clients: (1) Studio v2 designer workspaces and versioned templates, and (2) the customer's restricted personalization experience. The legacy public `InvitationDocument` remains a distinct frontend format until an **explicit migration adapter**, not an automatic coercion. The current IndexedDB drafts, source template registry, and exported `.invito.json` packages must continue to function offline.

- **Runtime target:** Node.js 22.18+ / NestJS 12, Prisma ORM 7.10.1 / PostgreSQL. Prisma v7 generator outputs a source-controlled-schema, generated **TypeScript client** to `server/src/generated/prisma` (generated files are ignored). The runtime will use `@prisma/adapter-pg` with `DATABASE_URL`; CLI migrations use `DIRECT_DATABASE_URL` via `prisma.config.ts`. These exact versions were selected based on the November 2026 upstream compatibility guides, not on a Next.js dependency lock.
- **Storage:** PostgreSQL for ownership, metadata, revisions, audit and RSVP; object storage (S3-compatible/R2) for verified images/audio. No binary or base64 raster payload is stored in JSONB.
- **Tenant:** Workspace, membership, role. Every private API takes the authenticated user identity from verified session context, resolves workspace membership from the database, and filters the resource query by `workspaceId`. Client-provided `role`, `workspaceId`, or `createdById` is not trusted as authorization evidence.
- **Never store secrets:** database connection, storage secret, signing keys, OAuth credentials, and raw client IP addresses do not belong to JSONB documents or audit metadata.

## Entity model

| Aggregate | Stable record | Append-only data | Main constraints |
| --- | --- | --- | --- |
| Identity | User, AuthIdentity | — | One external `provider + subject` maps to one account; explicit status |
| Tenant | Workspace, WorkspaceMember | AuditEvent | One membership per user/workspace; the last OWNER cannot be removed |
| Designs | Template | TemplateVersion | Unique slug **per workspace**, independent globally unique `publicSlug`, monotonic `latestVersion`, trusted Studio v2 document + optional editable contract |
| Customer projects | StudioProject | ProjectRevision | Monotonic `latestRevision`, optional reference to original TemplateVersion; revisions never overwrite |
| Files | MediaAsset | — | Workspace scope; unique opaque object key; PENDING → READY only after server validation |
| Public links | Publication | PublicationRelease | Unique global slug, ACTIVE/UNPUBLISHED; each immutable release references a project revision and stores the **finalized guest snapshot** |
| Invitations | — | RsvpResponse | Only responses to active publications, separate table with limited PII, consent and retention handling |
| Reliability | IdempotencyRecord | AuditEvent | Actor + route + key unique within workspace; no personally sensitive raw request bodies |

Template status `READY` is an editorial state; `PUBLISHED` means catalog visibility **only after** a trusted server publish action. Guest links are publications, not mutable editor projects.

## Versioning and concurrency

1. Parse each inbound document using the **existing** `parseProjectV2` Zod schema (schemaVersion 2, max 30 pages / 500 nodes / 200 assets). Validate an attached personalization contract via `personalizationSchema` and `contractIssues`.
2. For a `PUT /projects/:id/revisions` request, check trusted membership, resource workspace, `expectedRevision` and asset ownership. Transactionally update `StudioProject.latestRevision` with compare-and-swap (`UPDATE ... WHERE latestRevision = expected`), append the next ProjectRevision with SHA-256 and audit metadata. CAS miss → HTTP **409**, no data loss or silent merge.
3. Versions are never edited or deleted by normal business operations. Restores append a new version; they do not replace historical records. The 50-version Studio local history cap is a client limit, not a permission to discard server history.
4. Template updates follow the same `expectedVersion` CAS pattern.
5. Publication is a separate atomic transaction: trusted editor ownership → chosen stored ProjectRevision → final validation of personalization and media → append PublicationRelease (contains immutable finalized document) → advance `Publication.latestRelease`. Reads use only `status=ACTIVE` and the matching committed release number. A guest never reads the working revision.
6. For operations that may be retried (publish, payments later), compare `actor+route+idempotencyKey` and canonical request hash. Same hash returns previously committed outcome; different hash returns 409. Out-of-order updates never overwrite newer revisions. Handle serialization conflicts with bounded retries.

The service stores server revision numbers separately from `ProjectDocumentV2.revision`: the latter is the editor command-engine counter; neither is implicitly the other. A new project starts with revision **1** and an initial ProjectRevision in the same transaction.

## Media boundary

Documents currently permit `/images/... ` trusted bundled assets and `local:...` browser-only blobs. #29.1 reserves `asset:<UUID>` as the *only* new server-backed reference. This is intentionally **not** a public URL or object-storage key.

- Before persisting, upload each local blob via authenticated, size-limited signed PUT; server verifies actual bytes, file signature, MIME, dimensions (raster PNG/JPEG/WebP), hash, ownership and quota before marking READY.
- Replace local refs in the server snapshot with `asset:<UUID>`. Reject still-local refs at the persistence boundary. Permit `/images/...` only if on a server-maintained static allowlist.
- The server rendering adapter will resolve `asset:<UUID>` to short-lived approved CDN/signed URLs. Today's local `useMediaUrls` cannot resolve them yet: **server rendering and upload transports belong to #29.2+**.
- Remote asset replacement requires the same trusted explicit personalization permission as a local replacement, plus ownership and release checks. No SVG upload path is added.

## Auth, permissions and external routes (planned, **not implemented**)

Use short-lived access sessions with verified identity providers; HTTP-only Secure SameSite cookies where browser auth is used. Enforce CSRF on cookie-authenticated mutations, strict allowlisted origins, rate limits and audit. Use WorkspaceMember for all private operations, not an unverified frontend role.

| Endpoint | Permission | Key constraints |
| --- | --- | --- |
| `GET /api/v1/me/workspaces` | authenticated | List memberships |
| `GET /api/v1/workspaces/:id/templates` | VIEWER+ | Workspace-scoped listing |
| `POST /api/v1/workspaces/:id/templates` | EDITOR+ | Trusted authored document; create immutable v1 |
| `POST /api/v1/templates/:id/versions` | EDITOR+ | expectedVersion; append only |
| `GET /api/v1/projects/:id` | VIEWER+ | Tenant-filtered project and selected revision |
| `POST /api/v1/workspaces/:id/projects` | EDITOR+ | Initial revision 1; source TemplateVersion is read-only |
| `PUT /api/v1/projects/:id/revisions` | EDITOR+ | expectedRevision, document, 409 on stale |
| `POST /api/v1/workspaces/:id/assets/uploads` | EDITOR+ | Signed upload initiation and quotas |
| `POST /api/v1/assets/:id/complete` | EDITOR+ | Verify bytes then READY |
| `POST /api/v1/projects/:id/publications` | ADMIN/OWNER | Reserve unique slug; unpublished initially |
| `POST /api/v1/publications/:id/releases` | ADMIN/OWNER | expectedRelease, idempotency key, finalized snapshot |
| `GET /api/v1/public/:slug` | anonymous | Only ACTIVE committed release, cacheable by release hash |
| `POST /api/v1/public/:slug/rsvp` | anonymous + rate limit | Validate, consent, duplicate control, expiry rules |
| `GET /api/v1/publications/:id/responses` | EDITOR+ | Tenant-filtered, paginated, access-audited |
| `PATCH /api/v1/workspaces/:id/members/:userId` | ADMIN/OWNER | Cannot delete/demote last OWNER |

Response rules: 401 no session; 403 insufficient role; use 404 for unauthorized cross-workspace resource identifiers to avoid enumeration; 409 on version conflict or idempotency mismatch; 422 for invalid or unapproved fields/media; 413 for request-size/quota violation; 429 for rate limits. Paginate listing endpoints; never emit full JSONB snapshots in a list.

## Operational and privacy gates

- Migration files must be reviewed, applied first to a disposable PostgreSQL database, and checked for indexes, referential integrity, tenant isolation and transaction conflicts before production. **#29.1 does not run migrations or touch a live database.**
- Run schema validation and standalone domain tests in PR CI; later build a dedicated NestJS service CI with isolated PostgreSQL and end-to-end API tests (NestJS project #29.2).
- Strong database access controls and secret rotation; backup encryption + restore drills; S3 lifecycle cleanup after deleted asset references are unreachable; audits without request bodies.
- RSVP guest names and messages are personal data: minimize fields, specify retention/deletion and export controls, protect with access restrictions, and avoid raw IP persistence. No RSVP endpoint is live in #29.1.
- No fake payment/RSVP/publishing actions in public UI; no real user data is migrated without an explicit plan.

## Follow-up modules

**#29.2:** executable NestJS 12 backend bootstrap (own lockfile), Prisma client and migrations, AuthIdentity sessions + workspace guards, PostgreSQL integration/transaction tests; adapters for cloud media. **#29.3:** template/project/version REST endpoints and Studio sync with offline conflict UX. **#29.4:** authenticated media ingestion and restricted customer project persistence. **#29.5:** validated publication releases, guest URLs, RSVP with rate limits and privacy controls. **#29.6:** payments, entitlements, domains and operations.

