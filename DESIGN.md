---
version: alpha
colors:
  paper: "#f2f3f5"
  ink: "#20242b"
  muted: "#606773"
  line: "#cdd1d9"
  primary: "#2549d9"
  surface: "#e2e7f0"
typography:
  ui:
    fontFamily: "Inter Tight, Arial, sans-serif"
rounded:
  control: "6px"
  stage: "8px"
omitted:
  - section: spacing
    reason: "Fluid route-specific spacing is documented in Layout."
  - section: components
    reason: "Runtime component recipes remain canonical; see Components."
---

# eventiq — invitation gallery

## Overview

eventiq helps Russian- and Kyrgyz-speaking hosts choose an invitation, personalize it,
and retain a local browser draft. The public site is a gallery; the editor is a tool.
Awwwards is a reference for typographic scale, generous media and gallery rhythm,
not a source of copied assets or claims of awards. Existing invitation photography,
artwork, template identities and editor functionality stay independent.

The signature is a tilted, switchable invitation on a blue-grey exhibition stage.
The surrounding UI stays quiet. The former warm paper/olive landing and dark catalog
were intentionally replaced by one cool gallery shell as part of the requested redesign.

## Colors

Runtime CSS remains canonical (Model B). `src/app/landing-editorial.css` owns the
public shell tokens. This file mirrors their exact accepted values.

| Token | CSS variable | Use |
| --- | --- | --- |
| paper | --ed-paper | Public page canvas |
| ink | --ed-ink | Headings, labels |
| muted | --ed-muted | Supporting copy |
| line | --ed-line | Dividers and control borders |
| primary | --ed-blue | Actions, focus, editorial accents |
| surface | --ed-surface | Exhibition stage and feature section |

The shell maps background/foreground/accent/border/muted aliases to these variables.
Do not apply shell colors to the invitation canvas or editor. The product currently
has no theme switcher; do not advertise dark-mode support.

## Typography

The public interface uses **Inter Tight**, matching the observed Awwwards UI font.
`src/components/layout/public-font.ts` loads only the normal style with Latin and
Cyrillic subsets via next/font. Its `--font-public` variable is applied to each public
shell and consumed by `landing-editorial.css`. Body/navigation use normal upright
weights; headings use 600, card titles 500–550. Headline tracking is no tighter than
-.04em for readability. Colored phrases inherit their heading typography.

No italic, decorative serif or artificially slanted text is permitted in public UI.
Typography contrast comes from scale, weight, spacing and color. Existing Onest and
Noto Serif Display remain confined to the editor and invitation artwork, whose
independent template identities are outside the public-shell typography contract.

## Layout

Public containers cap at 1440px, with 40px desktop, 24px tablet and 18px phone gutters.
Hero is asymmetric, with copy slightly wider than the invitation stage. The collection
has three staggered columns, two below 800px and one below 600px. Mobile controls
remain explicit; hover never gates discovery. Process numbering represents actual steps.

## Elevation & Depth

Reserve the main shadow for the invitation on its exhibition stage. Use dividers
and whitespace for page structure. Native modal backdrop is the only overlay layer.

## Shapes

Controls use 6px corners; exhibition surfaces 8px. The circular arrow is a navigation
cue on the invitation, not a repeated decorative badge. Do not stretch template artwork.

## Components

SiteHeader, MobileMenu and SiteFooter own navigation. TemplateCard owns collection
and catalog cards. HeroShowcase switches existing artwork without automatic rotation.
TemplatePreviewButton owns the native dialog, lazy iframe and editor links.
CatalogSearch owns text clearing; the server catalog owns GET search/filter results.
See UX-CONTRACT.md for observable behavior.

Motion is limited to an initial invitation reveal and hover transforms, using CSS only.
No animation library is added for these effects. All motion respects reduced-motion.
Global scrollbar tokens live in globals.css and cover editor and iframe documents too.

## Do's and Don'ts

- Preserve three template IDs, RU/KY routes and local draft storage keys.
- Show real artwork; never invent publishing, RSVP delivery or payment success.
- Use visible focus and explicit preview controls for touch and keyboard.
- Keep interface copy factual about browser-only drafts and pending publication.
- Do not change invitation art direction through public shell selectors.
- Verify rendered layouts when an accessible preview is available. Source checks alone
  do not establish visual fidelity or runtime accessibility.


## Eventiq Mobile Customer Editor 3.0 (product surface)

The customer editor has **independent product chrome** from the public
blue-grey gallery. Its canonical runtime owner is
`src/components/customer-editor/customer-mobile-editor.css`, and
the accepted mobile controls use the existing variables
`--ce-ink`, `--ce-muted`, `--ce-border`, and `--ce-orange`.
Do not import `--ed-*` gallery tokens into invitation artwork.

At phone widths (<=850px), design around a single, fully visible
invitation page; minimal top header, section-chip navigation, touch
selection, and a safe-area-aware bottom action dock. Editing controls
open in the bottom sheet and use `SimpleField` rather than a new
parallel form. The signature is **an actual invitation as the canvas**,
not a thumbnail beside a long form. Restrict selection to
designer-authorized personalization targets.

The artwork is controlled by the versioned template's own tokens and
may be ivory, national Kyrgyz or modern editorial; do not globally
restyle it with product UI CSS. The editor interface uses upright
readable UI type. Preserve native field hit targets, visible focus,
RU/KY labels and reduced-motion behavior. Desktop remains on its
existing two-column layout until a separately approved iteration.
