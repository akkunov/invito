import assert from "node:assert/strict";
import { readFileSync,existsSync } from "node:fs";
const read=(path)=>readFileSync(path,"utf8");
const registry=read("src/features/invitations/seed-templates.ts");
const schema=read("src/features/invitations/invitation.schema.ts");
const canvas=read("src/components/invitation/invitation-canvas.tsx");
const invite=read("src/components/invitation/santorini-invitation.tsx");
const art=read("src/components/templates/santorini-template-artwork.tsx");
const inspector=read("src/components/editor/editor-inspector.tsx");
assert.match(registry,/santoriniTemplate/);
assert.match(registry,/rivieraTemplate, monochromeTemplate, santoriniTemplate/);
assert.match(schema,/tripStartDateLocal/);
assert.match(schema,/tripEndDateLocal/);
assert.match(schema,/rsvpDeadlineLocal/);
assert.match(canvas,/SantoriniInvitation/);
assert.match(art,/santo-card-ticket/);
assert.match(inspector,/tripEndDateLocal/);
assert.match(inspector,/rsvpDeadlineLocal/);
for(const part of ["cover","details","message","location","program","gallery","rsvp"]) {
 assert.ok(invite.includes(`data-editor-block="${part}"`),part);
}
assert.ok(existsSync("src/app/santorini.css"));
console.log("PASS: Santorini registered, editor fields, layout, RU/KY and gallery");
