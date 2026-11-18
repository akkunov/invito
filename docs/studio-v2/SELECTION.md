# ADR-004 — Selection and transforms (#23)

The existing workspace and invitation routes stay isolated. Selection is session state, not persisted document state. The core computes world-space matrices using artboard placement and nested frame center rotations. A selected ancestor excludes its descendants from a transform. Hidden and locked ancestors prevent selection.

- Mouse: click to select; Shift-click toggles; drag within blank artboard space selects fully enclosed direct children. Drag selected nodes after a four CSS pixel threshold. Blank outside the artboard still pans.
- Touch: tap a layer to select; one finger pans and two fingers pinch. Corner controls allow resize/rotation; general touch drag of layers remains a follow-up.
- Single-layer corner resize preserves the opposite corner, including rotated ancestors; Shift preserves aspect ratio. Rotation handle supports Shift 15-degree increments.
- Move snap tolerance is six screen pixels irrespective of zoom; Alt bypasses snapping. Move guides target sibling edge/center alignments.
- Arrow keys nudge, Shift+arrows move ten world units; Delete removes selected nodes. Escape cancels a node transform. Completed pointer transforms are one command transaction; cancel restores initial document.
- Group/ungroup uses an existing typed transparent free frame. Group only adjacent siblings in the same free parent (preserves stacking). Ungroup preserves rotated child world geometry. It does not flatten opacity or clipping.
- Layer list selects nested nodes; inspector exposes X/Y/W/H/angle in parent coordinates. Multi-selection supports move and grouping, not multi-resize or multi-rotation yet.
- No saving, real publication, changes to old editor, or new dependency. Source and core regression tests are not substitutes for desktop/touch browser QA.

Checks: npm run test:studio-v2-selection; existing suites, typecheck and build in GitHub Actions. Before release, manually verify pointer cancellation, gesture conflicts, nested and locked layers, screen-space handles, touch taps and zoom across device sizes.
