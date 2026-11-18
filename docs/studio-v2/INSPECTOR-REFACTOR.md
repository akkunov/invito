# Studio #28.6.1 — Inspector UI

- Design: selection geometry, typography, layout, linked instances, appearance (independent collapsible sections), contextual image and invitation controls.
- Animation: presets, trigger, timing, stagger, preview and a docked timeline. Canvas playback is opt-in and transient; leaving the tab restores authored appearance. The preview still uses the shared renderer.
- Responsive: profile controls plus Responsive Studio. Canvas: guides, zoom and fit.
- Global style and theme library moved to its own left tab. SVG icon components use the same viewBox and stroke widths, with accessible button labels.
- Shared HSV picker and editable HEX values, project palette, recent colors in localStorage. Pointer gestures on the SV plane commit once on release. Invalid HEX cannot enter document history. Alpha is only exposed where the schema actually supports it (shadow); linked color styles show their name and require explicit unlink. Existing token commands and validation are retained.
- No schema migration: same project documents, commands, history, renderers and persistence.

## Delivery gate
The Playwright desktop and mobile suite covers previous radius/linked component/token/animation/responsive workflows, panel isolation, local color commit and undo, docked timeline scrub and restore. Both PR CI and deployed Pages browser smoke must pass before moving to Template Manager.
