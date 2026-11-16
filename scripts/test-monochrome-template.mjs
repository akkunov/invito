import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const read = path => readFileSync(path,"utf8");
const registry = read("src/features/invitations/seed-templates.ts");
assert.match(registry,/rivieraTemplate, monochromeTemplate/);
const theme = read("src/features/invitations/monochrome-template.ts");
assert.match(theme,/editorial-monochrome-wedding/);
const canvas = read("src/components/invitation/invitation-canvas.tsx");
assert.match(canvas,/MonochromeInvitation/);
const artwork = read("src/components/templates/template-artwork.tsx");
assert.match(artwork,/MonochromeTemplateArtwork/);
const style = read("src/app/monochrome.css");
for (const selector of [".mono-hero",".mono-date",".mono-venue",".mono-details",".mono-rsvp",".mono-gallery"]) {
  assert.ok(style.includes(selector),selector);
}
const component=read("src/components/invitation/monochrome-invitation.tsx");
for (const id of ["cover","message","details","location","program","gallery","rsvp"]) {
  assert.ok(component.includes(`data-editor-block="${id}"`),id);
}
assert.match(component,/venuePhotoDataUrl/);
assert.match(component,/gallery/);
assert.match(read("src/features/invitations/invitation.schema.ts"),/otherNote/);
assert.match(read("src/components/editor/editor-inspector.tsx"),/otherNote/);
assert.ok(existsSync("src/components/templates/monochrome-template-artwork.tsx"));
console.log("PASS: second monochrome wedding template and editor integration");
