import type {ProjectDocumentV2,ProjectNodeV2} from "./document.schema.ts";
import {stripLink} from "./linked-components.ts";
import type {StudioCommand} from "./command-engine.ts";
export type Component = NonNullable<ProjectDocumentV2["components"]>[string];
export type Asset = ProjectDocumentV2["assets"][string];
export function snapshotVariant(doc:ProjectDocumentV2,rootId:string,id:string,name:string):Component["variants"][number]{
 const nodes:Record<string,ProjectNodeV2>={};
 function visit(key:string){const n=doc.nodes[key];if(!n||nodes[key])throw Error("Invalid source tree");nodes[key]=structuredClone(n);stripLink(nodes[key]);if(n.type==="frame")n.children.forEach(visit);}
 visit(rootId);nodes[rootId].parentId=null;
 return {id,name,rootId,nodes};
}
export function instantiateComponent(component:Component,variantId:string,parentId:string,makeId:()=>string,position={x:24,y:24}):StudioCommand[]{
 const variant=component.variants.find(v=>v.id===variantId);if(!variant)throw Error("Unknown variant");
 const ids=new Map(Object.keys(variant.nodes).map(id=>[id,makeId()]));
 if(new Set(ids.values()).size!==ids.size)throw Error("Duplicate instance IDs");
 const nodes:ProjectDocumentV2["nodes"]={};
 for(const [id,source] of Object.entries(variant.nodes)){
  const node=structuredClone(source);stripLink(node);node.id=ids.get(id)!;node.parentId=id===variant.rootId?parentId:ids.get(source.parentId!)!;node.componentSourceId=id;
  if(id===variant.rootId){node.x=position.x;node.y=position.y;node.componentRef={componentId:component.id,variantId};}
  if(node.type==="frame")node.children=node.children.map(child=>ids.get(child)!);
  nodes[node.id]=node;
 }
 return [{kind:"pasteNodes",parentId,nodes,roots:[ids.get(variant.rootId)!],overrides:{}}];
}
export function imageNode(asset:Asset,parentId:string,id:string,width=400):ProjectNodeV2{
 const ratio=asset.pixelWidth&&asset.pixelHeight?asset.pixelHeight/asset.pixelWidth:0.75;
 return {id,parentId,type:"image",x:24,y:24,width,height:Math.max(1,Math.min(20000,width*ratio)),rotation:0,opacity:1,visible:true,locked:false,assetId:asset.id,fit:"cover",focalX:.5,focalY:.5};
}
