# INVITO — Riviera-only frontend

The catalog deliberately contains **one approved invitation**: `editorial-riviera-wedding`.
All gradient starters, earlier birthday/editorial/reference approximations, national mockups
and interchangeably stretched cover collections were removed. New designs will be
implemented and visually reviewed **one at a time**.

## Run

```bash
npm ci
npm run dev
npm run test:riviera
npm run test:editor-navigation
npm run typecheck
npm run build
```

Open `/ru/templates/editorial-riviera-wedding` or `/ky/templates/editorial-riviera-wedding`.
Edit at `/ru/editor?template=editorial-riviera-wedding`.

## Riviera editor

- Editable names, message, date, venue, address, roadmap, portrait and audio (RU/KY).
- In **Место проведения / Өтүүчү жай**, upload or reset the restaurant photograph.
  Its image is independent of the cover photograph and falls back to
  `/images/riviera/villa.webp`.
- In **Фотогалерея / Сүрөт галереясы**, add up to **4 photos**.
  The UI, Zod document schema and rendering each enforce that limit.
- Old saved drafts with up to six photos are migrated to four photos on load.
- Photos are compressed and saved as local browser data URLs; the audio is
  stored locally. No remote upload or backend persistence is claimed.
- Mobile invitation is capped at 440 px. Existing Riviera padding and font-size
  improvements from the most recent `main` are retained.
- RSVP selection is preview only; sending responses and publishing await backend.

Styling: `src/app/riviera.css` contains the invitation's art direction;
`src/app/globals.css` contains the necessary site, editor, gallery, countdown
and image uploader styles. Obsolete birthday/editorial/reference styles and
assets were deleted.
