import type {ProjectDocumentV2,ProjectNodeV2} from "./document.schema.ts";
import type {StyleToken,TokenSlot,TokenRefs} from "./style-tokens.schema.ts";
import {compatibleToken,tokenSlots} from "./style-tokens.schema.ts";
import {uniformCorners} from "./appearance.ts";
export function effectiveToken(doc:ProjectDocumentV2,id:string):StyleToken|undefined{
 return (doc.activeThemeId?doc.themes?.[doc.activeThemeId]?.overrides[id]:undefined)??doc.tokens?.[id];
}
export function resolveStyleSlot(node:ProjectNodeV2,slot:TokenSlot,token:StyleToken):ProjectNodeV2{
 if(!compatibleToken(slot,token))throw Error("Incompatible shared style");
 const n=structuredClone(node);
 if(slot==="textColor"&&token.kind==="color"&&n.type==="text"){
  n.runs=n.runs.map(run=>({...run,style:{...run.style,color:token.value}}));
 }else if(slot==="typography"&&token.kind==="typography"&&n.type==="text"){
  const {lineHeight,letterSpacing,...font}=token.value;
  n.runs=n.runs.map(run=>({...run,style:{...run.style,...font}}));n.lineHeight=lineHeight;n.letterSpacing=letterSpacing;
 }else if(slot==="fill"&&(token.kind==="fill"||token.kind==="color")){
  n.visual={...n.visual,fill:token.kind==="color"?{kind:"solid",color:token.value}:structuredClone(token.value)};
 }else if(slot==="stroke"&&token.kind==="stroke"){
  n.visual={...n.visual,stroke:structuredClone(token.value)};
 }else if(slot==="effect"&&token.kind==="effect"){
  n.visual={...n.visual,...structuredClone(token.value)};
 }else if(slot==="corners"&&token.kind==="corners"){
  n.visual={...n.visual,corners:structuredClone(token.value)};
 }else throw Error("Style not supported on this layer");
 return n;
}
export function resolveStyleNode(doc:ProjectDocumentV2,node:ProjectNodeV2):ProjectNodeV2{
 let n=node;for(const slot of tokenSlots){const id=node.tokenRefs?.[slot],token=id?effectiveToken(doc,id):undefined;if(token)n=resolveStyleSlot(n,slot,token);}
 return n;
}
export function resolveStyleDocument(doc:ProjectDocumentV2):ProjectDocumentV2{
 if(!doc.tokens||!Object.keys(doc.tokens).length)return doc;
 return {...doc,nodes:Object.fromEntries(Object.entries(doc.nodes).map(([id,n])=>[id,resolveStyleNode(doc,n)]))};
}
/** Keep the currently displayed value when severing a link. Other slots stay linked. */
export function unlinkStyle(doc:ProjectDocumentV2,node:ProjectNodeV2,slot:TokenSlot):ProjectNodeV2{
 const id=node.tokenRefs?.[slot],token=id?effectiveToken(doc,id):undefined;
 if(!token)return node;
 const n=resolveStyleSlot(node,slot,token),refs:TokenRefs={...n.tokenRefs};delete refs[slot];
 if(Object.keys(refs).length)n.tokenRefs=refs;else delete n.tokenRefs;
 return n;
}
export function defaultToken(id:string,name:string,kind:StyleToken["kind"]):StyleToken{
 switch(kind){
 case "color":return {id,name,kind,value:"#263329"};
 case "fill":return {id,name,kind,value:{kind:"linear",angle:90,stops:[{color:"#FAF7EF",position:0},{color:"#C7AA78",position:100}]}};
 case "typography":return {id,name,kind,value:{fontFamily:"serif",fontSize:48,fontWeight:400,lineHeight:1.14,letterSpacing:0}};
 case "stroke":return {id,name,kind,value:{color:"#263329",width:1,style:"solid"}};
 case "effect":return {id,name,kind,value:{shadow:{color:"#000000",x:0,y:8,blur:20,spread:0,opacity:.25},blur:0}};
 case "corners":return {id,name,kind,value:uniformCorners(16)};
 }
}
export function styleUsage(doc:ProjectDocumentV2,id:string){
 let count=0;
 for(const n of Object.values(doc.nodes))if(Object.values(n.tokenRefs??{}).includes(id))count++;
 for(const c of Object.values(doc.components??{}))for(const v of c.variants)for(const n of Object.values(v.nodes))if(Object.values(n.tokenRefs??{}).includes(id))count++;
 return count;
}
