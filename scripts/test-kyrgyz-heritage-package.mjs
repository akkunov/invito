import assert from "node:assert/strict";
import {readFileSync, statSync} from "node:fs";
import {test} from "node:test";
import {assertReadyAssets, validatedTemplateVersion} from "../server/domain/persistence-contract.ts";
import {bindDocument, countdownTarget} from "../src/features/studio-v2/core/invitation-behavior.ts";
import {layoutHeritagePresentation} from "../src/features/studio-v2/core/heritage-layout.ts";
import {finalizePersonalization, personalizationIssues} from "../src/features/studio-v2/core/personalization.ts";

const pack=JSON.parse(readFileSync(new URL("../templates/packages/kyrgyz-heritage.v1.json", import.meta.url)));
const {snapshot,contract}=validatedTemplateVersion(pack.document,pack.personalization);
const assetRegistry=readFileSync(new URL("../server/src/modules/documents/documents-input.ts",import.meta.url),"utf8");

test("All four authored artboards and static assets pass the import contract",()=>{
 assert.equal(pack.manifest.slug,"kyrgyz-heritage");
 assert.equal(snapshot.presentation,"heritage");
 assert.deepEqual(contract.locales,["ru","ky"]);
 assert.deepEqual(personalizationIssues(snapshot,contract),[]);
 assert.equal(Object.values(snapshot.assets).filter(asset=>!asset.decorative).length,6);
 const trusted=new Set([...assetRegistry.matchAll(/"(\/images\/kyrgyz-heritage\/[^"]+)"/g)].map(match=>match[1]));
 assertReadyAssets(snapshot,"00000000-0000-4000-8000-000000000001",[],trusted);
 for(const asset of Object.values(snapshot.assets)){
  assert.equal(statSync(new URL("../public"+asset.storageKey,import.meta.url)).size,asset.sizeBytes);
 }
 assert.deepEqual(snapshot.pages.map(page=>page.id),["cover","invitation","gallery","rsvpPage"]);
 for(const page of snapshot.pages){
  const key=page.rootNodeId;
  const root=snapshot.nodes[key];
  assert.equal(root.width,390);
  assert.equal(root.height,1050);
  for(const id of root.children){
   const n=snapshot.nodes[id];
   assert.ok(n.x>=0&&n.y>=0&&n.x+n.width<=390&&n.y+n.height<=1050,id);
  }
 }
});

test("Personalized publication keeps its locale, date binding, photo permissions and layout",()=>{
 const date="2027-08-12T17:00:00+06:00";
 for(const [locale,formatted] of [["ru","12 АВГУСТА 2027"],["ky","12-АВГУСТ 2027"]]){
  for(const count of [1,2,3,4]){
   const assets=["gallery-rings","gallery-bouquet","gallery-textile","gallery-landscape"].slice(0,count);
   const doc=bindDocument(finalizePersonalization(snapshot,contract,{locale,values:{
    date:{kind:"binding",value:{type:"date",value:date}},
    coverPhoto:{kind:"image",assetId:"venue"},venuePhotoField:{kind:"image",assetId:"cover"},
    galleryPhotos:{kind:"gallery",assetIds:assets},
   }}));
   assert.equal(doc.nodes.coverDate.runs[0].text,formatted);
   assert.equal(countdownTarget(doc,doc.nodes.countdown.block),date);
   assert.equal(doc.nodes.coverPhoto.assetId,"venue");
   assert.equal(doc.nodes.venuePhoto.assetId,"cover");
   assert.equal(doc.nodes.galleryWidget.block.layout,"stackedMosaic");
   assert.deepEqual(doc.nodes.galleryWidget.block.assetIds,assets);
  }
 }
 assert.throws(()=>finalizePersonalization(snapshot,contract,{values:{galleryPhotos:{kind:"gallery",assetIds:["divider"]}}}));
 assert.throws(()=>finalizePersonalization(snapshot,contract,{values:{coverPhoto:{kind:"image",assetId:"mountain-line"}}}));
});

test("Measured content pushes ornaments down at narrow widths",()=>{
 const doc=layoutHeritagePresentation(snapshot,320,{coverNames:210,programTimeline:506,rsvpWidget:530});
 assert.equal(doc.nodes.coverRoot.width,320);
 assert.equal(doc.nodes.coverDate.y,962);
 assert.equal(doc.nodes.bottomOrnament.y,1102);
 assert.equal(doc.nodes.mountainIllustration.y,976);
 assert.equal(doc.nodes.rsvpPageRoot.height,1155);
});
