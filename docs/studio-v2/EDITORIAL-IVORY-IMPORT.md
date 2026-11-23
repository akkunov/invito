# Editorial Ivory — first Eventiq server wedding template

## Source of truth

- JSON package: `templates/packages/editorial-ivory.v1.json`
- Format: `eventiq-template`, version `1`
- Template slug: `editorial-ivory`
- Category: `WEDDING`
- Shared Studio v2 renderer, **no separate React page or Studio fork**
- Six consecutive 390px mobile-first editorial artboards:
  1. Cover: names, portrait and date
  2. Bilingual invitation letter
  3. Date, countdown, address and location block
  4. Wedding schedule
  5. Couple photo and gallery
  6. RSVP widget

Minimal editorial layout uses warm ivory (#F7F4EB), warm paper
(#EFE9DB), charcoal (#272722), desaturated gold (#9B8567), restrained
serif display and readable sans-serif detail. **No italic text.**

## Editable customer data

The PersonalizationContract explicitly allows:
- Couple names, invitation message and closing note (RU/KY)
- Date and time, venue name and address
- Cover image and gallery hero image
- Photo gallery (up to four images)
- Schedule (up to eight events)
- RSVP deadline and maximum guest count

The source is read-only: positions, type styles, ornaments and page
geometry cannot be edited in the customer editor. All other static copy
is localized via non-editable RU/KY binding variables.

### Media

The first package references three **already trusted project assets**:
`/images/riviera/couple.webp`,
`/images/riviera/villa.webp`,
`/images/riviera/flowers.webp`.
These are demonstration photos from the existing repository, **not**
original Ivory artwork or a customer's photos. They are present in
`public/images/riviera/` and allowed by the current server import
allowlist. No R2 upload is required for the initial template import.
Clients may replace permitted images with their own authenticated R2
uploads.

Music was **not** bundled: there is no licensed/verified audio asset
in this package. Add it as a later immutable template version after
a READY R2 audio upload and rights review; do not introduce a dead
autoplay widget. Music autoplay may also be blocked by browsers.

## Validation

From the repository root:

```powershell
npm ci
npm run typecheck
npm run test:editorial-ivory
```

The test checks the real Studio v2 document schema, contract targets,
RU/KY display variables, expected image allowlist, initial publish
validation and forbidden extra client fields. This is a local
validation command **not** proof of an actual import.

## Import into a real Workspace (after validation)

Backend must be running and connected to Supabase PostgreSQL.

In PowerShell, from repository root:

```powershell
$base = "http://localhost:4000/api/v1"
$jwt = Read-Host "Enter your Supabase access token"
$headers = @{ Authorization = "Bearer $jwt" }

# List workspaces. Choose one where your account has ADMIN/OWNER role:
$workspaces = Invoke-RestMethod "$base/me/workspaces" -Headers $headers
$workspaces

$workspaceId = Read-Host "Workspace UUID"
$path = (Resolve-Path "templates/packages/editorial-ivory.v1.json").Path
$import = Invoke-RestMethod -Method Post `
  -Uri "$base/workspaces/$workspaceId/template-packages/import" `
  -Headers $headers -ContentType "application/json; charset=utf-8" `
  -InFile $path

$import

# Publish the imported, immutable template after reviewing its content:
$publication = Invoke-RestMethod -Method Post `
  -Uri "$base/workspaces/$workspaceId/templates/$($import.id)/publish" `
  -Headers $headers -ContentType "application/json" `
  -Body '{"publicSlug":"editorial-ivory"}'

$publication
Remove-Variable jwt,headers
```

If the Workspace slug `editorial-ivory` or global `publicSlug` is
already taken, use the existing record/version management rather than
blindly re-importing. The publish endpoint requires existing valid
personalization and READY media.

After successful publication:
- `http://localhost:3000/ru/templates`
- `http://localhost:3000/ru/catalog/editorial-ivory`
- `http://localhost:3000/ru/editor?template=editorial-ivory`
- `http://localhost:3000/ky/editor?template=editorial-ivory`

The user's draft, photo upload, private publish and RSVP flows are
implemented elsewhere; this package **does not** create any real draft,
public URL or guest response until a person runs the corresponding
authenticated actions.

## Acceptance checks

1. Import with ADMIN/OWNER JWT; expect template DRAFT and version 1.
2. Publish via POST; expect PUBLISHED and catalog entry with static cover.
3. Open Russian and Kyrgyz previews; confirm localizable headings.
4. Change names, date, time and venue; verify binding updates.
5. Upload portrait and up to 4 gallery images through R2.
6. Save customer draft; verify account-owned restore.
7. Publish customer invitation and open in incognito.
8. RSVP yes/no from guest; review private responses in dashboard.
9. Check 320, 375 and 430px device widths and contrast in light themes.
10. Validate print/export separately: this package is built for web
    presentation and is **not automatically a press-ready PDF**.
