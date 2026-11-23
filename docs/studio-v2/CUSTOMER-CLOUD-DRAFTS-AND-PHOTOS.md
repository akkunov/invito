# Eventiq — customer cloud drafts & personal R2 photos (stage 4)

## Implemented

- A customer signs in with **Supabase Auth**. The customer editor can request
  an email magic link; existing Supabase sessions are recognized.
- A verified Supabase user can create a private `InvitationDraft` pinned to
  an immutable `TemplateVersion`. The draft stores only
  `PersonalizationPatch`, `ownerId`, `workspaceId` and a revision counter.
  The original designer snapshot and TemplateVersion never change.
- Every customer gets a deterministic private `customer-<userId>` Workspace
  (created only when needed) with an OWNER membership for **their own R2 media**.
  Being OWNER of that Workspace grants no privileges in the designer Workspace.
- Photo upload uses the existing MediaService quota, signed PUT,
  SHA-256/MIME validation, immutable verified keys and R2 policy.
  Customer endpoints accept JPEG/PNG/WebP only (20 MB max per file).
- The editor maps the `asset:UUID` storage key to a non-UUID Studio asset ID
  `customer_<32 hex digits>`. The backend only admits this mapping when the
  media row is READY, uploaded by the current user, and belongs to the private
  Workspace. The shared `personalizeDocument` accepts injected verified
  cloud descriptors only via an explicit trusted-assets option.
- Cloud saves use compare-and-swap `expectedRevision` and return HTTP 409
  for conflicts. The frontend never silently overwrites a stale server copy.
  Local drafts remain in browser storage independently.
- `GET /customer/invitations` lists only the account's drafts, allowing the
  same template draft to be discovered from a second device.
- Customer photo and template R2 read URLs expire after 60 seconds. The editor
  attempts renewal every 45 seconds while open.

## API

Authenticated routes (all prefixed `/api/v1`):

| Verb | Path | Body / purpose |
| --- | --- | --- |
| POST | /customer/invitations | `{templateVersionId}`: create draft |
| GET | /customer/invitations | list account drafts |
| GET | /customer/invitations/:id | owner-only draft, asset metadata and temporary URLs |
| PATCH | /customer/invitations/:id | `{expectedRevision,patch}`: CAS save |
| POST | /customer/media/uploads | `{name,mimeType,bytes,sha256}`: signed R2 PUT |
| POST | /customer/media/:id/complete | SHA-256 verify and commit |
| GET | /customer/media/:id/read-url | short-lived owned-media URL |

## Setup

Run Prisma migration **before starting the new backend**:

```powershell
git switch main
git pull origin main
cd server
npm ci
npm run db:migrate:deploy
npm run typecheck
npm test
npm run start:dev
```

Root frontend:

```powershell
npm ci
npm run typecheck
npm run dev
```

Ensure existing frontend `.env.local` has
`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
`NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`.
Backend needs JWT issuer/JWKS settings and R2 credentials.
Configure Supabase Auth Redirect URLs to allow
`http://localhost:3000/ru/editor` and `/ky/editor`;
email OTP/magic-link delivery must be enabled if using the new sign-in form.

## Manual end-to-end acceptance

1. Import and publish a server template with nonempty permissions,
   especially an image field and optional gallery field.
2. Open `/ru/catalog/:slug` and click **Использовать шаблон**.
3. Go to **Оформление**; sign into your account (or use existing session).
4. Upload a personal photo. Check the direct R2 PUT and
   `POST /customer/media/:id/complete` return successful statuses.
5. See the photo in live preview. Click **Сохранить в облако**.
6. Reload the page and **Открыть облачную копию**.
7. Sign in on a second device; choose the draft from **Ваши черновики в аккаунте**
   and open it. Confirm identical names and photos.
8. Try an unauthorized asset ID, draft ID from another account and stale
   `expectedRevision`. Expect 422, 404 and 409 respectively.
9. Test 320px, 375px, 430px widths and low-speed mobile connections.

## Explicitly out of scope

- Automatic cloud autosave. Cloud persistence is **explicit** via a visible
  button, while browser-local edits are saved immediately.
- Production customer publishing and RSVP (separate next stage).
- Customer billing, price entitlements, album reordering and server-managed
  draft deletion.
- A complete invitation dashboard / multi-draft creation UX. The backend
  permits multiple drafts, and the editor lists account drafts for the selected
  version; further management UX comes later.
- Testing against a live PostgreSQL/Supabase/R2 environment has not been
  performed by the GitHub file update actions. Run the acceptance checks above.
