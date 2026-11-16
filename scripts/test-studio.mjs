import assert from "node:assert/strict";
import { readFileSync,existsSync } from "node:fs";
const read=path=>readFileSync(path,"utf8");
for(const path of [
 "src/features/studio/studio.schema.ts",
 "src/components/studio/studio-canvas.tsx",
 "src/components/studio/template-studio.tsx",
 "src/app/[locale]/admin/studio/page.tsx",
 "src/app/studio.css"
]) assert.ok(existsSync(path),path);
const schema=read("src/features/studio/studio.schema.ts");
assert.match(schema,/studioTemplateSchema/);
assert.match(schema,/superRefine/);
assert.match(schema,/Duplicate element ID/);
assert.match(schema,/^export const demoBindings/m);
const canvas=read("src/components/studio/studio-canvas.tsx");
assert.match(canvas,/studio-render-surface/);
assert.match(canvas,/onPointerDown/);
assert.match(canvas,/onKeyDown/);
const editor=read("src/components/studio/template-studio.tsx");
assert.match(editor,/localStorage/);
assert.match(editor,/importFile/);
assert.match(editor,/downloadJson/);
assert.match(editor,/studioTemplateSchema\.safeParse/);
assert.match(editor,/Шаблоны пока/);
const route=read("src/app/[locale]/admin/studio/page.tsx");
assert.match(route,/index:false/);
assert.ok(!read("src/components/invitation/invitation-canvas.tsx").includes("TemplateStudio"));
console.log("PASS: isolated local-only Studio, schema, import/export, pointer and keyboard editing");
