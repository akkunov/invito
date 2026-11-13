import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
let sourceFiles = 0;
function visit(root) {
  for (const e of readdirSync(root, { withFileTypes: true })) {
    const file = join(root, e.name);
    if (e.isDirectory()) { visit(file); continue; }
    if (!/\.tsx?$/.test(file)) continue;
    sourceFiles++;
    const text = readFileSync(file, 'utf8');
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    assert.equal(ast.parseDiagnostics.length, 0, `Syntax errors: ${file}`);
    for (const match of text.matchAll(/from\s+["'](@\/[^"']+)["']/g)) {
      const path = match[1].replace('@/', 'src/');
      assert.ok(['.ts', '.tsx', '.json', '.js', '.mjs'].some(ext => existsSync(path + ext)), `Unresolved local import: ${match[1]} in ${file}`);
    }
    if (text.includes('"use client"')) {
      const importsBeforeDirective = text.split('"use client"')[0].trim();
      assert.equal(importsBeforeDirective, '', `use client directive must precede imports in ${file}`);
    }
  }
}
visit('src');
const canvas = readFileSync('src/components/invitation/invitation-canvas.tsx', 'utf8');
assert.match(canvas, /case "gallery": return <GalleryBlock/);
assert.match(canvas, /case "program": return <ProgramRoadmap/);
assert.match(canvas, /MusicPlayer/);
const ref = readFileSync('src/components/invitation/reference-hero.tsx', 'utf8');
assert.match(ref, /reference-fixed-ornaments/);
assert.match(ref, /portraitDataUrl/);
const editor = readFileSync('src/features/invitations/use-invitation-editor.ts', 'utf8');
assert.match(editor, /galleryDataUrls\.slice\(0, 6\)/);
assert.match(editor, /updateProgramLocalized/);
const birth = readFileSync('src/components/invitation/birthday-invitation.tsx', 'utf8');
assert.match(birth, /case "gallery": return <GalleryBlock/);
console.log(`PASS: ${sourceFiles} TS/TSX files syntax+local imports, gallery/program/music/locked decor integrations`);
