# ADR-006 — Rich text (#25)
Text is stored as structured runs, not HTML. Offsets use UTF-16 to match DOM Range; surrogate pairs are not split. Range formatting preserves unaffected runs; adjacent equivalent styles merge and run length/count limits are enforced. Native editor uses generated spans, plaintext-only content editing, plain-text clipboard and composition events. HTML, dropped markup and untrusted style strings never enter the project. One editing session commits one history transaction; Escape cancels.

Double-click a text layer or select it and press Enter. T creates a text layer. The inspector edits selected ranges (or all runs outside editing), typing style at a collapsed caret, font family, size, weight, color, decorations, alignment, line height and letter spacing. New text is upright by default. Ctrl/Cmd+Enter commits. Existing documents remain compatible.

Auto-height is opt-in; browser ResizeObserver reports intrinsic text height at resolved width to the pure layout solver. Measurements are view data, not source document mutations. The solver clamps sizes and reflows surrounding stacks. Server-side font measurement parity and advanced paragraph/bidi features are not included in this phase. Native mobile selection/IME and mixed-style undo need browser QA. Existing invitation routes remain unchanged.

Checks: npm run test:studio-v2-rich-text; TypeScript, build and legacy tests in CI.
