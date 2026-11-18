# INVITO Studio — Figma-inspired interaction contract

Reference: Figma Help Center articles on selecting layers, marquee, Move/Hand tool, pan and zoom. These are interaction patterns; no Figma proprietary assets or source code used.

## Behavior (experiment v3)
- Tool mode: V = Move/Select, H = Hand; holding Space temporarily enables Hand.
- Move: click selects, drag after 5px pointer movement starts translation in the same gesture (no surprising jump on a tap).
- Multi-select: Shift+click toggles an item, drag an empty part of the canvas creates a blue selection marquee. Ctrl/Cmd+A selects all layers, Esc clears selection.
- Selection updates via layer list or canvas. A single selected object can be resized from the bottom-right handle.
- Arrow key nudges a focused selected layer by 1px, Shift+arrow by 10px.
- Hand mode pans the scrollable artboard without modifying objects, with scroll/pan support on desktop and touch.
- Zoom +/- controls show percentage, clamped to 35–175%; Ctrl/Cmd + wheel also changes zoom.
- Inspector and contextual typography toolbar remain for single selection; no unsupported group styling is implied.
- Multi-object drag uses one gesture snapshot for Undo; keyboard edits are separate history entries.
- All previous image uploads, grid/rulers and JSON v1 schema are preserved.

## Future work
- Eight resize anchors, selection rotation, constraints, parent frame nesting, groups and auto layout.
- Better mobile gesture tests including pinch zoom; two finger pan and zoom aren't implemented in this pass.
- A reusable architecture for components rather than freeform absolute-only elements.
- Advanced typography formatting within selected ranges; current text formatting is per element.
