import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {musicCatalogSchema} from "../src/features/invitations/music-catalog.schema.ts";
import {personalizeDocument} from "../src/features/studio-v2/core/personalization.ts";
const pack=JSON.parse(readFileSync(new URL("../templates/packages/editorial-ivory.v4.json",import.meta.url),"utf8"));
const track={id:"example",title:"Example",artist:"Example",source:"https://cdn.example.com/audio/example.mp3",license:"Test only"};
test("catalog accepts stable HTTPS audio and rejects temporary or duplicate sources",()=>{
 assert.deepEqual(musicCatalogSchema.parse([track]),[track]);
 for(const source of ["http://cdn.example.com/a.mp3","https://cdn.example.com/a.mp3?token=temporary","https://cdn.example.com/page"]){
  assert.equal(musicCatalogSchema.safeParse([{...track,source}]).success,false);
 }
 assert.equal(musicCatalogSchema.safeParse([track,track]).success,false);
});
test("v4 music selection cannot bypass immutable template permissions",()=>{
 const contract=structuredClone(pack.personalization);
 const music=contract.fields.find(field=>field.kind==="music");
 assert.ok(music);
 assert.throws(()=>personalizeDocument(pack.document,contract,{values:{musicTrack:{kind:"music",source:track.source}}}));
 music.sources=[track.source];
 const doc=personalizeDocument(pack.document,contract,{values:{musicTrack:{kind:"music",source:track.source}}});
 assert.equal(doc.nodes.musicPlayer.block.source,track.source);
});
test("section navigation names and typography extensions are opt-in",()=>{
 const sections={order:pack.document.pages.map(page=>page.id),hidden:[],names:{cover:"Новая обложка"}};
 const style={kind:"textStyle",fontFamily:"sans",fontSize:51,fontWeight:700,color:"#262720",textAlign:"center",italic:true,underline:true,lineHeight:1.15,letterSpacing:.5};
 const doc=personalizeDocument(pack.document,pack.personalization,{values:{coverTypography:style},sections});
 assert.equal(doc.pages[0].name,"Новая обложка");
 assert.equal(doc.nodes.coverNames.runs[0].style.italic,true);
 assert.equal(doc.nodes.coverNames.runs[0].style.underline,true);
 assert.equal(doc.nodes.coverNames.lineHeight,1.15);
 assert.throws(()=>personalizeDocument(pack.document,pack.personalization,{values:{coverTypography:{...style,letterSpacing:40}}}));
 const locked=structuredClone(pack.personalization);
 delete locked.sectionEditing.renameablePageIds;
 assert.throws(()=>personalizeDocument(pack.document,locked,{values:{},sections}));
});
