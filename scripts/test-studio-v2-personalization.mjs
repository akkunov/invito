import assert from "node:assert/strict";
import {createStudioV2Demo} from "../src/features/studio-v2/demo-project.ts";
import {parseProjectV2} from "../src/features/studio-v2/core/document.schema.ts";
import {applyStudioCommand} from "../src/features/studio-v2/core/command-engine.ts";
import {createWidget,bindDocument} from "../src/features/studio-v2/core/invitation-behavior.ts";
import {personalizationSchema} from "../src/features/studio-v2/core/personalization.schema.ts";
import {editableCandidates,personalizeDocument,finalizePersonalization,personalizationIssues} from "../src/features/studio-v2/core/personalization.ts";
import {createTemplate,savePersonalization,templatePersonalization,appendTemplateVersion,restoreTemplateVersion,duplicateTemplate,templateRecordSchema} from "../src/features/studio-v2/core/template-registry.ts";
const now="2026-11-18T06:30:00.000Z",label={ru:"Имена",ky:"Ысымдар"};
let source=createStudioV2Demo();
source.variables.names={type:"text",label};
source.values={names:{type:"text",value:{ru:"Алина & Тимур",ky:"Алина жана Тимур"}}};
source.nodes["cover-names"].bindingKey="names";
source.nodes["thanks-signature"].bindingKey="names";
source.nodes["cover-photo"].locked=true;
source.themes={warm:{id:"warm",name:"Warm",overrides:{}}};
for(const kind of ["gallery","schedule","music","rsvp"]){
 const node=createWidget(kind,"widget-"+kind,"frame-1",400);
 if(kind==="music")node.block.source="/audio/first.mp3";
 source=applyStudioCommand(source,{kind:"insertNode",parentId:"frame-1",node});
}
source=parseProjectV2(source);
const original=structuredClone(source);
const candidate=editableCandidates(source);
assert.equal(candidate.filter(f=>f.kind==="text").length,1);
const c=(id,kind,opts={})=>({id,kind,label,section:"main",required:false,...opts});
const policy=personalizationSchema.parse({version:1,locales:["ru","ky"],fields:[
 c("names","text",{key:"names",required:true,maxLength:40,multiline:false}),
 c("photo","image",{nodeId:"cover-photo",minWidth:800,minHeight:600}),
 c("gallery","gallery",{nodeId:"widget-gallery",maxPhotos:2}),
 c("schedule","schedule",{nodeId:"widget-schedule",maxItems:2}),
 c("music","music",{nodeId:"widget-music",sources:["/audio/first.mp3","/audio/second.mp3"]}),
 c("rsvp","rsvp",{nodeId:"widget-rsvp",maxGuests:3}),
 c("theme","theme",{themeIds:["warm"],allowBase:true})
]});
const asset={id:"customer-photo",name:"Couple",mimeType:"image/webp",sizeBytes:2000,storageKey:"local:customer-photo",pixelWidth:1200,pixelHeight:900};
const names=value=>({kind:"binding",value:{type:"text",value}});
const patch={locale:"ky",values:{names:names({ru:"Анна & Бек",ky:"Анна жана Бек"}),photo:{kind:"image",assetId:asset.id},gallery:{kind:"gallery",assetIds:[asset.id]},theme:{kind:"theme",themeId:"warm"},music:{kind:"music",source:"/audio/second.mp3"},rsvp:{kind:"rsvp",deadline:null,maxGuests:3}}};
const result=finalizePersonalization(source,policy,patch,[asset]);
assert.equal(result.locale,"ky");
assert.equal(result.activeThemeId,"warm");
assert.equal(result.nodes["cover-photo"].assetId,asset.id);
assert.equal(result.nodes["cover-photo"].locked,true);
assert.deepEqual({...result.nodes["cover-photo"],assetId:source.nodes["cover-photo"].assetId},source.nodes["cover-photo"]);
assert.deepEqual(result.pages,source.pages);
assert.deepEqual(result.nodes["cover-names"],source.nodes["cover-names"]);
const bound=bindDocument(result);
assert.equal(bound.nodes["cover-names"].runs[0].text,"Анна жана Бек");
assert.equal(bound.nodes["thanks-signature"].runs[0].text,"Анна жана Бек");
assert.deepEqual(result.nodes["widget-gallery"].block.assetIds,[asset.id]);
assert.equal(result.nodes["widget-music"].block.source,"/audio/second.mp3");
assert.deepEqual(source,original);
for(const bad of [
 {values:{unknown:names({ru:"a",ky:"b"})}},
 {values:{names:{...names({ru:"a",ky:"b"}),x:100}}},
 {values:{names:names({ru:"a".repeat(41),ky:"b"})}},
 {values:{names:names({ru:"a\nb",ky:"b"})}},
 {values:{photo:{kind:"image",assetId:"missing"}}},
 {values:{photo:{kind:"image",assetId:"asset-couple"}}},
 {values:{gallery:{kind:"gallery",assetIds:["asset-couple","asset-villa","asset-flowers"]}}},
 {values:{music:{kind:"music",source:"https://example.com/unknown.mp3"}}},
 {values:{rsvp:{kind:"rsvp",deadline:null,maxGuests:4}}},
 {values:{theme:{kind:"theme",themeId:"unknown"}}},
 {values:{schedule:{kind:"schedule",items:Array.from({length:3},()=>({time:"17:00",label}))}}},
 {values:{names:{kind:"binding",value:{type:"number",value:1}}}},
 {values:{},nodes:{}}
])assert.throws(()=>personalizeDocument(source,policy,bad));
assert.throws(()=>personalizeDocument(source,{...policy,locales:["ru"]},{locale:"ky",values:{}}));
assert.throws(()=>personalizeDocument(source,policy,patch,[{...asset,pixelWidth:799}]));
assert.throws(()=>personalizeDocument(source,policy,patch,[{...asset,storageKey:"/images/customer.webp"}]));
assert.throws(()=>personalizeDocument(source,policy,{values:{}},[asset]));
assert.throws(()=>personalizeDocument(source,policy,{values:{photo:{kind:"image",assetId:"asset-couple"}}},[{...asset,id:"asset-couple"}]));
assert.throws(()=>personalizationSchema.parse({...policy,fields:[...policy.fields,{...policy.fields[0],id:"duplicate"}]}));
const draft=personalizeDocument(source,policy,{...patch,values:{...patch.values,names:names({ru:"",ky:""})}},[asset]);
assert.ok(personalizationIssues(draft,policy).some(i=>i.fieldId==="names"));
assert.throws(()=>finalizePersonalization(source,policy,{...patch,values:{...patch.values,names:names({ru:"",ky:""})}},[asset]));
const meta={name:"Riviera",category:"wedding",description:"",tags:[],coverPageId:"page-1",status:"draft"};
let record=createTemplate("template-a",meta,source,now);
assert.equal(templatePersonalization(record).fields.length,0);
record=savePersonalization(record,policy,now);
assert.equal(record.versions.length,2);
assert.deepEqual(templatePersonalization(record),policy);
assert.equal(record.versions[0].personalization,undefined);
assert.deepEqual(templatePersonalization(duplicateTemplate(record,"template-b",now)),policy);
assert.deepEqual(templatePersonalization(appendTemplateVersion(record,source,"New design",now)),policy);
assert.equal(templatePersonalization(restoreTemplateVersion(record,1,now)).fields.length,0);
assert.deepEqual(templateRecordSchema.parse(JSON.parse(JSON.stringify(record))),record);
const invalid=structuredClone(source);invalid.nodes["cover-names"].bindingKey=null;invalid.nodes["thanks-signature"].bindingKey=null;
assert.throws(()=>appendTemplateVersion(record,invalid,"Invalid binding",now));
console.log("PASS: customer permissions, immutable design, limits, trusted assets, bindings, draft validation and versioned policy");
