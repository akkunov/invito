# ADR-029-03 — Studio v2 remote persistence and revision sync

**Scope:** #29.3, based on merged #29.2 Backend Core. The server is a new, independent NestJS app in `server/`; legacy frontend `InvitationDocument` is **not** implicitly coerced into Studio v2.

## What is shipped

- Authenticated, workspace-scoped Template and StudioProject APIs, with OWNER/ADMIN/EDITOR/VIEWER privileges enforced from `WorkspaceMember` in PostgreSQL.
- Initial TemplateVersion / ProjectRevision created atomically at number **1**. Every subsequent write uses compare-and-swap with `expectedVersion` or `expectedRevision` and appends an immutable snapshot and audit entry.
- Server validates documents by importing **the same** Studio v2 Zod schema from the frontend source. No duplicated permissive JSON schema. `schemaVersion:2` required, including Studio's page/node/asset limits and personalization contract validation.
- List endpoints paginate metadata only (no entire JSONB snapshots).
- `local:` media refs and any `asset:<UUID>` that is not verified READY in this workspace cause 422. Bundled static media are restricted to a server maintained allowlist.
- Opt-in client adapter `src/features/studio-v2/browser/remote-sync.ts` and opt-in Cloud panel for `StudioV2Workspace` (accessible **only** when real `remoteSettings` with OIDC bearer token supplier are injected). No fake logins or secrets.
- On 409, return latest server copy to the user **without modifying IndexedDB**. User can download the server copy, open it as a different local project, or explicitly create a second remote project. Network failure keeps local draft.

## REST API

All routes are under `/api/v1`; all require a verified OIDC access token.

| Method | Route | Minimum role | Result |
| --- | --- | --- | --- |
| GET | `/workspaces/:workspaceId/templates?page=1&limit=20` | VIEWER | metadata page and nextPage |
| POST | `/workspaces/:workspaceId/templates` | EDITOR | create template + immutable version 1 |
| GET | `/templates/:id` | VIEWER | metadata |
| GET | `/templates/:id/versions/:number` | VIEWER | one immutable snapshot + policy |
| POST | `/templates/:id/versions` | EDITOR | append after expectedVersion CAS |
| GET | `/workspaces/:workspaceId/projects?page=1&limit=20` | VIEWER | metadata page |
| POST | `/workspaces/:workspaceId/projects` | EDITOR | new project + revision 1 |
| GET | `/projects/:id` | VIEWER | metadata and latest committed revision |
| GET | `/projects/:id/revisions/:number` | VIEWER | immutable snapshot |
| PUT | `/projects/:id/revisions` | EDITOR | append after expectedRevision CAS |

**Response codes:** unauthenticated 401; authenticated member with insufficient role 403; resource outside tenant 404; stale write 409; invalid Studio v2 document/contract or unuploaded asset 422. Duplicate template slug also 409. Request payload bound to 2 MB.

### Example create/save

```http
POST /api/v1/workspaces/{workspaceUUID}/projects
Authorization: Bearer <verified-oidc-token>
Content-Type: application/json

{"title":"Моё приглашение","document":<StudioV2Document>}
```

Then save only when server returns project UUID and revision 1:

```http
PUT /api/v1/projects/{projectUUID}/revisions
Authorization: Bearer <verified-oidc-token>
Content-Type: application/json

{"expectedRevision":1,"document":<updated-StudioV2Document>}
```

The client-side `ProjectDocumentV2.revision` is **not** the server-side `StudioProject.latestRevision`. They are separate counters.

## Safe deployment and next work

1. The backend's `tsc` ESM compilation includes canonical schemas from `../src/features/studio-v2/core`. CI installs dependencies in both repository root and `server/`, then executes `npm run build`, `npm start` smoke and PostgreSQL integration.
2. Vercel separate-project deployment must provide root source files outside `server/` as well as backend dependencies (set the monorepo source inclusion options or refactor into a shared `packages/contracts` build before deployment). This is not yet a live production API.
3. To enable Cloud UI, connect a **real** OIDC PKCE/token provider and pass `remoteSettings` with `accessToken` returning a short-lived bearer access token, API URL, and workspace UUID. Do not store access tokens in localStorage or Next.js public environment variables. Without this, existing offline Studio UI is unchanged.
4. Existing IndexedDB drafts stay intact; no background sync, destructive migration or implicit overwriting.
5. Actual uploads to R2 and asset-ref resolution are #29.4. Publication and RSVP are #29.5. Those APIs remain unavailable, and this release makes no promise of publishing or billing.

## Quality gates

GitHub workflow `.github/workflows/backend-core.yml`: Prisma validation, compile, migration to isolated PostgreSQL 17, E2E (tenant isolation, JWT, role denial, immutable versions, stale & concurrent 409, unuploaded media 422) and compiled Node smoke. Frontend TS, backend-contract tests and remote-sync transport tests also run. No production secrets or DB are accessed.
