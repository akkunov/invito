# ADR-002 — Studio v2 commands, gestures and persistence

Status: **implementation draft** (Issue #21); stacked on document contract PR #32.

## Rules

- `applyStudioCommand` and `applyStudioBatch` are **pure**: they clone the input and validate every resulting document with `projectDocumentSchema`. A failure never mutates the source document or a session.
- Typed commands: `insertNode`, `updateNode`, `moveNodes`, `reparentNode`, `reorderNode`, `deleteNode`, `duplicateNode`, `createPage`, `movePage`, `renamePage`, `deletePage`.
- Topology edits happen only through structural commands, not unrestricted field patches. Deleting a node removes its descendant subtree; a page root may only be deleted by `deletePage`, and the last page cannot be deleted.
- Locked nodes and descendants of locked frames cannot be edited. Duplicating a subtree requires a complete deterministic old-to-new ID mapping.
- Multiple movements in one pointer gesture use `beginStudioTransaction` → repeated `dispatchStudioCommand` → `commitStudioTransaction`, creating **one** history entry. `cancelStudioTransaction` restores the original snapshot without adding history.
- A batch is all-or-nothing for the session and counts as one history entry. New edits clear redo; undo/redo are blocked during an open gesture.
- `revision` is a monotonic persisted version counter. Undo and redo move *content* backwards/forwards, not the revision counter.
- History stacks are limited to 50 entries. Viewport position, selection, hover and temporary ruler/grid state stay outside the document/history core.
- The pure `StudioPersistenceAdapter` port has `load` and `save(document, expectedRevision)`. A reference in-memory adapter validates documents and enforces optimistic concurrency. **No localStorage, remote API, login, actual autosave or published storage is implemented in this phase.**
- A future browser adapter will debounce save and call `recoverStudioDocument` on load. The production backend must enforce compare-and-swap **atomically** within a transaction; an in-memory adapter is only for deterministic tests.
- Existing Studio v1 and Riviera/Monochrome/Santorini are untouched.

## Quality gate

`npm run test:studio-v2-core && npm run test:studio-v2-commands && npm run typecheck && npm run build`

Tests cover graph integrity, duplicates, reparenting, subtree cleanup, multiple pages, command batches, undo/redo, gesture cancellation, revision monotonicity and CAS recovery. Browser drag/touch tests belong in the later infinite-canvas and transform phases, not here.

## Deferred

Fine-grained domain event serialization, collaborative editing, server authorization, cross-session history persistence, retained asset garbage collection, nested auto-layout rules, high-frequency pointer performance optimization, and full browser QA.
