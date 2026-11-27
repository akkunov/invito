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

test("Love Story preserves its six photo slots, decorative layers and one event date",()=>{
 const pack=JSON.parse(readFileSync(new URL("../templates/packages/love-story.v1.json",import.meta.url),"utf8"));
 const {snapshot,contract}=validatedTemplateVersion(pack.document,pack.personalization);
 const photos=contract.fields.filter(field=>field.kind==="image");
 assert.deepEqual(photos.map(field=>field.nodeId),[
  "cover_coverPhoto","story_meetingPhoto","story_tripPhoto","story_proposalPhoto","details_venuePhoto","rsvpPage_closingPhoto",
 ]);
 const replacementIds=photos.map(field=>snapshot.nodes[field.nodeId].assetId);
 const values=Object.fromEntries(photos.map((field,index)=>[field.id,{kind:"image",assetId:replacementIds[(index+1)%photos.length]}]));
 const date="2027-06-12T18:00:00+06:00";
 values.ceremonyDate={kind:"binding",value:{type:"date",value:date}};
 const patched=bindDocument(finalizePersonalization(snapshot,contract,{locale:"ky",values}));
 for (const [index,field] of photos.entries()) {
  assert.deepEqual(patched.nodes[field.nodeId],{
   ...snapshot.nodes[field.nodeId],assetId:replacementIds[(index+1)%photos.length],
  });
 }
 for (const node of Object.values(snapshot.nodes)) {
  if (node.type==="image"&&snapshot.assets[node.assetId].decorative) {
   assert.equal(node.locked,true);
   assert.deepEqual(patched.nodes[node.id],node);
  }
 }
 assert.match(patched.nodes.cover_date.runs[0].text,/12-ИЮНЬ 2027/);
 assert.equal(patched.nodes.details_ticketTime.runs[0].text,"18:00");
 assert.equal(countdownTarget(patched,patched.nodes.details_calendarAction.block),date);
 assert.equal(snapshot.nodes.rsvpPage_rsvpWidget.appearance.preset,"stationery");
});

test("Love Story opts into verified music references while legacy tracks remain allowlisted",()=>{
 const pack=JSON.parse(readFileSync(new URL("../templates/packages/love-story.v1.json",import.meta.url),"utf8"));
 const {snapshot,contract}=validatedTemplateVersion(pack.document,pack.personalization);
 const id="rsvpPage_music";
 const source="asset:36F3B7FE-B28A-4185-B0E3-989EB71BAFC0";
 const patch={values:{[id]:{kind:"music",source}}};
 assert.equal(finalizePersonalization(snapshot,contract,patch).nodes[id].block.source,source.toLowerCase());
 const legacy={...contract,fields:contract.fields.map(field=>{
  if(field.id!==id)return field;
  const {allowUpload,...unchanged}=field;
  assert.equal(allowUpload,true);
  return unchanged;
 })};
 assert.throws(()=>finalizePersonalization(snapshot,legacy,patch));
 assert.throws(()=>finalizePersonalization(snapshot,contract,{values:{[id]:{kind:"music",source:"https://example.test/unlisted.mp3"}}}));
 assert.equal(finalizePersonalization(snapshot,contract,{values:{[id]:{kind:"music",source:""}}}).nodes[id].block.source,"");
});

test("Vogue Wedding keeps its monochrome treatment and decorative layers when replacing all six photos",()=>{
 const pack=JSON.parse(readFileSync(new URL("../templates/packages/vogue-wedding.v1.json",import.meta.url),"utf8"));
 const {snapshot,contract}=validatedTemplateVersion(pack.document,pack.personalization);
 const {cover_coverPhoto:cover,gallery_venuePhoto:venue,gallery_galleryWidget:gallery}=snapshot.nodes;
 assert.equal(cover.visual.imageTreatment,"monochrome");
 assert.equal(venue.visual.imageTreatment,"monochrome");
 assert.equal(gallery.block.layout,"stackedMosaic");
 assert.equal(gallery.appearance.preset,"contact-sheet");
 assert.equal(gallery.block.assetIds.length,4);
 const photoFields=contract.fields.filter(field=>field.kind==="image"||field.kind==="gallery");
 assert.deepEqual(photoFields.map(field=>field.nodeId),[cover.id,gallery.id,venue.id]);
 const replacedGallery=[...gallery.block.assetIds].reverse();
 const next=finalizePersonalization(snapshot,contract,{locale:"ky",values:{
  [cover.id]:{kind:"image",assetId:venue.assetId},
  [venue.id]:{kind:"image",assetId:cover.assetId},
  [gallery.id]:{kind:"gallery",assetIds:replacedGallery},
 }});
 assert.deepEqual(next.nodes[cover.id],{...cover,assetId:venue.assetId});
 assert.deepEqual(next.nodes[venue.id],{...venue,assetId:cover.assetId});
 assert.deepEqual(next.nodes[gallery.id].block.assetIds,replacedGallery);
 for(const id of ["cover_coverFabric","gallery_venuePin","invitation_mountainsFooter","rsvpPage_mountainsFooterDark"]){
  const node=snapshot.nodes[id];
  assert.ok(node.locked&&snapshot.assets[node.assetId].decorative,id);
  assert.deepEqual(next.nodes[id],node);
 }
});

test("Italian Romance connects one date and one place to the existing widgets and keeps six replaceable photos",()=>{
 const pack=JSON.parse(readFileSync(new URL("../templates/packages/italian-romance.v1.json",import.meta.url),"utf8"));
 const {snapshot,contract}=validatedTemplateVersion(pack.document,pack.personalization);
 const {invitation_calendar:calendar,gallery_polaroidGallery:gallery,gallery_venueCard:location}=snapshot.nodes;
 const imageFields=contract.fields.filter(field=>field.kind==="image");
 assert.deepEqual(imageFields.map(field=>field.nodeId),["cover_coverScene","gallery_venueStoryPreview","gallery_venuePhoto"]);
 assert.equal(gallery.block.layout,"polaroids");
 assert.equal(gallery.block.assetIds.length,3);
 assert.equal(contract.fields.find(field=>field.nodeId===gallery.id).maxPhotos,4);
 assert.equal(location.block.nameKey,"venueName");
 assert.equal(location.block.addressKey,"venueAddress");
 assert.deepEqual(snapshot.nodes.cover_coverNames.accentLine,{text:"&",color:"#A43E23"});
 assert.equal(snapshot.nodes.rsvpPage_rsvpWidget.block.wish,true);
 assert.equal(snapshot.nodes.rsvpPage_rsvpWidget.block.guestControl,"stepper");
 assert.equal(snapshot.nodes.rsvpPage_musicCard.block.source,"");
 assert.throws(()=>validatedTemplateVersion({...snapshot,nodes:{
  ...snapshot.nodes,[location.id]:{...location,block:{...location.block,nameKey:"ceremonyDate"}},
 }},contract));

 const date="2028-02-29T17:00:00+06:00";
 const reversedGallery=[...gallery.block.assetIds].reverse();
 const values=Object.fromEntries(imageFields.map((field,i)=>[field.id,{kind:"image",assetId:gallery.block.assetIds[i]}]));
 const personalized=bindDocument(finalizePersonalization(snapshot,contract,{values:{
  ...values,
  ceremonyDate:{kind:"binding",value:{type:"date",value:date}},
  [gallery.id]:{kind:"gallery",assetIds:reversedGallery},
 }}));
 assert.equal(calendar.block.layout,"month");
 assert.equal(countdownTarget(personalized,personalized.nodes[calendar.id].block),date);
 assert.match(personalized.nodes.cover_coverDate.runs[0].text,/29 ФЕВРАЛЯ 2028/);
 assert.deepEqual(personalized.nodes[gallery.id].block.assetIds,reversedGallery);
 for (const field of imageFields) {
  assert.equal(personalized.nodes[field.nodeId].assetId,values[field.id].assetId);
 }
 for (const node of Object.values(snapshot.nodes)) {
  if (node.type==="image"&&snapshot.assets[node.assetId].decorative) {
   assert.equal(node.locked,true);
   assert.deepEqual(personalized.nodes[node.id],node);
  }
 }
});

test("Cinema Wedding keeps seven photo slots, live chapter text and one wedding date",()=>{
 const pack=JSON.parse(readFileSync(new URL("../templates/packages/cinema-wedding.v1.json",import.meta.url),"utf8"));
 const {snapshot,contract}=validatedTemplateVersion(pack.document,pack.personalization);
 const photos=contract.fields.filter(field=>field.kind==="image");
 assert.deepEqual(photos.map(field=>field.nodeId),[
  "cover_heroPoster","story_storyVideo","story_episode1","story_episode2","story_episode3","event_venueHero","event_venuePhoto",
 ]);
 assert.ok(Object.values(snapshot.assets).every(asset=>asset.mimeType==="image/webp"));
 assert.equal(snapshot.nodes.rsvp_music.block.source,"");
 assert.equal(snapshot.nodes.rsvp_response.appearance.preset,"film");
 const values=Object.fromEntries(photos.map((field,i)=>[
  field.id,{kind:"image",assetId:snapshot.nodes[photos[(i+1)%photos.length].nodeId].assetId},
 ]));
 const event="2028-02-29T00:25:00+06:00";
 const chapter={ru:"01.01.2023\nНОВАЯ ГЛАВА\nКак всё начиналось",ky:"01.01.2023\nЖАҢЫ БАЯН\nКантип башталды"};
 const next=bindDocument(finalizePersonalization(snapshot,contract,{locale:"ky",values:{
  ...values,ceremonyDate:{kind:"binding",value:{type:"date",value:event}},
  episode1Copy:{kind:"binding",value:{type:"text",value:chapter}},
 }}));
 for(const field of photos) assert.deepEqual(next.nodes[field.nodeId],{
  ...snapshot.nodes[field.nodeId],assetId:values[field.id].assetId,
 });
 assert.deepEqual(next.nodes.story_episode1Copy.runs.map(run=>run.text.trim()),chapter.ky.split("\n"));
 assert.equal(next.nodes.story_episode1Copy.runs[0].style.color,"#8B2926");
 for(const [id,text] of [["event_date","29"],["event_month","02"],["event_year","2028"]]){
  assert.equal(next.nodes[id].runs[0].text,text);
 }
 assert.equal(countdownTarget(next,next.nodes.event_calendar.block),event);
 for(const id of ["story_episode1Frame","story_episode2Frame","story_episode3Frame"]){
  assert.equal(snapshot.nodes[id].locked,true);
  assert.ok(snapshot.assets[snapshot.nodes[id].assetId].decorative);
  assert.deepEqual(next.nodes[id],snapshot.nodes[id]);
 }
});
