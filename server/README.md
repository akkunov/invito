# INVITO server — #29.1 persistence contract

This directory is a **schema and domain-contract layer**, not an already-running NestJS API. It contains the Prisma 7/PostgreSQL data model, a CLI migration configuration, environment variable names and pure server-side validators. No production database is touched. All existing browser-local user projects are preserved.

## Current validation

From the repository root (Node.js 22.18+):

```bash
npm ci
npm run test:backend-contract
npx --yes prisma@7.10.1 validate --schema server/prisma/schema.prisma
npm run typecheck
```

The Prisma CLI runs in **schema-only validation** mode here, with no actual database connection. Do not run `prisma migrate dev` against a shared or production database.

## Prisma setup for #29.2

Implement the server as a separate NestJS 12 ESM service using Prisma ORM 7.10.1, `@prisma/adapter-pg`, `pg` and TypeScript 5.9+ with its **own checked-in package-lock.json**. Keep server dependencies separate from the Next.js UI package. For CLI migration commands use `server/prisma.config.ts`, provide a **real** `DIRECT_DATABASE_URL`, and review migration SQL before `migrate deploy`. Runtime queries use `DATABASE_URL`. Never commit either environment variable's actual value.

The generated Prisma client is output to `server/src/generated/prisma` and deliberately ignored by git. The first executable server PR will add dependency lockfile, `prisma generate`, Nest modules, dedicated migrations and PostgreSQL end-to-end CI, not mock network endpoints.

## Contract recap

- Members/roles are looked up from authenticated workspace membership.
- Project and template JSON snapshots are parsed using existing Studio v2 Zod validators. The renderer and customer personalization contract are not duplicated.
- `expectedRevision` / `expectedVersion` / `expectedRelease` provide optimistic concurrency; revisions/releases are append-only.
- Public invite links select an **ACTIVE** publication and its **committed release**, never the editor working copy.
- Browser `local:` assets cannot be saved to the backend. Uploaded media must be verified and mapped to `asset:<UUID>`; bundled assets require a known-static-resource allowlist.
- No auth tokens, payment credentials, raw image data or public RSVP writes exist in this module.

Read [ADR-029-01](../docs/backend/ADR-029-01-PERSISTENCE.md) for endpoints, transaction rules, privacy and the implementation sequence.
