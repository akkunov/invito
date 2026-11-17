# ADR-001 — Document-first template engine and infinite workspace

**Status:** proposed; do not treat as shipped implementation.

## Existing-state findings (2026-11-17)

- `src/features/invitations/invitation.schema.ts` defines v1 guest invitation data, with fixed `blocks` and `templateId`.
- `src/components/invitation/invitation-canvas.tsx` chooses independently implemented Riviera/Monochrome/Santorini with template ID conditions.
- `src/features/studio/studio.schema.ts` defines a separate local-only, single 440 px wide artboard, max 80 absolutely positioned elements, up to 2400 px tall; no multi-page representation.
- `src/components/studio/template-studio.tsx` stores a local draft and named templates in localStorage. There is no authenticated publishing backend.
- `src/features/studio/studio-media.ts` stores bounded encoded raster images within the document, not media references.
- Existing `DESIGN.md` defines the public gallery's brand tokens; Studio v2 artboards must never inherit UI shell typography/colors unless explicitly part of the template.

## Core boundaries

```text
                      Studio authoring UI (React)
                 panels | tools | canvas | inspector
                              |
                   typed editor commands
                              |
          project document -- validator -- migrations
               |                  |
        layout / geometry      assets refs
               |                  |
              shared declarative Renderer
                     /                  \
          edit overlay             preview / public view
                      |
               persistence adapter
               local -> backend RBAC
```

The core may not import Next.js, React or browser globals. An editor session contains **derived or ephemeral** selection, zoom, pan, active tool, guides, and focused text range. A saved project contains **only** content/structure/design tokens, artboard positions, bindings and asset references.

## Proposed normalized v2 document

```ts
interface ProjectDocument {
  schemaVersion: 2;
  id: string;
  revision: number; // optimistic concurrency for persistence
  locale: "ru" | "ky";
  pages: Array<{
    id: string;
    name: string;
    rootNodeId: string; // root frame
    placement: { x: number; y: number }; // workspace world coordinates
  }>;
  nodes: Record<string, DesignNode>;
  assets: Record<string, MediaAssetRef>;
  variables: Record<string, VariableDefinition>;
  componentDefinitions: Record<string, ComponentDefinition>;
}
type DesignNode = FrameNode | TextNode | ImageNode | ShapeNode |
  ComponentInstanceNode | InvitationWidgetNode;
```

This is a conceptual contract for phase 01, not current code. Node types will be discriminated and versioned with Zod, and all references validated. `FrameNode` owns child IDs, frame dimensions, clipping and layout mode; text nodes contain text runs rather than one unstructured string. All dimensions are finite and bounded to safe ranges even though world placement is effectively unbounded for ordinary authoring.

### Coordinates

- **World coordinates:** positions of page frames; independent of browser size and zoom; page positions can be negative.
- **Frame coordinates:** descendants relative to a parent frame; scroll or zoom must not mutate them.
- **Screen coordinates:** pointer positions and UI overlays. Convert once using `world=(screen-viewportPan)/zoom`; ruler tick density and snap tolerance depend on zoom.
- Rulers are screen-space overlay outside content; target thickness 12–16 CSS pixels.
- Responsive layout should use layout constraints/breakpoints, not duplicate and manually sync multiple DOM trees.

### Commands and history

All project mutations are typed and pure. A command has `apply`/inverse or explicit previous-state checkpoint. Coalesce pointer move/resize events into a single gesture transaction; keyboard nudges are discrete; undo and redo are deterministic. Pure core tests must assert moving two frames, reparenting, deleting referenced nodes, duplicate IDs and cancelling a gesture.

### Assets

No executable HTML/CSS/JS in documents. Validate MIME and magic bytes when server-backed. Uploaded SVG must be sanitized/rasterized or reduced to a safe path subset. Use `assetId` refs instead of embedding large base64 content in node JSON. Distinguish browser-only storage from production object storage with an adapter; never claim uploaded assets have been published when only local.

### Versioning and migration

`ProjectDocument v2` is **not** an in-place reinterpretation of `InvitationDocument v1`. They serve different domains: template authoring vs personalized guest invitation. A guest document references an immutable `templateVersionId` and supplies typed binding values. Provide a one-way compatibility adapter for supported legacy Studio layouts and a separate path for legacy React templates. Do not overwrite existing v1 drafts.

### Source of truth and permissions

Author changes require authenticated ADMIN/MANAGER permissions on backend before deployment as a real admin tool. Do not promote the public `/admin/studio` static GitHub Pages sandbox into a production admin environment. Deployment and public guest RSVP are separate permissions and services.

## Testing seams

- `core`: Zod parse/serialize/migrate/invariants, deterministic command reducer, layout and unit geometry.
- `renderer`: stable DOM/snapshot output at multiple viewport sizes, no editor overlay in published view.
- `ui`: Playwright pointer, keyboard, touch, wheel, marquee, zoom/pan, text selection/IME; no accidental drag.
- `backend`: permissions, immutable publication, concurrency conflicts and recovery.

## Risk register

| Risk | Mitigation |
|---|---|
| Expanding old 440px scheme into a second source of truth | New v2 schema, explicit compatibility import |
| Canvas interaction regressions | Viewport-independent pointer math + gesture tests |
| Heavy asset JSON / quota | Asset IDs and storage adapters |
| Untrusted SVG or arbitrary CSS | Typed safe renderer, whitelist, strict validations |
| Editor and published invitations diverge | One shared renderer and visual snapshots |
| Existing customer drafts are broken | Feature flag + never touch v1 storage without tested migration |
| Unauthorized publication | Server-side RBAC + audit + immutable versions |
