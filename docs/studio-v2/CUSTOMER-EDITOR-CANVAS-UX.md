# Customer Editor & Studio canvas UX

## Intent
Customer personalization should be a focused content editor, not a second design tool. Keep authored pages, locked layout, versioned personalization contracts, RU/KY content, media restrictions, live preview and demo-only warning unchanged.

## Customer experience
- Desktop: two panes instead of a cramped three-pane dashboard — a single editing column with short numbered sections, readable inputs and anchored footer controls; large live preview on the right.
- Sections show current step progress, not a fabricated save/progress percentage. Required-field validation remains sourced from `personalizationIssues`.
- Choose from template-author-approved images and galleries using visual thumbnails, real radio/checkbox semantics and explicit selection. Image uploads are **not** added in this stage; template media restrictions remain intact.
- Responsive: same content controls, horizontal section navigation on narrow screens, explicit Edit/Preview switch, RU/KY controls; never stretch preview artwork.
- Reset, confirmation on closing dirty changes, preview renderer and contract validation are unchanged. No persistent customer drafts or publication is implied.

## Studio canvas
- Mouse-hover overlays show the chosen editable object's real **width × height in document pixels**, not its screen-scaled size. Polygon follows nested transforms and rotations via existing `nodeCorners`.
- The overlay is presentational and pointer-events:none; it does not change selection, history, layout or hit-testing.
- A native, explicitly `passive:false` wheel listener is registered **only on the canvas**. Ordinary wheel pans, Shift+wheel pans horizontally, Ctrl+wheel zooms the canvas at the pointer. `preventDefault` suppresses Chrome's page zoom only while the pointer is over the canvas; outside it, the browser retains default shortcuts and accessible zoom.
- Delta normalization handles pixel, line and page wheel devices. Browser keyboard zoom (`Ctrl + +/-`) is unchanged.

## Verification
Chromium browser regression exercises hover dimensions, panning vs Ctrl+wheel canvas zoom (and native default cancellation), visual customer media choices, RU/KY personalization, navigation, mobile switching and all existing Studio tests.
