# #28.9.2 — Canvas render performance

## Render window
The editor retains every authored page shell, label, layer list, minimap and selection geometry. When there are at least eight pages or 200 nodes, artwork mounts only inside the viewport plus 240 CSS pixels of overscan. Selected pages, pages containing selected nodes, editors and active gestures stay mounted. Moving the camera or choosing a page remounts its artwork from the canonical resolved document. Small projects retain all artwork. Fit all can mount many pages by design; no semantic content is discarded. Public, responsive and print renderers do not use canvas culling.

## React and motion
Memoized artboards avoid rebuilding artwork on camera-only updates when props are stable. Motion tracks are recomputed when their source document or motion mode changes, not on timeline scrub. Stage size updates that do not change dimensions preserve state identity.

## Gesture scheduler
Page drag and node move/resize/rotate queue only the newest absolute command for the next animation frame. Pointer-up flushes pending commands before the single history commit; cancellation/Escape clears the queue before rollback. Authored document validation and Undo/Redo are unchanged.

## Local media
Read local media incrementally with a four-read concurrency cap per hook instance. Retain existing object URLs when unrelated assets are added or removed, deduplicate keys, revoke removed URLs and dispose on unmount. Library thumbnails use lazy loading and asynchronous decoding. The hook still loads all referenced local assets (not a global byte-budget cache) because other surfaces require their URLs.

## Regression gates
Pure viewport tests cover zoom-independent overscan, pinned selections, small-project compatibility and queue flush/cancel. Chromium coverage seeds 25 artboards, verifies offscreen artwork is absent rather than merely invisible, focuses distant pages, restores editable artwork and tests history. Incremental asset tests check existing blob URL stability after import and deletion. This is functional coverage, not a measured FPS, latency or memory benchmark; #28.9.3 will introduce quantitative stress measurements at the actual document limits (30 pages / 500 nodes / 200 assets). Existing CI and post-deploy smoke remain required.
