# eventiq API — #29.2 Backend Core

NestJS 12 + Prisma 7.10.1 + PostgreSQL. Source lives in the **same repo** as the Next.js frontend, but installs/builds independently in `server/`.

## Prerequisites

- Node.js >= 22.18, npm, Docker (or a disposable PostgreSQL 17 database)
- The eventiq Supabase project configured with **asymmetric ES256 or RS256 JWT Signing Keys**, issuer and JWKS. Only signed user-session tokens with `role=authenticated` and `session_id` may call private routes. Opaque tokens and legacy HS256 are not supported.
- A separate DB and identity provider for development, preview, and production.

## Local setup

```bash
npm ci # shared Studio schema dependencies in repository root
cd server
docker compose up -d postgres
cp .env.example .env
npm ci
npm run prisma:generate
npm run db:migrate:deploy
npm run start:dev
```

On Windows PowerShell use `Copy-Item .env.example .env`. The example secrets are **only** for the local Docker database; never expose it externally.

```text
GET http://localhost:4000/api/v1/health          (public liveness)
GET http://localhost:4000/api/v1/health/ready    (PostgreSQL readiness)
GET http://localhost:4000/api/v1/me              (Bearer JWT)
GET http://localhost:4000/api/v1/me/workspaces
POST http://localhost:4000/api/v1/workspaces
GET http://localhost:4000/api/v1/workspaces/:workspaceId
PATCH http://localhost:4000/api/v1/workspaces/:workspaceId
```

`POST /workspaces` accepts `{"slug":"my-studio","name":"My Studio"}`. `PATCH /workspaces/:id` accepts only `{"name":"Updated"}` and requires ADMIN or OWNER.

## Authorization security

- Supabase Auth JWTs are checked against the project's HTTPS JWKS, exact `AUTH_ISSUER`, `AUTH_AUDIENCE=authenticated`, `ES256/RS256`, signature, expiry, role and verified user-session ID. The older generic OIDC test provider still uses RS256.
- Valid identity is persisted in `AuthIdentity(provider, subject)`. Unverified email is *not* used for account linking, and accounts with DISABLED status get 403.
- `WorkspaceMember` is queried on every protected workspace operation; client-supplied roles and identity fields are ignored.
- Nonmembers get 404 (tenant existence not disclosed). Authenticated VIEWERs receive 403 for ADMIN actions.
- Missing OIDC configuration makes private routes return 503 rather than granting access. No local bypass or hard-coded admin credentials.
- CORS accepts only `FRONTEND_ORIGINS`; tokens are sent in Authorization headers, not cookies. Do not put OAuth secrets in `NEXT_PUBLIC_*`.

## Prisma and migrations

- Runtime connection: `DATABASE_URL` through `@prisma/adapter-pg`.
- CLI migrations: `DIRECT_DATABASE_URL` (no pooler) via `prisma.config.ts`.
- SQL migrations are checked into `prisma/migrations`; **never run `migrate dev` against staging/production**.
- Review migration SQL and run `npm run db:migrate:deploy` on a disposable database first.
- Production migrations belong in a controlled CI/CD release step, **not** a Vercel request handler or build hook.

## CI and deployment

`.github/workflows/backend-core.yml` builds the API and tests JWT and workspace isolation on a real PostgreSQL service. Backend has its own checked-in `server/package-lock.json`; CI uses reproducible `npm ci` (the root Next.js lockfile remains independent).

The API compiles the shared canonical Studio v2 validators from `../src/features/studio-v2/core`. CI installs root frontend dependencies for that shared build, and you must allow source files outside the Vercel Root Directory when deploying separately. Do not replace them with weaker duplicate schemas.

For Vercel create a separate project from `akkunov/invito`, set Root Directory to `server`, Node.js >=22, and configure production credentials. No credentials are committed.

## Deliberate scope limits

This stage implements actual authorization, identity and workspace access, not project/template CRUD, file upload, publication/RSVP or payment APIs. Those remain in #29.3–#29.6. Existing local Studio drafts are untouched; a future sync adapter is required.

See [ADR-029-01](../docs/backend/ADR-029-01-PERSISTENCE.md).

## #29.4 — Private R2 Media Storage

**No R2 setup is required to boot the API:** when credentials are absent, all media initiation and read operations fail closed with 503. Never set media credentials in the Next.js frontend or commit .env values.

Set `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and optional `R2_ENDPOINT` in the **backend Vercel project**. The bucket must remain **private**. For browser direct PUT, configure bucket CORS with exactly your trusted editor origins and `PUT` + `Content-Type` (sample: `docs/backend/ADR-029-04-MEDIA.md`).

**Upload lifecycle** (all endpoints require the verified OIDC bearer token):
1. `POST /api/v1/workspaces/:workspaceId/media/uploads`: editor sends `{name,mimeType,bytes,sha256}`; receives 180-second signed PUT URL and exact Content-Type header. Nothing is READY yet.
2. Browser sends the **raw Blob** by PUT to the signed R2 URL, without JWT or any other API credentials.
3. `POST /api/v1/workspaces/:workspaceId/media/:assetId/complete`: server reads private R2 staging bytes with a hard upper bound, recomputes SHA-256 and MIME, decodes raster / parses MP3, copies verified bytes to a server-only immutable key, commits READY metadata in PostgreSQL.
4. `GET /api/v1/workspaces/:workspaceId/media/:assetId/read-url`: authorized workspace viewer receives a 60-second private image GET URL (20 minutes for MP3 playback). `GET /api/v1/workspaces/:workspaceId/media` lists only READY metadata, never actual R2 object keys.

Raster: PNG/JPEG/WebP up to 20 MiB, max side 4096px and max decoded pixels 32 MP. MP3: up to 15 MiB, max duration 15 minutes, valid MPEG audio. SVG and arbitrary codecs are rejected by the **server**, even if the browser supports local SVG rasterization.

Quota: 500 MiB per workspace, 20 pending uploads, 15-minute server completion window. No public bucket URL, delete API or guest access is provided. Configure R2 lifecycle cleanup for `staging/` orphaned objects.

Cloud save in Studio v2 uses `prepareCloudSnapshot` to upload local images when the user explicitly clicks Save. It does **not** replace IndexedDB records or delete local image blobs. Studio v2 music widgets support an explicit MP3 upload button when an OIDC workspace session is provided. Their `block.source` holds `asset:UUID`, checked against READY audio/mpeg records in the same workspace, rather than reusing image-only `ProjectDocumentV2.assets`. Guest playback for public publications remains #29.5.

**Deployment:** Existing #29.3 build includes shared Studio schema files from `../src`; the backend still needs the monorepo root in its Vercel build context. Production R2 credentials and CORS must be configured manually; CI fakes the R2 object boundary and verifies server logic against a disposable PostgreSQL 17 database, not a real R2 bucket.

## #29.5 — Publishing and RSVP

Publishing is transactional and append-only. Each project has one stable public slug, with versioned releases and optimistic `expectedRelease`. Owner/ADMIN may publish; EDITOR may review private RSVPs. The anonymous guest API serves only the ACTIVE release, via no-store and short-lived private media links. See `docs/backend/ADR-029-05-PUBLISHING.md` for REST requests, data protection, anti-spam policy and deployment steps.

Set `RSVP_TURNSTILE_SITE_KEY` and `RSVP_TURNSTILE_SECRET` on the backend for **production** RSVP. Without both, anonymous submissions return 503 in production. On the frontend set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`, deploy on an actual Next.js server runtime (GitHub Pages static export cannot host dynamic invitation slugs), and connect real OIDC `remoteSettings` to expose the Studio Publishing panel. No production data is migrated automatically.

## Current cloud login (Supabase Auth)

The Keycloak setup has been superseded. See [Supabase Auth for Studio v2](../docs/studio-v2/SUPABASE-AUTH.md) for the signing-key setup, frontend publishable-key variables, backend JWT issuer/JWKS, sign-up confirmation and troubleshooting. No service_role or JWT secret is needed in the Next.js frontend. Existing local Studio drafts remain independent of cloud sessions.
