import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const configs = read("src/features/invitations/editorial-templates.ts");
const seed = read("src/features/invitations/seed-templates.ts");
const canvas = read("src/components/invitation/invitation-canvas.tsx");
const previews = read("src/components/templates/template-artwork.tsx");
const editor = read("src/components/editor/editor-inspector.tsx");
const css = read("src/app/editorial.css");
const hero = read("src/components/invitation/editorial-hero.tsx");
const article = read("src/components/invitation/editorial-invitation.tsx");

for (const slug of ["editorial-birthday", "editorial-wedding", "editorial-kyz-uzatuu"]) {
  assert.match(configs, new RegExp(`id: "${slug}"`));
}
assert.match(configs, /defaultProgram:/);
assert.match(seed, /\.\.\.editorialTemplates/);
assert.match(canvas, /getEditorialVariant\(document\.templateId\)/);
assert.match(previews, /getEditorialVariant\(template\.id\)/);
assert.match(hero, /media\?\.portraitDataUrl \?\? editorialDesigns\[variant\]\.image/);
assert.match(hero, /data-editor-block="cover"/);
for (const id of ["message", "details", "program", "location", "gallery", "music", "rsvp"]) {
  assert.match(article, new RegExp(`case "${id}"`));
}
assert.match(editor, /updateLocalized\("dressCode"/);
assert.match(editor, /updateLocalized\("giftNote"/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /\.ed-kyz \.ed-fixed-motif/);
assert.match(read("src/app/[locale]/layout.tsx"), /editorial\.css/);
console.log("PASS: Editorial Birthday / Wedding / Кыз узатуу registration, editable covers, program, gallery, accessibility");
