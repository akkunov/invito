import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assertTemplateAssetSize} from "./template-asset-size.mjs";
import {test} from "node:test";
import {maskCss} from "../src/features/studio-v2/core/appearance.ts";
import {assertReadyAssets, validatedTemplateVersion} from "../server/domain/persistence-contract.ts";
import {bindDocument, countdownTarget} from "../src/features/studio-v2/core/invitation-behavior.ts";
import {layoutHeritagePresentation} from "../src/features/studio-v2/core/heritage-layout.ts";
import {finalizePersonalization, personalizationIssues} from "../src/features/studio-v2/core/personalization.ts";

const pack=JSON.parse(readFileSync(new URL("../templates/packages/shyrdak.v1.json", import.meta.url)));
const {snapshot,contract}=validatedTemplateVersion(pack.document,pack.personalization);
const assetRegistry=readFileSync(new URL("../server/src/modules/documents/documents-input.ts",import.meta.url),"utf8");

test("All four authored artboards and static assets pass the import contract",()=>{
 assert.equal(pack.manifest.slug,"shyrdak");
 assert.equal(snapshot.presentation,"felt");
 assert.deepEqual(contract.locales,["ru","ky"]);
 assert.deepEqual(contract.fields.map(field=>field.id),[
  "names","invitation","date","venueName","address","coverPhoto","venuePhotoField","galleryPhotos","programField","response","musicTrack",
 ]);
 assert.equal(snapshot.nodes.musicPlayer.block.source,"");
 assert.deepEqual(snapshot.pages.map(p=>p.placement),[0,420,840,1260].map(x=>({x,y:0})));
 assert.deepEqual(personalizationIssues(snapshot,contract),[]);
 assert.equal(Object.values(snapshot.assets).filter(asset=>!asset.decorative).length,6);
 const trusted=new Set([...assetRegistry.matchAll(/"(\/images\/shyrdak\/[^"]+)"/g)].map(match=>match[1]));
 assertReadyAssets(snapshot,"00000000-0000-4000-8000-000000000001",[],trusted);
 for(const asset of Object.values(snapshot.assets)){
  assertTemplateAssetSize(new URL("../public"+asset.storageKey,import.meta.url),asset);
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
 for(const [locale,formatted] of [["ru","12 АВГУСТА 2027"],["ky","2027-ЖЫЛДЫН 12-АВГУСТУ"]]){
  for(const count of [1,2,3,4]){
   const assets=["gallery-04","gallery-03","gallery-02","gallery-01"].slice(0,count);
   const doc=bindDocument(finalizePersonalization(snapshot,contract,{locale,values:{
    date:{kind:"binding",value:{type:"date",value:date}},
    coverPhoto:{kind:"image",assetId:"venue"},venuePhotoField:{kind:"image",assetId:"cover"},
    galleryPhotos:{kind:"gallery",assetIds:assets},
   }}));
   assert.equal(doc.nodes.coverDate.runs[0].text,formatted);
   assert.equal(countdownTarget(doc,doc.nodes.countdown.block),date);
   assert.equal(doc.nodes.coverPhoto.assetId,"venue");
   assert.equal(doc.nodes.coverPhoto.height,513);
   assert.equal(maskCss(doc.nodes.coverPhoto),maskCss(snapshot.nodes.coverPhoto));
   assert.equal(doc.nodes.programTimeline.block.layout,"rows");
   assert.equal(doc.nodes.venuePhoto.assetId,"cover");
   assert.equal(doc.nodes.galleryWidget.block.layout,"stackedMosaic");
   assert.deepEqual(doc.nodes.galleryWidget.block.assetIds,assets);
  }
 }
 assert.throws(()=>finalizePersonalization(snapshot,contract,{values:{galleryPhotos:{kind:"gallery",assetIds:["cover-top-pattern"]}}}));
 assert.throws(()=>finalizePersonalization(snapshot,contract,{values:{coverPhoto:{kind:"image",assetId:"rsvp-bottom-pattern"}}}));
});

test("Measured content moves the mask, date, and decorations without shrinking controls",()=>{
 const doc=layoutHeritagePresentation(snapshot,320,{coverNames:210,programTimeline:400,rsvpWidget:530});
 assert.equal(doc.nodes.coverRoot.width,320);
 assert.equal(doc.nodes.coverPhoto.y,427);
 assert.equal(doc.nodes.coverPhoto.height,513);
 assert.equal(doc.nodes.coverDate.y,991);
 assert.equal(doc.nodes.coverFeltGrain.height,1134);
 assert.equal(doc.nodes.inviteBottomPattern.y,957);
 assert.equal(doc.nodes.rsvpBottomPattern.y,972);
 assert.equal(doc.nodes.rsvpPageRoot.height,1148);
});

test("Mask coordinates are portable, bounded, and unavailable to customer edits",()=>{
 assert.match(maskCss(snapshot.nodes.coverPhoto),/^polygon\(0% /);
 assert.deepEqual(snapshot.nodes.coverPhoto.visual.clipPolygon.slice(-2),[[100,100],[0,100]]);
 for(const clipPolygon of [[[0,0],[110,40],[100,100]],[["0%",0],[100,50],[50,100]],[[0,0],[100,100]]]){
  const invalid=structuredClone(pack);
  invalid.document.nodes.coverPhoto.visual.clipPolygon=clipPolygon;
  assert.throws(()=>validatedTemplateVersion(invalid.document,invalid.personalization));
 }
 assert.throws(()=>finalizePersonalization(snapshot,contract,{values:{coverPhoto:{
  kind:"image",assetId:"venue",visual:{clipPolygon:[[0,0],[100,0],[100,100]]},
 }}}));
 for(const node of Object.values(snapshot.nodes)){
  if(node.type==="image"&&snapshot.assets[node.assetId].decorative)assert.equal(node.locked,true,node.id);
 }
});
