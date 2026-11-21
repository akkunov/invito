# eventiq public gallery behavior

Visual language: [DESIGN.md](DESIGN.md). This contract covers the public shell changed
by the gallery redesign. Existing editor document/history/storage behavior is retained.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Navigation | SiteHeader, MobileMenu, SiteFooter, constants/routes.ts | UX-CONTRACT.md | Locale-aware routes; catalog → detail → editor; home anchors remain available | Existing editor-navigation test + HTTP route checks |
| Select/Listbox | Catalog native select elements | UX-CONTRACT.md | OS-owned category and price popups; submit GET form; URL is committed state | Typecheck + HTTP filtered results; keyboard popup still needs browser QA |
| Form | Server catalog GET form + CatalogSearch | UX-CONTRACT.md | Preserve entered query/filters in URL; clear search submits immediately while retaining select values; no remote debounce | HTTP result checks; interaction needs browser QA |
| Scrollbar | globals.css | UX-CONTRACT.md | Visible global baseline; forced-colors uses native colors | Static CSS inspection; computed-style QA pending |
| Preview | TemplatePreviewButton + template detail preview=1 | UX-CONTRACT.md | Native modal; title and iframe have accessible names; Escape/close restore trigger focus; iframe only mounts while open | Build + HTTP embedded response; real focus QA pending |

## States and navigation

- Hero design buttons expose aria-pressed; changing the design updates the preview name
  in a polite live region. No autoplay, drag-only operation or hidden hover-only control.
- A card image/name navigates to the full detail page. The explicit quick-view button
  opens the same invitation in a modal; it never creates a draft by itself.
- Preview loading reserves iframe geometry. A persistent Open separately link provides
  recovery if embedded loading fails. Closing unmounts the iframe and stops its audio.
- Choose design navigates to the existing editor with the same template identifier.
- Catalog search uses full-text filtering already in seed-templates; category/price
  filtering remains server-owned. Empty results retain filters and offer a reset link.
- Query length, pricing labels and template availability are not reinterpreted by the redesign.
- Native selects are intentionally platform-owned. No authored popup geometry is promised.

## Locale and accessibility

RU/KY labels follow the active route; names and descriptions come from existing templates.
Use native links/buttons, visible focus, accessible icon labels and reduced-motion rules.
Mobile navigation is a non-modal disclosure; Escape closes it and returns focus to its trigger.
No new payments, permissions, publishing, deletion or personal-data transfer is introduced.

## Verification limits

The published deployment is paused. The user authorized work without current-site
screenshots. Localhost was not reachable from the connected cloud browser. Build,
static regression and server response evidence do not substitute for desktop/mobile,
modal keyboard, reduced-motion and visual comparison in a real browser.

## Studio v2 invitation blocks

The canonical guest form and widget renderer is InvitationBlockView, with RSVP validation and guest-mode isolation in invitation-behavior.ts. Native inputs/selects use platform semantics; date settings use typed ISO instants with explicit time zones. Preview validates locally and does not send or persist guest responses. Live requires an injected transport, not a simulated success state. See [ADR-009](docs/studio-v2/INVITATION-BEHAVIOR.md). Browser interaction and accessibility verification remain required.
