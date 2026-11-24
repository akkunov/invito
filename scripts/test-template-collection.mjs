import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {assertTemplateAssetSize} from "./template-asset-size.mjs";
import {assertReadyAssets, validatedTemplateVersion} from "../server/domain/persistence-contract.ts";
import {bindDocument, countdownTarget, validateRsvp} from "../src/features/studio-v2/core/invitation-behavior.ts";
import {layoutCollection} from "../src/features/studio-v2/core/heritage-layout.ts";
import {finalizePersonalization} from "../src/features/studio-v2/core/personalization.ts";
import {weddingCalendar} from "../src/features/studio-v2/core/calendar.ts";
import {recipes} from "../templates/collection/recipes.mjs";

const assetsSource=readFileSync(new URL("../server/src/modules/documents/collection-static-assets.ts",import.meta.url),"utf8");
const registered=new Set([...assetsSource.matchAll(/"(\/images\/collection\/[^"]+)"/g)].map(match=>match[1]));
const sourceUrl=new URL("../tamplates_codex/eventiq-10-templates-codex/templates-index.json",import.meta.url);
const index=JSON.parse(readFileSync(sourceUrl,"utf8"));

assert.deepEqual(Object.keys(recipes).sort(),index.map(entry=>entry.slug).sort());
for(const {slug,geometry} of index){
 test(slug+" compiles to a reusable package with two editable locales",()=>{
  const pack=JSON.parse(readFileSync(new URL("../templates/packages/"+slug+".v1.json",import.meta.url),"utf8"));
  const {snapshot,contract}=validatedTemplateVersion(pack.document,pack.personalization);
  assert.equal(pack.manifest.slug,slug);
  assert.equal(snapshot.presentation,"collection");
  assert.equal(snapshot.pages.length,4);
  assert.deepEqual(contract.locales,["ru","ky"]);
  const measured=JSON.parse(readFileSync(new URL(geometry,sourceUrl),"utf8"));
  for(const [i,page] of snapshot.pages.entries()){
   const root=snapshot.nodes[page.rootNodeId];
   assert.equal(root.width,(measured.pages??measured.artboards)[i].width);
  }
  assertReadyAssets(snapshot,"00000000-0000-4000-8000-000000000001",[],registered);
  for(const asset of Object.values(snapshot.assets)){
   assertTemplateAssetSize(new URL("../public"+asset.storageKey,import.meta.url),asset);
  }
  const date="2027-12-20T11:30:00+06:00";
  const firstPhoto=contract.fields.find(field=>field.kind==="image");
  const firstAsset=snapshot.nodes[firstPhoto.nodeId].assetId;
  const replacement=Object.values(snapshot.assets).find(asset=>!asset.decorative&&asset.id!==firstAsset);
  const patched=bindDocument(finalizePersonalization(snapshot,contract,{locale:"ky",values:{
   ceremonyDate:{kind:"binding",value:{type:"date",value:date}},
   [firstPhoto.id]:{kind:"image",assetId:replacement.id},
  }}));
  assert.equal(patched.locale,"ky");
  assert.equal(patched.nodes[firstPhoto.nodeId].assetId,replacement.id);
  assert.equal(patched.values.ceremonyDate.value,date);
  for(const node of Object.values(patched.nodes)){
   if(node.type==="widget"&&["countdown","calendar"].includes(node.block.kind))assert.equal(countdownTarget(patched,node.block),date);
  }
  for(const width of [320,360,375,390,412,430]){
   const resized=layoutCollection(patched,width,{});
   for(const page of patched.pages)assert.equal(resized.nodes[page.rootNodeId].width,width);
  }
 });
}

test("RSVP wishes are optional, bounded, trimmed, and preserve decline semantics",()=>{
 const reply={name:"Гость",attendance:"no",guests:0,wish:"  Счастья!  "};
 assert.equal(validateRsvp(reply,4).wish,"Счастья!");
 assert.throws(()=>validateRsvp({...reply,wish:"я".repeat(501)},4));
 assert.throws(()=>validateRsvp({...reply,guests:1},4));
});

test("Calendar export escapes and folds UTF-8 content with a stable UID and UTC start",()=>{
 const ics=weddingCalendar({
  id:"test",instant:"2027-05-29T17:00:00+06:00",title:"Той, свадьба;\n"+("Ө Ү Ң ".repeat(30)),
  address:"Бишкек\\центр",now:new Date("2026-01-01T00:00:00.000Z"),
 });
 assert.match(ics,/UID:test@eventiq\r\n/);
 assert.match(ics,/DTSTART:20270529T110000Z\r\n/);
 assert.match(ics,/SUMMARY:Той\\, свадьба\\;\\n/);
 assert.doesNotMatch(ics,/DTEND/);
 assert.ok(ics.split("\r\n").every(line=>Buffer.byteLength(line)<=75));
});
