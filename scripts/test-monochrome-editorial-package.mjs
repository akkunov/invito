import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
import {test} from "node:test";
import {validatedTemplateVersion,assertReadyAssets} from "../server/domain/persistence-contract.ts";
import {finalizePersonalization,personalizationIssues,personalizeDocument} from "../src/features/studio-v2/core/personalization.ts";
import {responsiveDocument,presentationSize} from "../src/features/studio-v2/core/responsive-engine.ts";
import {bindDocument} from "../src/features/studio-v2/core/invitation-behavior.ts";
const pack=JSON.parse(readFileSync(new URL("../templates/packages/monochrome-editorial.v1.json",import.meta.url),"utf8"));
const allowed=new Set(["cover","landscape","bouquet","rings","shadows","venue"].map(id=>"/images/monochrome-editorial/"+id+".webp"));
test("Monochrome Editorial imports with a complete RU/KY personalization contract",()=>{
 const {snapshot,contract}=validatedTemplateVersion(pack.document,pack.personalization);
 assert.ok(contract);
 assert.equal(pack.manifest.slug,"monochrome-editorial");
 assert.equal(snapshot.pages.length,6);
 assert.deepEqual(personalizationIssues(snapshot,contract),[]);
 assertReadyAssets(snapshot,"00000000-0000-4000-8000-000000000001",[],allowed);
 const ru=finalizePersonalization(snapshot,contract,{values:{}});
 const ky=bindDocument(finalizePersonalization(snapshot,contract,{locale:"ky",values:{}}));
 assert.equal(ru.locale,"ru");
 assert.equal(ky.nodes.coverNames.runs[0].text,"АЛИБЕК\nЖАНА АЛИНА");
});
test("Monochrome demo media files are installed and match package metadata",()=>{
 for(const asset of Object.values(pack.document.assets)){
  const path=new URL("../public"+asset.storageKey,import.meta.url);
  assert.equal(statSync(path).size,asset.sizeBytes,"Check "+asset.storageKey);
 }
});
test("Desktop and mobile layouts have distinct proportions and valid bounds",()=>{
 const doc=bindDocument(pack.document);
 for(const device of ["mobile","desktop"]){
  const resolved=responsiveDocument(doc,device);
  for(const page of doc.pages){
   const root=resolved.nodes[page.rootNodeId];
   const size=presentationSize(doc,resolved,page,device);
   assert.equal(size.width,device==="mobile"?390:1200);
   for(const id of root.children){
    const node=resolved.nodes[id];
    assert.ok(node.x>=0&&node.y>=0&&node.x+node.width<=root.width+.01&&node.y+node.height<=root.height+.01,device+" overflow: "+id);
   }
  }
 }
});
test("Four-photo mosaic remains editable without allowing arbitrary layout changes",()=>{
 const {document,personalization}=pack;
 assert.equal(document.nodes.galleryWidget.block.layout,"mosaic");
 assert.equal(document.nodes.galleryWidget.block.assetIds.length,4);
 const customized=personalizeDocument(document,personalization,{
   values:{galleryPhotos:{kind:"gallery",assetIds:["rings","bouquet"]}},
 });
 assert.equal(customized.nodes.galleryWidget.block.layout,"mosaic");
 assert.deepEqual(customized.nodes.galleryWidget.block.assetIds,["rings","bouquet"]);
 assert.throws(()=>personalizeDocument(document,personalization,{values:{galleryPhotos:{kind:"gallery",assetIds:["unknown"]}}}));
 assert.throws(()=>personalizeDocument(document,personalization,{values:{galleryPhotos:{kind:"gallery",assetIds:["cover","landscape","bouquet","rings","venue"]}}}));
});
