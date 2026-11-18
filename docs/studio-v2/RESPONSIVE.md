# ADR-008 — Responsive renderer (#27)

A single validated document supports optional desktop/tablet/mobile page profiles and per-node geometry overrides. Existing v2 data is unchanged. Desktop is selected at container widths >=1024 CSS px, tablet >=600, otherwise mobile. Default presentation widths are 1440/768/390. In scale mode the original aspect ratio is preserved and height follows resolved content; profile height is only used in reflow mode. Reflow sets the root size while preserving source dimensions for free-frame anchors. Stack positioning still belongs to the layout engine.

The artboard renderer and layout solver are shared by Studio and the full-screen project preview. The presentation renderer vertically stacks page sections and fits their output to the available width. It does not include editing handles or input controls. It accepts a validated project and trusted asset URL mapping, ready for future server snapshot integration. Browser measurements for auto-height text are isolated by device. Overrides are applied to authored geometry before layout: a stack may override manual x/y; fill/hug and constraints can affect width/height.

The responsive inspector edits profiles and layer overrides through commands; base canvas remains the authored design, not device-specific drag editing. Clear/reset removes overrides, duplicate copies overrides, and delete cleans them up. Undo/redo and local persistence use the existing document pipeline.

No actual public publishing, server data fetch, RSVP or new legacy migration. Existing routes remain unchanged. The project locale is propagated to the preview; content translation is not automatic.

Checks: npm run test:studio-v2-responsive; existing CI tests, TypeScript and build. Browser parity checks still required: compare scale previews at 1440/768/390, reflow and anchor edge cases, Cyrillic/Kyrgyz text, missing local images, focus/scroll and touch. Pixel screenshot baselines are not claimed yet.
