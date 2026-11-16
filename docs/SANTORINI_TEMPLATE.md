# Wedding Travel / Santorini

Third invitation template in INVITO.

- ID: `wedding-travel-santorini`
- Routes: `/ru/templates/wedding-travel-santorini`, `/ky/templates/wedding-travel-santorini`
- Editor: `/ru/editor?template=wedding-travel-santorini`
- Reuses shared image uploaders, music, RU/KY program, venue photo and gallery (max 4 images).
- Travel start/end dates and RSVP deadline are independently editable.
- RSVP selection remains client-side preview; no server submission.
- Individual HTML/CSS elements render the travel ticket, stamps, names and itinerary; this is not a flattened reference screenshot.

## Photos and licensing

Initial Santorini photos are loaded from Wikimedia Commons (remote placeholders to be replaced with user-owned imagery before production):
1. **Oia Santorini Blue Domes.jpg**, Danbu14, see https://commons.wikimedia.org/wiki/File:Oia_Santorini_Blue_Domes.jpg
2. **Oia Sunset ,Santorini.jpg**, author/licensing on https://commons.wikimedia.org/wiki/File:Oia_Sunset_,Santorini.jpg
3. **Sunset in Santorini1.jpg**, kuhnmi, CC BY 2.0, https://commons.wikimedia.org/wiki/File:Sunset_in_Santorini1.jpg

Credit the photographers and satisfy the applicable license before using these in production. The screenshot reference supplied by the user was not used as a flattened background. Original decorative assets from that screenshot were not available separately; paper textures and stamps are approximated in CSS. Visual browser comparison against the reference is still required.

`npm run test:santorini`, `npm run typecheck` and `npm run build` are available for verification.
