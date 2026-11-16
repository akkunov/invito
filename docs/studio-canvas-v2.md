# INVITO Studio — canvas editing v2

## Features
- Editor-only 20px grid with stronger 100px guides, visible rulers, optional 10px snapping. All three are independent toggles; none are serialized into the published document.
- New elements are **not selected automatically**. First tap/click selects, then intentional movement beyond 7 CSS pixels drags. Selected nodes can also be moved by keyboard arrows.
- Selected nodes expose a bottom-right resize handle; exact dimensions remain editable in inspector. Drag/resize interactions work with pointer events and touch.
- Typeface, size, weight, italic, underline, strike-through, tracking, alignment and color apply to the **whole text object**; there is not yet per-character rich text.
- Built-in geometry kinds: rectangle, circle, ellipse, triangle, diamond, star and heart.
- Custom JPG, PNG, WebP (up to 5MB source) and simple safe SVG geometry (up to 250KB) rasterized client-side to WebP. Uploaded images are stored as base64 in browser-local template JSON. SVG scripts, external references, foreignObject and unsupported geometry are rejected.
- Max image data URL: 700k chars. Max JSON import 4.5MB; localStorage quota may still restrict the number of saved images/templates.
- Existing schema v1 documents remain readable because new formatting and shape keys have Zod defaults.

## Known limits and next steps
- Grid/rulers are scaled visual aids; text labels on the ruler represent 100px intervals. Snapping is to 10px rather than smart alignment to other layers.
- Persistent localStorage is not a media backend; no cloud sync, remote publication, or secure admin login yet.
- Gesture-based move/resize is not yet grouped into a single undo step.
- Font changes and decorations apply to entire text objects, not separately selected words. Per-range rich text requires a structured text run model and selection-aware editor.
- Multi-select, rotation, advanced paths and upload of complex SVG with filters are not supported.
- UI needs touch-device/browser visual QA (CI only validates build and structural assertions).
