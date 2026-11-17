# INVITO Studio — UX rules (draft)

Reference material consulted: Canva help (in-place text editing, contextual typography controls, mobile toolbar), Figma documentation (text-layer selection, typography properties), WCAG 2.2 (keyboard alternatives to drag, visible focus, pointer target size).

Design principles:
- Selecting a text element exposes tools for font family, size, weight, alignment and color directly near the canvas.
- Double-click or use the explicit Edit text action to edit the whole text object directly in the canvas; don't require the right inspector.
- On mobile the contextual toolbar scrolls horizontally and text editing uses a native textarea/keyboard.
- Keep the right inspector for exact dimensions, binding and advanced properties.
- Live data bindings remain explicit; in-place editing bound elements must not silently rewrite user data.
- One schema governs what can be saved; reject arbitrary HTML, scripts and remote images.

Implemented: on-canvas textarea, contextual typography toolbar, color picker, swatches, duplicate/delete actions.

Limitations: formatting applies to the entire text element; per-character rich-text editing, upload, resize handles, responsive breakpoints, auth, publishing, real RSVP and touch/visual QA remain future work.
