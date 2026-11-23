# Eventiq Mobile Editor 3.0 — Stage 1 (mobile-only)

## Scope and design decision

The approved mobile-first editor uses **the invitation as its primary
surface**. Only the phone UI at <=850px is redesigned in this stage.
Desktop customer UI, Admin Studio v2, Next.js routes, authenticated
NestJS APIs, Supabase Prisma models and customer draft storage formats
are unchanged.

The implementation is deliberately smaller than a Figma canvas: hosts
may **select content directly**, but cannot move, resize, duplicate or
delete author-controlled Studio v2 layers. This preserves the immutable
designer's version and the existing allowlisted personalization contract.

## Implemented

- Sticky header, phone-sized invitation canvas and bottom action dock
- One invitation page visible at a time on mobile, switched using the
  section chips or next-page dock action; desktop keeps all pages
- Touch a visible editable text, photo, countdown/location binding, or
  permitted widget to open the corresponding field in the bottom sheet
- A persistent scrollable mobile sheet reuses the existing `SimpleField`
  controls with a close action and Escape handling
- Bottom-dock shortcuts for main info, event, photos, sections, review
- RU/KY translations and safe-area offsets for the device home indicator
- Cloud draft upload/save/publish controls are reused, not duplicated;
  tapped photo targets are passed to the authenticated R2 uploader
- Responsive CSS isolated under `@media(max-width:850px)`
- Reduced-motion and accessible labels on new actions
- Dedicated unit test for selection respecting `PersonalizationContract`

### Security invariant

`editableFieldForNode(document, contract.fields, nodeId)` resolves
**only** actual contract fields, never generic node properties. This
function authorizes which drawer opens; server-side personalization
validation continues to authorize and validate the submitted patch.

Decorative layers and unbound copy are not editable by tapping.

## Verify locally

```powershell
git pull origin main
npm run typecheck
npm run test:mobile-editor-v3
npm run dev
```

Use a 320/375/390/430px viewport and test:

1. Main invitation opens immediately, a single page at a time.
2. Touching couple names opens only the allowed name field.
3. Touching a photo opens the image field and selects its upload target.
4. Non-editable decorative strokes cannot open a general style editor.
5. Closing the drawer and changing sections do not mutate the document.
6. RU/KY, local autosave, existing cloud draft restore work unchanged.
7. Publishing does not happen until the existing explicit, authenticated
   publish action succeeds; invalid fields still block it.
8. Keyboard users can open and close panel using native buttons / Escape;
   screen zoom and OS keyboard must not obscure controls.
9. Verify desktop at >850px has unchanged two-column layout.
10. Test long names, gallery 4-photo limit, 409 revision conflicts and
    401 authentication failures without losing local input.

**Pending for later stages:** guided section visibility/order **only**
when explicitly allowed by a future versioned template contract;
image focal-position editor; accessible focus restoration and upload
progress; phone-specific visual regression and full E2E QA.

### Verification boundary

This GitHub change does not constitute successful phone browser testing
or backend integration. Run the commands and inspect the route on a
real iPhone/Android device before calling Stage 1 production-ready.
