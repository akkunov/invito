# Editorial Collection — Birthday, Wedding, Кыз узатуу

New templates based on the approved editorial birthday concept. The INVITO shell retains its dark/orange identity, while invitation pages use independent palettes.

| Slug | Category | Look | Fallback photo |
|---|---|---|---|
| `editorial-birthday` | Birthday | Oversized age, black-and-white portrait, paper-like typography | `public/images/reference/burgundy-sample.webp` |
| `editorial-wedding` | Wedding | Airy split cover, initials, photographed hands | `public/images/reference/blue-sample.webp` |
| `editorial-kyz-uzatuu` | Кыз узатуу | Bride portrait, fixed ornamental border, terracotta-rose accents | `public/images/birthday/bloom-demo.jpg` |

- Preview at `/ru/templates/<slug>` or `/ky/templates/<slug>`; edit at `/ru/editor?template=<slug>` (likewise KY).
- Cover photo, vertical focal position, names, locale-specific title/message/date/location, gallery, program, dress code and guest note can be edited in the existing editor. Music is attached using the Music block. Decorative ornaments are CSS, **not** part of the replaceable photo.
- All templates share the existing countdown, gallery, scroll-roadmap and music modules. `editorial-templates.ts` owns the default content and event-specific program data.
- Scroll reveal is based on IntersectionObserver and an ancestor scrolling container. `prefers-reduced-motion` leaves everything visible.
- **Not implemented:** server publishing, real RSVP submission or remote image/audio hosting. Existing browser-local draft behavior still applies.
- The sample assets are visual demonstrations and must be replaced with licensed or user-provided assets for public commercial distribution.
