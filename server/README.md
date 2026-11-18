# INVITO API — #29.2 Backend Core

NestJS 12 + Prisma 7.10.1 + PostgreSQL. Source lives in the **same repo** as the Next.js frontend, but installs/builds independently in `server/`.

## Prerequisites

- Node.js >= 22.18, npm, Docker (or a disposable PostgreSQL 17 database)
- A trustworthy OIDC provider that issues **RS256 signed JWT access tokens** with `iss`, `aud`, `sub`, `iat` and `exp`. Opaque OAuth tokens are not supported by this API.
- A separate DB and identity provider for development, preview, and production.

## Local setup

```bash
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

- Only JWTs verified against `AUTH_JWKS_URL` with the configured `AUTH_ISSUER` and `AUTH_AUDIENCE`, `RS256`, and a maximum token age of 15 minutes are accepted.
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

For Vercel create a separate project from `akkunov/invito`, set Root Directory to `server`, Node.js >=22, and configure production credentials. No credentials are committed.

## Deliberate scope limits

This stage implements actual authorization, identity and workspace access, not project/template CRUD, file upload, publication/RSVP or payment APIs. Those remain in #29.3–#29.6. Existing local Studio drafts are untouched; a future sync adapter is required.

See [ADR-029-01](../docs/backend/ADR-029-01-PERSISTENCE.md).
