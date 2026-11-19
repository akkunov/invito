# ADR-029-05 — Public invitations and RSVP

**Status:** #29.5 API + public Next.js route in `feat/29-5-publishing-rsvp`. Not deployed or connected to a live OIDC provider, R2 or Cloudflare Turnstile account.

## Architecture and trust boundaries

- Only OWNER/ADMIN Workspace members may publish or unpublish a project. EDITOR and higher may read private RSVP responses. VIEWER may view metadata but cannot publish or read guest names.
- Each project has at most one `Publication`, with a global immutable slug. Each explicit publish action creates a new **append-only `PublicationRelease`**, referencing an immutable, validated `ProjectRevision`. Old release records remain intact.
- `GET /public/invitations/:slug` returns only the currently ACTIVE publication's final validated release snapshot; it never reads a mutable Studio draft. Guest GET requires no OIDC token and has `Cache-Control: no-store`. `UNPUBLISHED` behaves as 404.
- Each READY image/music `asset:UUID` in the release is re-checked against the publication's Workspace. The guest gets only a temporary signed R2 read capability, not raw bucket keys or credentials. Read URLs expire after 60s (image) / 20min (music); the public React page refreshes roughly every 45s to replace temporary URLs and detect unpublishing. Already issued URLs remain usable until expiration, even if the invite is unpublished; revocation is not instant at the object level.
- The public Next.js route is `/{ru|ky}/i/:slug`, e.g. `/ru/i/my-wedding`. It uses the **same Studio v2 renderer** and native RSVP widget with `GuestMode: live` for a consistent preview-to-public output.
- Dynamic invitations **require a server runtime** (Vercel Next.js project). The static GitHub Pages Studio preview removes this route at build time; it is not a production invitation host.

## REST API

All paths relative to `/api/v1`. Requests other than the two public routes require a verified OIDC bearer token.

| Verb | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | /projects/:projectId/publish | ADMIN or OWNER | publish `{slug,projectRevisionId,expectedRelease,idempotencyKey}` |
| POST | /projects/:projectId/unpublish | ADMIN or OWNER | disable link `{expectedRelease}` |
| GET | /projects/:projectId/publication | VIEWER | status and release count, no guest names |
| GET | /projects/:projectId/rsvp | EDITOR | paged private guest responses |
| GET | /projects/:projectId/rsvp/summary | EDITOR | answer/attendance aggregates |
| GET | /public/invitations/:slug | anonymous | active, immutable snapshot + temporary image/audio URLs |
| POST | /public/invitations/:slug/rsvp | anonymous, Turnstile in production | submit once per `requestId` |

Publish example:

```json
{
  "slug":"maria-and-alex",
  "projectRevisionId":"a75ac727-b27c-48f4-8ddc-7424f1fd839b",
  "expectedRelease":0,
  "idempotencyKey":"publish-ea09ab01-3eb6-419a-b510-9db18d71fd2d"
}
```

First publish has `expectedRelease:0`. Subsequent releases use the current `latestRelease` and the **same slug**. Stale or concurrent writes fail with HTTP 409; repeated requests with the **same idempotency key and content** return the first result. Do not reuse an idempotency key for a different request. The record is retained after its nominal expiry until a cleanup task removes it; using a fresh key for a new release is required.

RSVP client request (must reference a visible RSVP widget in the current release):

```json
{
  "requestId":"7c829285-b7ba-45d3-91f7-6fa979c592c6",
  "nodeId":"rsvp-form",
  "name":"Гость",
  "attendance":"yes",
  "guests":2,
  "turnstileToken":"<one-time-token>",
  "website":""
}
```

Only `yes` and `no` are exposed to guests; a decline always sends `guests:0`. The server enforces per-widget `maxGuests` and RSVP deadline and stores `nodeId` on each response. The client keeps a request ID stable across retry attempts with the same payload. A repeated `requestId` with different content fails 409. The `website` honeypot must be empty. API input is strictly Zod validated.

## Abuse control and privacy

- Cloudflare Turnstile **must** have both `RSVP_TURNSTILE_SITE_KEY` and `RSVP_TURNSTILE_SECRET` in the API project for production RSVP; if either is missing the API rejects new submissions with 503. The public widget also reports RSVP disabled. The secret is never returned or stored in the frontend. The challenge is validated against Cloudflare Siteverify; there is no client-side-only trust.
- A PostgreSQL `RsvpThrottle` bucket limits each publication to 60 accepted submissions per UTC minute, transactionally. 429 is returned beyond that. This complements Turnstile; it is not a substitute for an upstream WAF/global DoS control. Expired throttle buckets and idempotency records need scheduled cleanup.
- Guest names are **not** returned from the public GET endpoint. They are protected behind OIDC + a fresh database membership check, and are not indexed. Decide a retention/deletion policy and provide a privacy notice before launch; irreversible GDPR/Kyrgyz privacy compliance is not claimed by this MVP.
- No guest cookies, passwords or hidden admin tokens are used to submit RSVP. Guest output is noindexed by default. Use HSTS/HTTPS and WAF at the deployment edge.

## Frontend flow

1. Author saves their document using Studio v2's **Облако** panel (#29.3/#29.4); this is opt-in and requires real `remoteSettings` with a valid OIDC access token.
2. **Публикация** panel reads the linked cloud project ID, fetches latest committed revision, and performs CAS publishing. It shows the share URL and a private RSVP summary/list.
3. Guest opens `https://invito.kg/ru/i/:slug` or `/ky/i/:slug`. Next.js SSR requests the public API with `cache:no-store`; browser checks current release and updates short-lived media links.
4. An RSVP widget submits using a per-request UUID and Turnstile token (in production). Network retries reuse the request UUID, protecting against duplicates.

The Studio **Публикация** button is hidden until a real `remoteSettings` provider is injected; it does **not** manufacture authentication. This change does not create an OIDC identity provider or deploy the database.

## Configuration

Backend Vercel `invito-api`:
```dotenv
DATABASE_URL=...
DIRECT_DATABASE_URL=...
AUTH_ISSUER=...
AUTH_AUDIENCE=...
AUTH_JWKS_URL=...
FRONTEND_ORIGINS=https://invito.kg
R2_ACCOUNT_ID=...
R2_BUCKET=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
RSVP_TURNSTILE_SITE_KEY=...
RSVP_TURNSTILE_SECRET=...
```

Frontend Vercel `invito-web`:
```dotenv
NEXT_PUBLIC_API_URL=https://api.invito.kg/api/v1
NEXT_PUBLIC_SITE_URL=https://invito.kg
```

Create separate production/staging DBs and storage buckets. Run the new Prisma migration **before** serving API v29.5. The migration adds `Publication.projectId` uniqueness (verify no duplicate legacy rows), nullable `RsvpResponse.requestId` for existing rows, a widget node ID, and a persistent throttle table. SSR public routes **must not** be hosted on GitHub Pages static export.

## Test coverage

- PostgreSQL 17 E2E: signed identity, OWNER/VIEWER/outsider roles, immutable releases, idempotency, stale 409, guest 404 after unpublish, RSVP success + replay + tenant-private reports and summary, release-version isolation.
- Browser Chromium: Next.js SSR public page, live guest RSVP submission, noindex, and 404 when unavailable, via a local mocked public API; no real invitations or customer data.
- No real Cloudflare Turnstile token or live R2 bucket is available in CI. These require dedicated staging smoke tests with production-style CORS, trusted credentials, and external domain setup.
