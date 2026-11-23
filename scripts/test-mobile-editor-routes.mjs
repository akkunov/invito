import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=path=>readFileSync(path,"utf8");

test("legacy seed routes use a real phone workspace without replacing desktop",()=>{
 const route=read("src/app/[locale]/editor/page.tsx");
 const editor=read("src/components/editor/invitation-editor.tsx");
 assert.match(route,/InvitationEditor/);
 assert.match(route,/CustomerMobileEditor/);
 assert.match(editor,/LegacyMobileWorkspace/);
 assert.match(editor,/if\(phone\)return <LegacyMobileWorkspace/);
 assert.match(editor,/EditorToolbar/);
});

test("remote customer editor has approved five mobile tools, pages and publish",()=>{
 const source=read("src/components/customer-editor/customer-mobile-editor.tsx");
 for(const target of ['openTool("text"','openTool("photo"','openTool("style"','setMobileSectionsOpen(true)','openTool("music"','ce-mobile-publish-top','ce-mobile-page-nav','CustomerCloudControls'])
   assert.ok(source.includes(target),target+" missing");
});

test("mobile styling is responsive and preserves desktop rules",()=>{
 const css=read("src/components/customer-editor/customer-mobile-editor.css");
 const legacy=read("src/components/editor/legacy-mobile-workspace.css");
 assert.match(css,/@media\(max-width:850px\)/);
 assert.match(css,/ce-mobile-topbar/);
 assert.match(css,/ce-mobile-dock/);
 assert.match(css,/ce-mobile-sections-screen/);
 assert.match(legacy,/lm3-sheet/);
 assert.match(legacy,/@media\(min-width:851px\)/);
});
