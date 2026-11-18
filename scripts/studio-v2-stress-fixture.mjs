import {createEmptyProjectV2,parseProjectV2} from "../src/features/studio-v2/core/document.schema.ts";

export const STRESS_LIMITS=Object.freeze({pages:30,nodes:500,assets:200});
/** Deterministic upper-limit document. No generated content is saved to a user's browser. */
export function createStudioStressProject(){
 const start=createEmptyProjectV2("studio-v2-stress");
 const frame=start.nodes["frame-1"];
 const nodes={},pages=[],assets={};
 for(let i=0;i<STRESS_LIMITS.assets;i++){
  const id="stress-asset-"+i;
  assets[id]={id,mimeType:"image/png",name:"Stress image "+i,sizeBytes:256,storageKey:"local:stress-asset-"+i,pixelWidth:16,pixelHeight:16,folder:"Stress"};
 }
 for(let i=0;i<STRESS_LIMITS.pages;i++){
  const id="stress-frame-"+i;
  const name="Stress "+String(i+1).padStart(2,"0");
  nodes[id]={...frame,id,name,children:[],parentId:null};
  pages.push({id:"stress-page-"+i,name,rootNodeId:id,placement:{x:i*1280,y:0}});
 }
 const common=(id,parentId,slot)=>({
  id,parentId,layerName:"Stress node "+id.slice("stress-node-".length),x:30+(slot%4)*255,y:130+Math.floor(slot/4)*375,
  width:220,height:140,rotation:0,opacity:1,visible:true,locked:false
 });
 for(let i=0;i<STRESS_LIMITS.nodes-STRESS_LIMITS.pages;i++){
  const page=i%STRESS_LIMITS.pages,slot=Math.floor(i/STRESS_LIMITS.pages);
  const id="stress-node-"+i,parentId="stress-frame-"+page;
  const commonNode=common(id,parentId,slot);
  const node=i%5===0?
   {...commonNode,type:"image",assetId:"stress-asset-"+(i%STRESS_LIMITS.assets),fit:"cover",focalX:.5,focalY:.5,width:210,height:300}:
   i%5===1?
   {...commonNode,type:"text",runs:[{text:"Текст приглашения "+i,style:{fontFamily:"sans",fontSize:28,fontWeight:400,italic:false,underline:false,strike:false,color:"#263329"}}],textAlign:"left",bindingKey:null}:
   {...commonNode,type:"shape",shape:"rectangle",fill:"#707A5C",stroke:null,strokeWidth:0};
  nodes[id]=node;
  nodes[parentId].children.push(id);
 }
 return parseProjectV2({...start,pages,nodes,assets,revision:0});
}
