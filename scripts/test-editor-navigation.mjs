import fs from "node:fs";
import assert from "node:assert/strict";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const hook = read("src/features/invitations/use-editor-section-sync.ts");
const editor = read("src/components/editor/invitation-editor.tsx");
const sidebar = read("src/components/editor/editor-sidebar.tsx");
assert.match(editor, /scrollToBlock\(kind\)/);
assert.match(editor, /ref=\{previewRef\}/);
assert.match(hook, /addEventListener\("scroll"/);
assert.match(hook, /getBoundingClientRect\(\)/);
assert.match(hook, /prefers-reduced-motion/);
assert.match(sidebar, /list\.scrollTo\(/);
const markers = [
  ["src/components/invitation/birthday-hero.tsx", "cover"],
  ["src/components/invitation/birthday-story.tsx", "message"],
  ["src/components/invitation/birthday-event-details.tsx", "details"],
  ["src/components/invitation/gallery-block.tsx", "gallery"],
  ["src/components/invitation/program-roadmap.tsx", "program"],
  ["src/components/invitation/reference-hero.tsx", "cover"],
  ["src/components/invitation/countdown-block.tsx", "countdown"],
];
for (const [file, id] of markers) {
  assert.ok(read(file).includes(`data-editor-block="${id}"`), `Missing section marker ${id} in ${file}`);
}
assert.match(read("src/components/invitation/reference-invitation.tsx"), /data-editor-block=\{block\.id\}/);
for (const id of ["cover", "message", "details", "location", "rsvp"]) {
  assert.ok(read("src/components/invitation/invitation-canvas.tsx").includes(`data-editor-block="${id}"`));
}
console.log("Editor navigation: section markers and event handlers are present");
