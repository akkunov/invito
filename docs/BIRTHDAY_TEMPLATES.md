# INVITO · Birthday reference implementations v0.2

Three working reference template components, not merely design proposals:

| Template | Route (RU) | Presentation | Scroll behavior |
|---|---|---|---|
| Midnight Aura | `/ru/templates/midnight-aura` | Cinematic full-bleed photo, dark editorial title | Photo parallax, reveal-on-enter content |
| Soft Bloom | `/ru/templates/soft-bloom` | Warm pink oval portrait, botanical details | Gentle image depth and revealed sections |
| Golden Milestone | `/ru/templates/golden-milestone` | Black-and-gold portrait, giant number | Sticky milestone, scroll-progress line |

The same routes exist under `/ky` with localized template copy.

## How to test

1. Run `npm install && npm run dev`.
2. Open `/ru/templates/midnight-aura` and scroll to verify parallax and staged copy.
3. Open `/ru/templates/soft-bloom` and `/ru/templates/golden-milestone`; on Golden Milestone scroll until the gold age rule grows.
4. Click **Настроить шаблон**. In **Обложка**, enter a new name and age, upload a JPEG/PNG/WebP/AVIF portrait (up to 10 MB), adjust focal position, and change RU/KY content.
5. Open **Галерея**, upload up to 3 additional pictures, and ensure the block is enabled in the structure panel.
6. Refresh the editor to verify that the local draft and uploaded photo return. Click **Восстановить шаблон** to clear your local draft.
7. Enable **Reduce motion** in OS/browser settings and verify that all text remains readable without scroll reveal or parallax.
8. Test the editor at 390px width. The editor phone preview is an independent scroll container.

## Implementation

- `src/features/invitations/birthday-templates.ts` — reusable typed definitions. They extend the initial 12 templates to **15**; 60 is still the launch target.
- `src/components/invitation/birthday-invitation.tsx` — thin template-specific composition over shared typed invitation data.
- `src/features/invitations/use-birthday-scroll.ts` — `IntersectionObserver` + passive scroll listeners + `requestAnimationFrame`. No React state writes while scrolling. Detects nested scrollers in the editor.
- `src/app/birthday.css` — design-specific tokens and motion. This is independent of the INVITO platform palette.
- `src/lib/prepare-local-photo.ts` — browser-only image validation and compression; conversion to JPEG strips source metadata and reduces draft size.
- `src/components/editor/birthday-photo-uploader.tsx` — upload/replace/remove portrait. `birthday-gallery-uploader.tsx` — up to three more photos.
- `src/features/invitations/invitation.schema.ts` — existing document schema extended with optional age and media. No separate duplicate model.

## Scope and limitations

**This is a functional frontend prototype, not a deployed SaaS.** Drafts and uploaded photos are stored in browser `localStorage` only. They are not synced between devices, are not shared, and can be lost when browser storage is cleared. Browser quotas may prevent saving unusually large sets of photos. The UI reports a local storage failure.

No backend, Cloudflare R2, payment, real RSVP submission, or public publication exists in this iteration; those buttons remain disabled where appropriate. The demo portraits originate from previous INVITO-generated mockups and are placeholders, not actual customer photos. The visual quality of the final invitation depends on the uploaded source photographs.

## Verification

`npm run check:syntax` and `npm run test:birthday` use the installed TypeScript package, without added test dependencies. They check TS/TSX syntax and the three template manifests. Full `npm run typecheck`, `npm run lint`, `npm run build`, responsive browser QA, and interaction tests must still be run after `npm install` in a network-enabled environment.

No extra animation dependency was installed: reduced-motion-aware IntersectionObserver and scroll progression suffice for these reference patterns, keeping the first-pass editor bundle smaller.
