import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync("src/features/invitations/birthday-templates.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const moduleScope = { exports: {} };
new Function("module", "exports", compiled)(moduleScope, moduleScope.exports);
const { birthdayTemplates, getBirthdayVariant } = moduleScope.exports;
assert.equal(birthdayTemplates.length, 3);
assert.deepEqual(birthdayTemplates.map((template) => template.id), ["midnight-aura", "soft-bloom", "golden-milestone"]);
assert.deepEqual(["midnight-aura", "soft-bloom", "golden-milestone"].map(getBirthdayVariant), ["midnight", "bloom", "milestone"]);
assert.equal(getBirthdayVariant("unknown"), null);
for (const template of birthdayTemplates) {
  assert.ok(template.defaultContent.name1.length > 0);
  assert.ok(template.defaultContent.age >= 1 && template.defaultContent.age <= 120);
  assert.ok(template.defaultContent.title.ru && template.defaultContent.title.ky);
  assert.ok(template.defaultContent.message.ru && template.defaultContent.message.ky);
}
console.log("Birthday templates: 3 variants, locales, and config OK");
