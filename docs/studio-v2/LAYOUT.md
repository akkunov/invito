# ADR-005 — Frames and Auto Layout (#24)

Source document remains canonical, with optional sizing, anchors, alignment and distribution fields. Earlier v2 documents are compatible without migration. The pure layout engine resolves intrinsic size bottom-up, then parent-local positions top-down. Fill children in hug parents contribute their minimum to avoid feedback cycles; extra room is shared by fill siblings subject to maximum sizes. Hidden nodes don't occupy stack space. Overflow is not silently shrunk; clip remains explicit.

The workspace renders resolved geometry for artboards, selection, guides and minimap. JSON export preserves the authored document. Free-frame resize rebases start/center/end/stretch anchors through the command engine. Switching an auto stack to free copies its current resolved direct-child geometry and fixes hug sizing on the parent.

Inspector: nested frame creation, free/vertical/horizontal, padding, gap, alignment, distribution, fixed/fill/hug, min/max constraints, anchors, clip and stack order buttons. Auto-stack children are positioned by layout, not free dragging. Hug currently measures frame children, not intrinsic flowing text; real text measurement follows #25. Drag reordering, breakpoint overrides, arbitrary nested reparent UI and full responsive authoring are deferred. No legacy invitations or public site routes changed.

Tests: npm run test:studio-v2-layout; CI runs existing checks, TypeScript and build. Browser QA still required at multiple zooms, nested stacks and mobile. Pages preview workflow now uses current branch/main instead of permanently checking out the old canvas branch.
