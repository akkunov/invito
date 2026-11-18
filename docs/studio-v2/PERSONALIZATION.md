# Customer personalization contract (28.8.1)

Studio remains the authoring tool. The customer's editor operates on a restricted contract attached to an immutable template version, not the Studio command engine.

- Versions without a contract expose no editable fields. Designers opt into actual binding keys, image nodes, invitation widgets, and permitted themes in Template Manager.
- Each field has a stable ID, RU/KY label, section, required flag, and kind-specific rules. Variables must be declared, used by authored content, and match the field type.
- A patch contains only allowed field IDs and typed values, with an optional permitted locale. Geometry, typography, pages, layers, effects, responsive overrides, token definitions and component definitions are not patchable. Explicit image or widget permissions may change content on a locked Studio layer without changing its geometry. Approved themes can change the appearance through the authored theme overrides.
- Text length and multiline rules, numeric bounds, image dimensions, gallery/schedule caps, RSVP guest limits, theme choices and music allowlists are enforced. Images reference actual asset IDs. Newly uploaded descriptors come from the trusted storage adapter, not customer JSON; collisions and unreferenced uploads are rejected. The current local adapter requires raster images, dimensions, byte size and a local storage key. This is not a server authorization mechanism.
- Draft editing allows missing required content; finalizePersonalization validates required fields and their values for the enabled languages before publishing. Authored seed values must also satisfy the configured limits at that point. Bindings are resolved by the existing renderer; repeated text bindings share a value.
- Saving a contract appends a template version. Duplicate/export/import preserve it; version restore restores the corresponding contract. New design versions inherit the latest contract and reject stale targets, rather than silently opening permissions. To remove permissions, explicitly save an empty field list.
- A portable template package may include the contract. Older packages remain compatible. Import is a designer operation, not an authorization boundary.

## Future backend boundary

Load the source snapshot and contract by trusted template/version ID on the server. Verify customer ownership and allowed uploads; never accept a customer-provided contract, source document, or arbitrary Studio commands as authoritative. Reapply typed values to that trusted snapshot, validate uploaded media bytes and dimensions, enforce storage quotas, and run final validation before publishing. Use the same contract in the client UI and server but do not rely on browser validation for access control.

## Checks

`npm run test:studio-v2-personalization` exercises permitted changes, unchanged source and image geometry, shared bindings, rejected unauthorized values and upload collisions, required-field validation, and version compatibility. The Chromium test covers designer opt-in and portable package export. Customer-facing screens and upload flow are subsequent tasks (28.8.2–28.8.8).
