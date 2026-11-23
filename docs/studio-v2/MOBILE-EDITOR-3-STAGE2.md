# Eventiq Mobile Editor 3.0 — reference-aligned phone workflows

## Why the phone still showed the old editor

The route `/[locale]/editor?template=...` has **two independent editors**:

1. Old seeded local templates `editorial-riviera-wedding`,
   `editorial-monochrome-wedding`, `wedding-travel-santorini` routed to
   `InvitationEditor`, whose previous phone layout had never been replaced.
2. Server templates like `editorial-ivory` routed to `CustomerMobileEditor`.

The new `LegacyMobileWorkspace` is rendered for seed templates on
phone-sized screens (<=850px) and uses the existing
`useInvitationEditor`, `InvitationCanvas`, `EditorInspector`,
local autosave, history, photo upload, music upload, and
`toggleBlock/moveBlock` commands. It intentionally leaves the old
desktop editor untouched. Old seed templates have **no cloud publication
backend**; their publish button remains disabled with a reason rather
than simulating a public release. To publish, start from a server
template after it has been published by an administrator.

The `CustomerMobileEditor` has a reference-aligned top bar, canvas,
page arrows, 5-tool dock (Text, Photo, Style, Sections, Music), selection
sheet, authenticated save/photo flow and actual publication action.
It keeps the original restricted form on desktop.

## Real, versioned section editing

Existing v1/v2 templates and stored customer patches remain valid.
The shared `PersonalizationContract` now supports an **optional**
`sectionEditing` object with `hideablePageIds` and
`reorderablePageIds`. The shared `PersonalizationPatch` has an
**optional** `sections:{order,hidden}` value.

The backend uses the same strict Zod parse and
`personalizeDocument` routine. An attempted edit to a template
without permission is rejected; fixed pages cannot move, and
unapproved pages cannot hide. The published snapshot retains
source pages and nodes while setting optional hidden root frames to
`visible:false`; no database migration or REST endpoint change is
required.

`templates/packages/editorial-ivory.v3.json` permits hiding or
reordering only the optional invitation letter, evening program, and
photo gallery pages. The cover, essential event information and RSVP
remain mandatory and immovable.

Mobile customers can restore hidden pages and move permitted pages
with accessible buttons. All edits save locally and can be explicitly
saved to Supabase customer drafts. The section state is included in
immutable public release snapshots after authenticated publication.

The v3 package also includes three optional real color themes
(Olive, Sand and Blush) through existing Studio style tokens and the
existing `theme` personalization field. No arbitrary text-layer
geometry, free layout, unsanctioned duplication or unlicensed music
upload is introduced.

## How to update the EXISTING Editorial Ivory template

**The GitHub push is not a database update.** After completing local
checks, upgrade the already imported UUID with an authenticated token:

```powershell
cd D:\distr\projects\invito
git pull origin main
npm run typecheck
npm run test:mobile-editor-v3
npm run test:editorial-ivory
# NestJS must be running and DIRECT_DATABASE_URL configured already.
powershell -ExecutionPolicy Bypass -File .\scripts\publish-editorial-ivory-v3.ps1
```

The script verifies workspace
`e440c062-534e-4d0d-911a-53afa03a6369` and template
`a61fe34a-3684-4669-bcab-106bb8d886f0`, appends an immutable
version to the existing template, and publishes under the same
`editorial-ivory` slug.

Previous drafts remain pinned to their old templateVersionId; **start a
new invitation to use the new version**.

Open `http://localhost:3000/ru/editor?template=editorial-ivory`
from a **phone-width viewport (375px or 390px)**. A desktop browser
at 1280px will deliberately still show the existing desktop UI.
Test old seeded templates separately at
`/ru/editor?template=editorial-riviera-wedding`.

If the browser shows old output after updating, stop Next.js, delete
`.next` (generated output only), restart `npm run dev`, and hard
refresh the phone tab. Never delete `.env.local`, `node_modules` or
user drafts while clearing that cache.

## Test matrix

- Phone: 320, 375, 390, 430px; Android Chrome and iOS Safari if possible.
- Touch select text/image; ensure decorations cannot be moved/selected.
- Text edits, RU/KY switching, undo and redo; local autosave after reload.
- Photo replacement through signed R2, gallery limit of 4.
- Theme selection changes actual paper/ink colors, not only the UI swatch.
- Pages: arrows, section screen, hidden state, reorder and restore.
- Confirm cover and RSVP cannot be hidden or moved.
- Signed-in draft save and restore, 409 conflicts, public publishing, RSVP.
- Legacy editor local photos, program reorder, music and section visibility.
- Desktop >850px remains visually unchanged.
- Test keyboard focus, external keyboards, OS virtual keyboard and
  `prefers-reduced-motion`.

No browser screenshots, device tests, or real Supabase operations have
been executed through this GitHub-only change. Do not claim that the
project has built or published until the above commands succeed.

## Later work that needs product/domain decisions

The reference illustration depicts duplicating/deleting arbitrary
designer-owned pages and free styling of any text, plus QR code
generation. These are **not** authorized by the current customer
PersonalizationContract and would require a distinct versioned
capability (and safety/UX requirements), not a DOM-only imitation.


## Additional verified-by-code capabilities

The v3 package additionally opts in to `textStyle` personalization
for the names on the cover only. Supported changes are specifically
allowlisted serif/sans fonts, weights (400–700 from an enumerated
set), font size 36–58px, four approved hex colors, and alignment.
The existing `PersonalizationPatch.values` union handles it;
unapproved fonts, colors or sizes are rejected before draft persistence.
The authored layout, positioning, text content and other nodes remain
protected. For the selected name node, the bottom sheet offers content
and style tabs.

The R2 photo control now displays upload phases (checking, signing,
uploading, verifying), checks image dimensions before uploading, and
blocks additional gallery upload when its author-configured max-photo
capacity is reached. These statuses indicate progress **stages**, not
a measured percent transfer.

No licensed audio file is bundled with Editorial Ivory; hence its music
tool honestly says the template does not offer music selection yet.
Similarly, old locally stored templates cannot publish through the
new customer publication API until versioned as server templates.

Do not confuse the **UI design reference image** with a code screenshot:
the repository changes implement the layout and authorized controls but
have not been visually compared in a running mobile browser in this chat.
