# Studio v2 — quality gates

## Phase 00 gate
- [ ] Design target is represented by world/page/frame coordinate contract.
- [ ] Roles and ownership for project, editor session, renderer and backend are documented.
- [ ] Migration/compatibility plan preserves all existing invitation IDs and local draft keys.
- [ ] Each phase has a separate issue with dependencies and acceptance criteria.
- [ ] No runtime behavior is changed.

## Mandatory checks for every later PR
1. Strict TypeScript and production build green.
2. New unit tests cover success, invalid input and edge cases.
3. Existing `test:riviera`, `test:monochrome`, `test:santorini`, `test:landing`, `test:editor-navigation`, `test:studio` green.
4. Pure core does not import React/Next/browser.
5. Undo/redo and serializing project data don't lose information.
6. Explicit manual QA note for touch/keyboard and different screen sizes; never call source-level tests visual QA.
7. No claims of server saves, auth, real RSVP or publication before backend is implemented.
8. Feature is isolated behind new route or feature flag until release.

## Planned Playwright test matrix (once UI phase starts)
- Desktop 1440×900: 5 artboards, zoom 25/50/100/200%, pan and rulers.
- Mobile 390×844: touch selecting, two-finger gestures, panel drawers, keyboard input.
- Keyboard-only: V/H, space hand, marquee alternative via layer tree, tab focus, undo/redo, escape.
- Rich text: RU and KY Cyrillic + IME text selection, paste sanitization, repeated undo.
- Responsive artboards at 360/768/1440: renderer parity between editor, preview and published mode.
- Asset security: SVG script/external refs rejection; large files recover gracefully.
- Legacy regression: Riviera/Monochrome/Santorini rendering + draft recovery.

## Completion report format
Issue: #__
PR: #__
Implementation: …
Tests: passed/failed/not run …
Manual UI QA: tested/not tested …
Migration risk: …
Rollback: …
