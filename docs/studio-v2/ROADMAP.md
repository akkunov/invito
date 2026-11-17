# INVITO Studio 2.0 — roadmap

Status: architecture proposal / development plan. Last reviewed: 2026-11-17.
Primary tracking: [Epic #18](https://github.com/akkunov/invito/issues/18).
Design source: approved multi-artboard Figma-like Studio 2.0 mockup in project conversation (wide workspace, thin rulers, multiple invitation frames, left pages/layers/assets, right inspector, zoom/minimap).

## Goal

Create invitation templates visually, with multiple pages/frames in a pannable and zoomable workspace, and publish them without adding new React components for each template. Author mode is distinct from the end user's invitation-content editor.

## Execution order

| Phase | Issue | Deliverable | Requires |
| --- | --- | --- | --- |
| 00 | [#19](https://github.com/akkunov/invito/issues/19) | ADR, invariants and migration strategy | — |
| 01 | [#20](https://github.com/akkunov/invito/issues/20) | ProjectDocument v2 schema, parse/migrations, tests | 00 |
| 02 | [#21](https://github.com/akkunov/invito/issues/21) | Command engine, transactions, undo/redo | 01 |
| 03 | [#22](https://github.com/akkunov/invito/issues/22) | Infinite world viewport, rulers, grid, minimap | 01–02 |
| 04 | [#23](https://github.com/akkunov/invito/issues/23) | Selection, grouping, transforms, snapping | 02–03 |
| 05 | [#24](https://github.com/akkunov/invito/issues/24) | Frame, auto layout and constraints | 01,02,04 |
| 06 | [#25](https://github.com/akkunov/invito/issues/25) | Text runs and inline selection-aware formatting | 01,02,04 |
| 07 | [#26](https://github.com/akkunov/invito/issues/26) | Asset manager, reusable components and variants | 01,02,05 |
| 08 | [#27](https://github.com/akkunov/invito/issues/27) | Shared responsive renderer, preview parity | 01,05–07 |
| 09 | [#28](https://github.com/akkunov/invito/issues/28) | Typed invitation bindings and safe interactions | 01,05,08 |
| 10 | [#29](https://github.com/akkunov/invito/issues/29) | Authenticated versioning, assets, publish and RSVP | 01,07–09 |
| 11 | [#30](https://github.com/akkunov/invito/issues/30) | E2E, migration, rollout and rollback | 02–10 |

Issues may be developed in parallel only when their dependencies and public contracts are stable.

## Branch and PR discipline

- Phase 00 branch: `architecture/studio-v2-foundation-20261117`; each later phase gets its own `feat/studio-v2-*` branch.
- Old `src/features/studio` and `src/components/studio` are not the foundation of the new engine.
- Place the new pure core in `src/features/studio-v2/core` and adapter/UI in `src/components/studio-v2`.
- Do not mutate legacy invitation IDs, storage keys, or invitation renderers as a side effect.
- Each PR must list issue, affected public contracts, migration impact, tests, browser checks, and rollback.
- CI gate: schema/command unit tests, `npm run typecheck`, `npm run build`, existing regression tests, plus Playwright when editor UI exists. Source assertions alone do not prove touch or visual behavior.
- A failing gate blocks merging. Only merge with verified results; update docs/ADR if contracts change.

## Acceptance criteria by capability

1. **Composition:** four or more independently editable, titled frames can coexist in one workspace; moving the viewport never changes document geometry.
2. **Rulers:** compact 12–16 CSS px screen-space UI, correct coordinates at all zoom levels, toggleable; no rulers/grid in exported invitation.
3. **Selection:** one click selects; drag after an intentional movement threshold; Shift/drag-area multi-select; group transforms and keyboard alternative.
4. **Rich text:** mix bold/italic/underline, font size and color in one text box, preserving ranges and insertion point through save/load.
5. **Media:** uploaded photos/vector elements are validated and stored by asset reference; no executable scripts or arbitrary remote assets.
6. **Responsive:** author a set of breakpoint overrides/constraints; preview, persisted document and publication use the same rendering primitives.
7. **Publishing:** template versions immutable, RBAC enforced server-side; existing invitations retain the version they were created with.
8. **Safety:** no false publication or RSVP success, invalid documents rejected with actionable errors, local drafts recoverable.

## Explicit non-goals for early phases

No payments, real guest RSVP, AI-generated templates, multiplayer editing, unrestricted arbitrary CSS/JS, third-party plugin marketplace, or automatic conversion of all old React-based templates.

## Legacy protection

Current Riviera, Monochrome and Santorini React components and the InvitationDocument v1 remain operational until an explicitly scoped compatibility/migration phase. Avoid assuming old single-canvas Studio documents can be mapped losslessly to multiple pages. Import of old JSON must be versioned and best-effort with a report of unsupported properties.

## Progress ledger

- [x] Existing architecture inspected on `main` (2026-11-17)
- [x] Epic and phase-level GitHub issues created
- [x] Phase 00 architecture proposal in draft PR
- [ ] Phase 00 accepted
- [ ] Phase 01 code and tests
- [ ] Remaining phases
