import type {ProjectDocumentV2,ProjectNodeV2,StudioPageV2} from "./document.schema.ts";
import {layoutDocument,type TextMeasurements} from "./layout-engine.ts";
export type Device="desktop"|"tablet"|"mobile";
export type PageProfile=NonNullable<NonNullable<StudioPageV2["responsive"]>[Device]>;
export type NodeOverride=NonNullable<NonNullable<ProjectDocumentV2["responsiveOverrides"]>[Device]>[string];
export const DEVICE_WIDTH:Record<Device,number>={desktop:1440,tablet:768,mobile:390};
export function deviceForWidth(width:number):Device{return width>=1024?"desktop":width>=600?"tablet":"mobile";}
export function pageProfile(doc:ProjectDocumentV2,page:StudioPageV2,device:Device):PageProfile{
 const root=doc.nodes[page.rootNodeId],width=DEVICE_WIDTH[device];
 return page.responsive?.[device]??{width,height:Math.min(20000,Math.max(1,Math.round(root.height*width/root.width))),mode:"scale"};
}
export function responsiveSource(doc:ProjectDocumentV2,device:Device):ProjectDocumentV2{
 const nodes={...doc.nodes};
 for(const [id,patch] of Object.entries(doc.responsiveOverrides?.[device]??{})){
  const n=nodes[id];if(!n)continue;
  const {textStyle,frameLayout,...geometry}=patch;
  let next={...n,...Object.fromEntries(Object.entries(geometry).filter(([,v])=>v!==undefined))} as ProjectNodeV2;
  if(next.type==="text"&&textStyle){const {fontSize,...paragraph}=textStyle;next={...next,...Object.fromEntries(Object.entries(paragraph).filter(([,v])=>v!==undefined)),runs:fontSize===undefined?next.runs:next.runs.map(r=>({...r,style:{...r.style,fontSize}}))};}
  if(next.type==="frame"&&frameLayout){next={...next,...Object.fromEntries(Object.entries(frameLayout).filter(([,v])=>v!==undefined))};if(next.layout==="free"&&next.sizing)next.sizing={...next.sizing,width:next.sizing.width==="hug"?"fixed":next.sizing.width,height:next.sizing.height==="hug"?"fixed":next.sizing.height};}
  nodes[id]=next;
 }
 return {...doc,nodes};
}
/** Canonical design coordinates stay intact in scale mode. Reflow uses target root size
 * while retaining source parent dimensions for anchor calculations. */
export function responsiveDocument(doc:ProjectDocumentV2,device:Device,measurements:TextMeasurements={}):ProjectDocumentV2{
 const source=responsiveSource(doc,device);
 const sizes:Record<string,{width:number;height:number}>={};
 for(const page of doc.pages){const p=pageProfile(doc,page,device);if(p.mode==="reflow")sizes[page.rootNodeId]={width:p.width,height:p.height};}
 return layoutDocument(source,measurements,sizes);
}
export function presentationSize(doc:ProjectDocumentV2,resolved:ProjectDocumentV2,page:StudioPageV2,device:Device){
 const profile=pageProfile(doc,page,device),root=resolved.nodes[page.rootNodeId];
 const scale=profile.mode==="scale"?profile.width/root.width:1;
 return {width:root.width*scale,height:root.height*scale,scale};
}
