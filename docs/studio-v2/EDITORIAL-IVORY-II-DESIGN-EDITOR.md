# Eventiq — Editorial Ivory II and customer-editor UX refresh

## Design update

`templates/packages/editorial-ivory.v2.json` contains the second **immutable**
Editorial Ivory design. The original `editorial-ivory.v1.json` is not overwritten.

Six mobile-first artboards retain the approved personalization fields and
RU/KY variables, but receive:
- Magazine-like portrait treatment with layered mount and fine border
- Letterpress-inspired invitation page with double keylines and seal
- Highlighted ceremony/date card and precise spacing
- Restrained timeline frame on the schedule
- Photo mat, editorial caption and warmer gallery pacing
- Framed guest-response page with clear RSVP call to action

Typography is non-italic, on a warm paper/olive/ink palette. Trusted existing
Riviera images remain temporary demonstration assets; do not claim them as
custom Ivory photography. The design can be replaced with an original photo
collection later, after approved asset storage and review.

## Customer editor UX

- Step-progress meter for validated content
- Clear numbered step chips, reduced chrome, improved field-card hierarchy
- Easier preview on mobile with a scrollable page-section navigator
- Sticky artboard preview on desktop with section jump
- RSVP grouped alongside event information instead of photo styling
- Authenticated cloud state preserved when changing between steps (cloud
  component stays mounted, hidden outside Appearance / Review)
- Preserved existing Supabase owner checks, R2 upload, optimistic draft
  revisions, explicit publication actions and private RSVP stats

No Figma/admin Studio v2 controls were modified. Read-only template geometry
remains protected for customers.

## How to activate v2 in the already-created Supabase template

From root after updating main and starting the NestJS backend:

```powershell
git pull origin main
npm run typecheck
npm run test:editorial-ivory

powershell -ExecutionPolicy Bypass -File .\scripts\publish-editorial-ivory-v2.ps1
```

The script reads the current template `a61fe34a-3684-4669-bcab-106bb8d886f0`
from workspace `e440c062-534e-4d0d-911a-53afa03a6369`,
checks identity and version, adds a version only when currently at v1,
then publishes the latest version under the **same public slug**.
It requests the Supabase access token from the terminal; do not share it.

Important:
- The database is **not** automatically modified by a Git commit.
- Existing drafts remain pinned to their original `templateVersionId`.
- Previous public customer invitation releases remain immutable.
- After publishing the new version, new customer drafts use v2.
- The import endpoint is for creating a NEW template, not updating the
  existing one. Use the append-version endpoint as this script does.
- Local test commands require dependencies installed and may report issues
  that need to be fixed before production use.

## Manual QA

1. On `/ru/catalog/editorial-ivory`, check all artboards at 320/375/430px.
2. Switch `ru` -> `ky` and confirm localized static copy.
3. Edit names, date, venue and program. Check live preview and page jumps.
4. Login, save cloud draft, switch Appearance -> Review -> Appearance.
   Confirm existing `cloudId` and revision remain.
5. Upload cover and gallery photos; save and reopen on a second device.
6. Publish, verify public URL and guest RSVP with Turnstile enabled.
7. Review no accidental autosubmission, duplicate releases, private data
   leakage or truncated form controls on phone.
8. Verify print/export separately; web canvas does not imply print-ready PDF.

The GitHub update itself is NOT a browser screenshot, DB migration, deployment
or live integration test. Validate locally before declaring visual/production QA.
