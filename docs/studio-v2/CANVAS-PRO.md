# ADR-010 — Canvas & Selection Pro (#28.1)

The canonical selection and command engines remain the source of truth. Canvas Pro adds world-coordinate alignment (bounds edges and centers), equal-gap distribution (three or more free-positioned nodes), group rotation around the selection center and proportional multi-resize around the opposite handle. Group resize changes frame bounds, not every descendant or font size. Intrinsic/fill/hug selection sizes are deliberately excluded from resizing; stack children are positioned by their parent. A gesture commits one history entry. All calculations preserve parent-local coordinates under rotation.

Layer rows support drag/drop: dropping on a frame moves into it; dropping on a non-frame reorders/moves into its parent. Free targets retain world geometry; stack targets use auto layout. Cross-frame movement also has a select-and-button alternative. Existing schema validation rejects cycles and locked ancestors. Responsive overrides remain authored in their original parent-local coordinate system; review device-specific geometry after reparenting.

Internal clipboard captures selected subtrees, immutable authored values, asset/component/variable references, and device overrides. Paste atomically allocates new IDs and preserves positions relative to destination page with a 24-unit offset. Ctrl/Cmd+C/V/D, inspector buttons and right-click menu share this behavior. Clipboard is session-local and supports pages of the same project only (cross-template resource import is deferred to Template Manager). The browser OS clipboard is not overwritten.

Alt-hover measures positive distances between selection and another visible layer in document units. Custom X/Y guides are stored with the document, can be added or deleted in the inspector, participate in snapping, and undo normally. Alt during drag disables snapping. Existing ruler and viewport zoom behavior is preserved.

Scope: base canvas only. Responsive device canvas editing, layer rename/lock/visibility controls, arbitrary clipboard across projects, ruler-drag guides and nested-component propagation are follow-up work. Existing invitation routes are unchanged.

Regression suite: npm run test:studio-v2-canvas-pro. CI includes previous suites, typecheck and build. Browser QA still required for multi-selection gesture scaling/rotation, drop targeting, locked ancestors, cross-page paste, keyboard and touch alternatives, context menu clipping, and zoomed guide measurements.
