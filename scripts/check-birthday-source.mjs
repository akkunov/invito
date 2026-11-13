import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// Global TypeScript allows syntax validation without depending on the npm registry.
const ts = require("typescript");
const sourceRoot = resolve("src");
let checked = 0;

function walk(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const absolute = join(path, entry.name);
    if (entry.isDirectory()) { walk(absolute); continue; }
    if (!/\.tsx?$/.test(entry.name)) continue;
    checked += 1;
    const result = ts.transpileModule(readFileSync(absolute, "utf8"), {
      fileName: absolute,
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.Preserve },
      reportDiagnostics: true,
    });
    const errors = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
    assert.equal(errors.length, 0, `Syntax error in ${absolute}`);
  }
}
walk(sourceRoot);
console.log(`${checked} TypeScript/TSX source files: syntax OK`);
