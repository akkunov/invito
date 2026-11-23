# Eventiq Customer Editor — stage 3 (mobile UI, server templates)

## Scope completed

- `/{ru|ky}/editor?template=:publicSlug` loads the PUBLISHED template
  from the server catalog and validates its existing `ProjectDocumentV2` and
  `PersonalizationContract`.
- Legacy `seed-templates` continue through the unchanged `InvitationEditor`.
- Four mobile-first steps: **Основное → Дата и место → Оформление → Проверка**.
  Sections of contract v1 are mapped to these steps without changing the
  immutable contract format.
- The editor uses the existing `personalizeDocument` and
  `StudioV2ProjectRenderer`, so client changes cannot arbitrarily alter
  layers, positions or typography.
- Edit/Preview toggle on narrow screens; always-visible preview column on
  desktop. Preview is generated from the derived document, never authored
  as a second template renderer.
- RU/KY locale switch when allowed by the template contract.
- Browser-local draft saved under an immutable `templateVersionId` key;
  saved JSON is parsed against the v1 patch schema and replayed through
  `personalizeDocument` before reuse. Reset asks for confirmation.
- Final step runs existing `personalizationIssues` and
  `finalizePersonalization`, showing tappable issues that navigate to
  the corresponding editing step.
- Public server template detail at `/{locale}/catalog/:slug` now links
  to the mobile editor.

## Scope intentionally NOT completed

- Customer media upload (the existing `SimpleField` only allows selection
  among already-registered template images; it does not accept arbitrary new
  files). The next stage must create customer-owned assets and use authenticated
  presigned R2 uploads with server-side validation and quotas.
- Account-owned drafts, concurrent editing, synchronization and publication.
  `localStorage` is **not** a server persistence mechanism. It can be cleared
  by the browser and is not suitable as the sole durable store for production.
- Customer `Invitation` ownership model and publication permissions.
  The current backend `PublicationService` is intentionally scoped to
  ADMIN/OWNER Workspace members; never grant a customer those roles to publish.
- The editor does not promise a live share URL or silently redirect to the
  admin publish operation. This is displayed explicitly in the final step.

## Verification checklist

1. Import + publish a valid server-side template with a non-empty contract.
2. Open `/ru/catalog/:slug`, click “Использовать шаблон”.
3. Change permitted names and date, verify immediate preview changes.
4. Refresh and confirm the draft is restored for the same template version.
5. Open `/ky/editor?template=:slug` and test bilingual fields.
6. Test a contract with no optional media and a contract with every supported
   field type.
7. Confirm unauthorized keys are rejected by `personalizeDocument`.
8. Confirm the old `/ru/editor?template=editorial-monochrome-wedding`
   still opens the legacy editor.
9. Run `npm run typecheck` and existing Studio personalization regression tests.
10. Check 320px / 375px / 430px mobile widths, iOS safe-area and reduced motion.

This stage does not require a new Prisma migration and does not modify
Admin Studio v2 or its existing routes.
