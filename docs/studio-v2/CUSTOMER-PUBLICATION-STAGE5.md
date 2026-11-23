# Eventiq — Customer Publication stage 5

## Architecture

Customer invitation publishing is **not** the admin Studio `Publication`
model. It uses `CustomerPublication` + `CustomerPublicationRelease` tied
to an owner-only `InvitationDraft`. All guest pages use an immutable snapshot,
never the mutable draft or a privileged Studio project.

The immutable TemplateVersion and PersonalizationContract remain unchanged;
a customer only changes permitted values in `PersonalizationPatch`.

### Backend requirements

Apply the new Prisma migration before running the API.

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

In another terminal from the repository root:

```powershell
npm ci
npm run typecheck
npm run dev
```

Requires configured Supabase Auth / JWT JWKS, PostgreSQL and R2.

### Customer API

All private routes require a verified Supabase Bearer JWT:

- `GET /api/v1/customer/invitations/:id/publication`
- `POST /api/v1/customer/invitations/:id/publish`
  `{ "slug": "our-wedding", "expectedRevision": 2, "expectedRelease": 0 }`
- `POST /api/v1/customer/invitations/:id/unpublish`
  `{ "expectedRelease": 1 }`

Anonymous endpoint:

- `GET /api/v1/public/customer-invitations/:slug`

No public POST, no anonymous mutation access. A draft may be published
only by its owner. The server independently validates all required fields,
same-user customer media, template media, and current revision before
writing a release. Slug remains immutable across republishing.

API returns 409 for duplicate slug, revision mismatch or concurrent release.
Unpublished releases return 404 to anonymous guests.

### Frontend

The mobile customer editor's fourth step validates the contract and offers
an explicit publish action. Publication first performs `PATCH` with
`expectedRevision` to preserve the currently edited patch. It then uses the
resulting revision as `expectedRevision` for publish. On success it displays:

- Personal URL `/ru/c/:slug` or `/ky/c/:slug`
- Copy-link button
- Web Share (mobile share-sheet) button when supported

The same shared Studio v2 renderer draws the released document.
Short-lived R2 media links are refreshed while the guest page remains open.

### Acceptance test

1. Import and publish a valid server template, including a nonempty
   PersonalizationContract.
2. Open the template and create a personal draft in the mobile editor.
3. Sign in; upload a photo; save the draft.
4. Complete required fields, open step 4, choose URL, publish.
5. Open the returned `/ru/c/:slug` in an **incognito browser**; it must render
   without a Supabase token.
6. Modify and save draft without publishing; incognito page must still show
   the **previous immutable release**.
7. Publish a second release using the same slug and expectedRelease=1;
   the public page must update.
8. Try another account's draft, a stale expectedRevision, a duplicate public
   slug and a foreign R2 asset. Expect 404, 409, 409 and 422.
9. POST unpublish; the anonymous URL must return 404.
10. Verify media URLs renew after one minute and the page is usable at 320 px.

### Known scope limitation

Guest RSVP is deliberately disabled on customer invitations at this stage.
The existing RSVP implementation belongs to admin Studio Publication.
It must be migrated to the customer publication ID model with separate
owner-only responses and throttling, before RSVP can be enabled.
The UI must not claim that guest responses are being collected.

No live database, R2, mobile browser or build smoke test was executed
by GitHub file operations. The supplied commands and checklist remain
release gates, not a claim of successful execution.
