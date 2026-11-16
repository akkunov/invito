import fs from "node:fs";
import assert from "node:assert/strict";
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const hook = read("src/features/invitations/use-editor-section-sync.ts");
const editor = read("src/components/editor/invitation-editor.tsx");
const invitation = read("src/components/invitation/riviera-invitation.tsx");
assert.match(editor, /scrollToBlock\(kind\)/);
assert.match(editor, /ref=\{previewRef\}/);
assert.match(hook, /getBoundingClientRect\(\)/);
assert.match(hook, /prefers-reduced-motion/);
for (const id of ["cover", "message", "details", "location", "program", "gallery", "rsvp"]) {
  assert.ok(invitation.includes(`data-editor-block="${id}"`), id);
}
console.log("PASS: Riviera editor navigation markers and handlers");
