# Eventiq — Customer RSVP and Mobile Dashboard (stage 6)

## Scope

This stage integrates **guest RSVP for customer-owned publications** and a
mobile-first customer account page. It does not change or reuse the admin
Studio publication's RSVP storage, and Admin Studio remains untouched.

### Guest flow

- Public invitation: `/{ru|ky}/c/:slug`.
- `GET /api/v1/public/customer-invitations/:slug` returns
  `rsvpEnabled` and `turnstileSiteKey`.
- Public widget is rendered in `live` mode and sends
  `POST /api/v1/public/customer-invitations/:slug/rsvp` with
  `requestId`, `nodeId`, `name`, `attendance`, `guests`,
  optional `turnstileToken` and empty honeypot `website`.
- Server validates against the **current ACTIVE immutable release**,
  widget visibility, deadline, maxGuests and requestId idempotency.
- Customer RSVP rows are stored in `CustomerRsvpResponse`. A per-minute
  `CustomerRsvpThrottle` table caps writes at 60 per publication.
- **Production requires both** `RSVP_TURNSTILE_SITE_KEY` and
  `RSVP_TURNSTILE_SECRET`. Without them, guest RSVP is disabled in
  the public API; verification remains mandatory for actual writes.
  Nonproduction bypass follows the existing `RsvpChallengeService` policy.

### Owner-only API

- `GET /api/v1/customer/invitations/:id/rsvp/summary` returns
  `{responses,attending,declined}`.
- `GET /api/v1/customer/invitations/:id/rsvp?page=1&limit=20`
  returns `{items,nextPage}`.
- Both authorize by matching the authenticated `ownerId` of the
  `CustomerPublication` to the requested `InvitationDraft`.
- Answers are never sent to anonymous visitors or to another owner.

### Mobile dashboard

- `/ru/invitations` and `/ky/invitations`.
- Supabase email-link sign-in if unauthenticated.
- Cards from `GET /api/v1/customer/invitations`.
- Shows template, updated date, publication status, RSVP counts.
- Actions: edit selected draft, view guest page, copy public link, hide
  invitation with confirmation, expand and page guest replies.
- Available in desktop header, mobile menu and customer editor.
- The editor supports `?template=:slug&draft=:uuid` to select the
  intended draft without silently overwriting local changes. For
  a foreign/invalid draft, owner-only APIs refuse access.

## Database migration and verification

Run against your configured Supabase PostgreSQL database *after backing
up and checking earlier migrations*:

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

Second terminal, from repo root:

```powershell
npm ci
npm run typecheck
npm run dev
```

### Acceptance checklist

1. Create and publish a customer invitation with a visible RSVP widget.
2. Open `/ru/c/:slug` in an incognito/mobile browser; widget shows.
3. Submit **yes** with two guests; see receipt and summary attending=2.
4. Submit **no** with zero guests; see declined=1.
5. Retry the same `requestId`; confirm only one row exists.
6. Attempt to reuse `requestId` with changed payload; expect 409.
7. Submit after the widget deadline; expect 409.
8. Disable/unpublish invitation; anonymous GET/POST must return 404.
9. Sign in as the owner; visit `/ru/invitations`, inspect responses.
10. Use another account's token for summary and list; expect 404.
11. Confirm production refuses RSVP when Turnstile is not configured.
12. Validate mobile layouts at 320 / 375 / 430px and reduced-motion.
13. Run backend `npm test` and both backend and frontend type checks.

**Not verified here:** live migration, actual Supabase authentication,
R2, browser interaction, load/performance or production Turnstile.
GitHub file updates are not runtime tests.

### Future improvements

- Optional message from a guest and CSV export under authenticated access.
- RSVP moderation/guest edits with proper explicit authorization.
- Realtime or push notifications as a separate opt-in feature.
- Media and invitation lifecycle cleanup, billing and share analytics.
