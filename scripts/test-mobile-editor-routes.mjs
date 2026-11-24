import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=path=>readFileSync(path,"utf8");
test("both document adapters use the same canonical mobile editor and section manager",()=>{
 const legacy=read("src/components/editor/legacy-mobile-workspace.tsx");
 const remote=read("src/components/customer-editor/customer-mobile-editor.tsx");
 for(const source of [legacy,remote]){
   assert.ok(source.includes("return <UniversalMobileEditor"));
   assert.ok(source.includes("<UniversalSectionManager"));
   assert.ok(!source.includes('<nav className="ce-mobile-dock"'));
   assert.ok(!source.includes('<nav className="lm3-dock"'));
 }
 const shell=read("src/components/customer-editor/universal-mobile-editor.tsx");
 for(const tool of ["text","photo","style","sections","music"])
   assert.ok(shell.includes('id:"'+tool+'"'));
 assert.ok(shell.includes("ce-mobile-page-nav"));
 assert.ok(shell.includes("ce-mobile-publish-top"));
 assert.ok(remote.includes("CustomerCloudControls"));
});
test("legacy desktop route remains intact",()=>{
 const route=read("src/app/[locale]/editor/page.tsx");
 const editor=read("src/components/editor/invitation-editor.tsx");
 assert.match(route,/InvitationEditor/);
 assert.match(route,/CustomerMobileEditor/);
 assert.match(editor,/if\(phone\)return <LegacyMobileWorkspace/);
 assert.match(editor,/EditorToolbar/);
});
test("shared mobile shell and section properties are responsive",()=>{
 const css=read("src/components/customer-editor/customer-mobile-editor.css");
 const legacy=read("src/components/editor/legacy-mobile-workspace.css");
 assert.match(css,/@media\(max-width:850px\)/);
 assert.ok(css.includes(".ue-mobile"));
 assert.ok(css.includes(".ue-section-properties"));
 assert.ok(legacy.includes("Legacy adapter field styles only"));
});
