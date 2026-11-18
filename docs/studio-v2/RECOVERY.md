# #28.9.1 — Local project recovery

The IndexedDB database upgrades from v2 to v3, retaining existing media, projects and template stores and creating a separate `projectRecovery` store. Valid document writes are serialized within the current browser tab. Each different committed revision and its prior valid checkpoint are stored in the same transaction; identical saves do not replace the checkpoint. Invalid primary data cannot be replaced by a normal save. Storage failures are reported.

Studio reads primary and checkpoint together, validates identity and schema, and blocks interaction and autosave until the correct document loads. A recoverable project offers explicit restoration, preserving the checkpoint. A missing non-demo project or unrecoverable record is not replaced by the demo. Previous checkpoints are not substituted automatically. Recovery does not overwrite a newer valid primary.

Autosave debounces committed history (never saves transient gestures), attempts to flush on document visibility loss and pagehide, and ignores stale completion messages. Browser shutdown can still interrupt asynchronous storage; this is not a durability guarantee. Single-tab write ordering is not a collaborative editing lock. The previous valid checkpoint is a local rolling copy, not an independent backup or a version history. Export portable packages for external backups.

## Regression gates

Chromium tests exercise upgrade from an existing v2 DB, creation of both primary and checkpoint by real editing, malformed primary, blocked keyboard/autosave, explicit restore, reload and missing checkpoint. Existing desktop/mobile/template/print/personalization tests remain in place. Follow DELIVERY.md before merging.
