# INVITO Studio — local-only visual template builder (MVP)

Route: `/ru/admin/studio` or `/ky/admin/studio`.

This route is **not an authenticated admin panel yet**. It only operates on localStorage in the current browser. There are no server writes, gallery publishing, or public custom template routes. Treat it as a local design sandbox, not a production admin feature.

## Features
- Add text, images (from existing /images assets), shapes and buttons.
- Drag canvas elements, select and nudge with keyboard arrows (Shift for 10px).
- Edit properties, arrange layers, duplicate and remove elements.
- 320/375/440 scaled previews of one 440px layout.
- Autopersist draft, save named designs to browser localStorage, import and export strict JSON.
- Strict Zod schema (80 nodes, canvas and node limits, no raw HTML or CSS).
- Non-interactive button nodes are *design visuals*, not live RSVP submissions.
- Existing Riviera, Monochrome and Santorini remain React components and are not migrated.

## Next phase
1. Role-protected admin backend with JWT session and permission checks. Do not rely on hiding this URL.
2. Server storage for versioned, published template JSON and Cloudflare R2 media uploads.
3. Bind editor fields to per-invitation content. Build a shared customer-renderer using the same canvas schema, responsive layout constraints and interactive RSVP blocks.
4. Introduce sections, flex/grid containers, mobile overrides and reusable block library.
5. Browser-based visual regression tests at 320, 375, 440 and desktop widths.

Run `npm run test:studio`, `npm run typecheck`, `npm run build`.
