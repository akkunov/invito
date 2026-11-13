import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const file = 'src/features/invitations/reference-templates.ts';
const compiled = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
assert.equal(compiled.diagnostics?.length ?? 0, 0);
const moduleObject = { exports: {} };
new Function('module', 'exports', 'require', compiled.outputText)(moduleObject, moduleObject.exports, require);
const { referenceTemplateData, referenceTemplates, getReferenceTemplate } = moduleObject.exports;
assert.equal(referenceTemplates.length, 9, 'Every supplied reference should register as a template');
assert.equal(new Set(referenceTemplates.map(x => x.id)).size, 9);
assert.equal(new Set(referenceTemplateData.map(x => x.theme)).size, 9);
for (const item of referenceTemplateData) {
  assert.ok(item.ru && item.ky && item.descriptionRu && item.descriptionKy);
  assert.match(item.accent, /^#[0-9a-fA-F]{6}$/);
  assert.ok(getReferenceTemplate(item.id));
  if (item.decor) assert.ok(existsSync('public' + item.decor), 'Missing fixed ornament: ' + item.decor);
  if (item.image) assert.ok(existsSync('public' + item.image), 'Missing cover photo: ' + item.image);
}
for (const component of ['gallery-block.tsx','program-roadmap.tsx','reference-hero.tsx','reference-invitation.tsx','music-player.tsx']) assert.ok(existsSync('src/components/invitation/' + component));
console.log('PASS: 9 reference templates, unique compositions, RU/KY, fixed border assets');
