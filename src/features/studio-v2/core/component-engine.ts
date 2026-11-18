import type {ProjectDocumentV2,ProjectNodeV2} from "./document.schema.ts";
import type {StudioCommand} from "./command-engine.ts";
export type Component = NonNullable<ProjectDocumentV2["components"]>[string];
export type Asset = ProjectDocumentV2["assets"][string];
export function snapshotVariant(doc:ProjectDocumentV2,rootId:string,id:string,name:string):Component["variants"][number]{
 const nodes:Record<string,ProjectNodeV2>={};
 function visit(key:string){const n=doc.nodes[key];if(!n||nodes[key])throw Error("Invalid source tree");nodes[key]=structuredClone(n);delete nodes[key].componentRef;if(n.type==="frame")n.children.forEach(visit);}
 visit(rootId);nodes[rootId].parentId=null;
 return {id,name,rootId,nodes};
}
export function instantiateComponent(component:Component,variantId:string,parentId:string,makeId:()=>string,position={x:24,y:24}):StudioCommand[]{
 const variant=component.variants.find(v=>v.id===variantId);if(!variant)throw Error("Unknown variant");
 const ids=new Map(Object.keys(variant.nodes).map(id=>[id,makeId()]));
 const commands:StudioCommand[]=[];
 function walk(id:string,parent:string){
  const source=variant!.nodes[id],node={...structuredClone(source),id:ids.get(id)!,parentId:parent};
  if(id===variant!.rootId){node.x=position.x;node.y=position.y;node.componentRef={componentId:component.id,variantId};}
  if(node.type==="frame")node.children=[];
  commands.push({kind:"insertNode",parentId:parent,node});
  if(source.type==="frame")source.children.forEach(c=>walk(c,node.id));
 }
 walk(variant.rootId,parentId);return commands;
}
export function imageNode(asset:Asset,parentId:string,id:string,width=400):ProjectNodeV2{
 const ratio=asset.pixelWidth&&asset.pixelHeight?asset.pixelHeight/asset.pixelWidth:0.75;
 return {id,parentId,type:"image",x:24,y:24,width,height:Math.max(1,Math.min(20000,width*ratio)),rotation:0,opacity:1,visible:true,locked:false,assetId:asset.id,fit:"cover",focalX:.5,focalY:.5};
}
