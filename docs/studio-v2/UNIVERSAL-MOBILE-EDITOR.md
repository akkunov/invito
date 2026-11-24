# Universal mobile editor and music catalog

## Architecture

`UniversalMobileEditor` owns the shared phone header, canvas, pager,
tool dock and drawer shell. `UniversalSectionManager` owns the shared
section list and settings sheet. Legacy and Studio v2 adapters preserve
their existing document schema, storage keys, validation and rendering
engines. Existing desktop and admin screens remain in place.

All new templates should use Studio v2 packages, not new React invitation
editors. Migration of old templates to server packages and their drafts
is a separate operation; do not silently convert or discard old drafts.

The approved reference determines warm white UI chrome, olive active
tools, orange publication, compact typography tabs, and the section
settings sheet. The original template artwork is not replaced by a
screenshot. Exact visual parity requires real-device screenshot QA.

Implemented: tap-to-edit allowlisted fields, undo/redo, section rename,
visibility/order, text size/font/alignment/color and opt-in emphasis /
spacing, image upload/selection, music catalog search and playback,
existing cloud draft save and publication. Optional actions remain
author-authorized. Independent page duplication, physical deletion,
free layer manipulation and QR generation are not implemented in this
change; they require explicit domain commands and tests. Legacy
templates still lack server publication.

## Music API

GET /api/v1/catalog/music returns {tracks:[...]}.
The server reads EVENTIQ_MUSIC_CATALOG_JSON (default empty).
For example, configure the following JSON value in server/.env, replacing
the example domain and license with actual licensed files and terms:

```dotenv
EVENTIQ_MUSIC_CATALOG_JSON='[{"id":"piano01","title":"Wedding piano","artist":"Your licensed artist","source":"https://cdn.example.com/audio/piano01.mp3","license":"Your verified license","durationSeconds":180}]'
```

Only stable HTTPS audio URLs ending in mp3/m4a/ogg/wav are accepted;
temporary signatures, embedded credentials, duplicate IDs or sources
are rejected. Use a separate public R2 bucket/custom domain for
licensed audio, not the private customer-photo bucket. API metadata
does not itself grant music rights. The application does not integrate
Spotify/Apple Music or an external music service. No real tracks are
bundled. Mobile browsers require a user gesture to play sound.

Legacy users can choose the catalog track (local preference) or upload
local audio. Studio v2 users see only the immutable template-authorized
sources; the library supplies searchable track metadata and playback.

## Deploy and verify

```powershell
git pull origin main
npm run typecheck
npm run test:mobile-editor-v3
npm run test:editorial-ivory
cd server
npm run typecheck
npm test
```

Restart NestJS after configuring the catalog. Inspect:
```powershell
Invoke-RestMethod http://localhost:4000/api/v1/catalog/music
```

From the root, upgrade the existing Editorial Ivory template to the
bundled v4 package and authorize catalog tracks:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-template-music.ps1 -UpgradeEditorialIvory
```

Later, after adding tracks to the catalog and restarting NestJS, run
the same script without the upgrade switch. It reads the current
template snapshot, merges the approved sources and appends a new
version using expectedVersion. It never changes old versions. All
existing drafts remain pinned to their version. The first v4 upgrade
explicitly adopts the bundled design; subsequent sync preserves the
current design. For other server templates pass their workspace/template
IDs; they must already contain an authorized music field.

Open /ru/editor?template=editorial-ivory at 390px and create a new draft.
Test a legacy template at /ru/editor?template=editorial-riviera-wedding.
Verify the catalog in the Music drawer; choose a track, publish a new
server draft, and play it on the guest page. Confirm hidden/reordered
sections, name changes, undo/redo, signed photo upload, and no draft
loss on reload. Test 320–430px in mobile Safari and Chrome.

No live browser/device or database operation was executed by the
GitHub connector. Do not claim successful typecheck/build/runtime QA
until the commands actually pass.
