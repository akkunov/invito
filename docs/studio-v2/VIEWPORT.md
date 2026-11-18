# ADR-003 — Infinite canvas and multi-artboard workspace

**Issue:** #22 · **Status:** isolated implementation, stacked on #33.

## Route

`/[locale]/admin/studio-v2` (RU/KY). This is an **unauthenticated, local demo only**: no server writes, no saving, no publishing, no guest RSVP. Existing `/[locale]/admin/studio` and legacy invitation editors remain unchanged.

## Architectural boundaries

- `src/features/studio-v2/core/viewport.ts`: pure geometry (`screenToWorld`, `worldToScreen`, anchored zoom, pan, fit, adaptive rulers, minimap projection).
- `src/features/studio-v2/demo-project.ts`: valid versioned project fixture with five independent wedding pages; uses existing bundled Riviera photos, no remote sources.
- `src/components/studio-v2/studio-v2-workspace.tsx`: UI state only: camera, pointer input, page selection, grid/rulers, minimap; page move operations go through command/history engine.
- `src/components/studio-v2/studio-v2-artboard.tsx`: read-only rendering of typed v2 node graph, not the authoring selection system.
- `src/app/studio-v2.css`: scoped UI matching chosen INVITO Studio 2.0 light mockup. Artboard background/colors remain document-driven.

## Interaction contract

| Gesture | Effect |
| --- | --- |
| Scroll wheel / two-finger trackpad | Pan camera, document unchanged |
| Ctrl/Cmd + wheel / browser pinch event | Zoom at pointer, keeps world point under cursor |
| Touch 1 finger | Pan camera |
| Touch 2 fingers | Pinch and pan simultaneously about gesture center |
| V | Select mode |
| H or held Space | Hand mode |
| Drag blank canvas | Pan |
| Drag page caption (select mode) | Move page world placement via one transaction |
| Click page / sidebar item | Select/center page |
| +/- buttons | Zoom clamped 2.5%–300% |
| Fit all | Camera fit of full document |
| Mini-map click / Enter | Center world camera |
| Rulers/grid | Toggle view-only overlays |
| + Page | New independent blank page, via commands |
| Inspector X/Y | Update page world placement |
| Ctrl/Cmd+Z; Ctrl/Cmd+Shift+Z | Undo/redo committed page edits |

Ruler overlays are **14 CSS px**, detached from document coordinates; major tick intervals use adaptive 1/2/5 increments to keep tick labels readable at changing zoom. Grid spacing adapts to low zoom and is not exported.

The canvas uses transform-based world coordinates rather than a 440px clipped document. All pages can be outside the currently visible region and at negative coordinates.

## Proof and limits

Checks: `npm run test:studio-v2-viewport`, `npm run test:studio-v2-ui`, existing v2/legacy tests, `npm run typecheck`, `npm run build`.

Automated viewport tests cover zoom anchors, pan, negative coordinates, fit bounds, adaptive rulers, and minimap projection. Source-level UI checks establish wiring only; **not** browser gesture verification.

Deliberately deferred to issue #23: selection of individual nodes, multi-select, draggable node transform handles, snapping, grouping, rotate and node editing. Also deferred: true autorendered desktop breakpoints (#24–27), autosave, auth, cloud media and publish.
