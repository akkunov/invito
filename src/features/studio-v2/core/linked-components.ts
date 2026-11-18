import type {ProjectDocumentV2,ProjectNodeV2} from "./document.schema.ts";
import type {Component} from "./component-engine.ts";
type Variant=Component["variants"][number];
type Node=ProjectNodeV2;
type Nodes=ProjectDocumentV2["nodes"];
export const OVERRIDE_FIELDS=["x","y","width","height","rotation","opacity","visible","locked","sizing","anchors","layerName","visual","tokenRefs","motion","name","layout","gap","alignment","distribution","padding","background","clip","runs","textAlign","lineHeight","letterSpacing","autoHeight","bindingKey","assetId","fit","focalX","focalY","block","appearance","shape","fill","stroke","strokeWidth"] as const;
export type OverrideField=typeof OVERRIDE_FIELDS[number];
const excluded=(root:boolean,key:string)=>root&&["x","y","rotation"].includes(key);
const record=(n:Node)=>n as unknown as Record<string,unknown>;
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export function linkedRoot(doc:ProjectDocumentV2,id:string):Node|undefined{
 let n=doc.nodes[id];while(n){if(n.componentRef&&n.componentSourceId)return n;if(!n.parentId)return undefined;n=doc.nodes[n.parentId];}return undefined;
}
export function collectTree(nodes:Nodes,id:string):Node[]{
 const out:Node[]=[],seen=new Set<string>(),todo=[id];
 while(todo.length){const key=todo.pop()!,n=nodes[key];if(!n||seen.has(key))throw Error("Invalid component tree");seen.add(key);out.push(n);if(n.type==="frame")todo.push(...[...n.children].reverse());}
 return out;
}
export function stripLink(node:Node){delete node.componentRef;delete node.componentSourceId;delete node.componentOverrides;}
export function noteOverrides(before:ProjectDocumentV2,after:ProjectDocumentV2){
 for(const n of Object.values(after.nodes)){const old=before.nodes[n.id];if(!n.componentSourceId||!old||old.componentSourceId!==n.componentSourceId)continue;
  const fields=new Set(n.componentOverrides??[]),root=!!n.componentRef;
  for(const key of OVERRIDE_FIELDS)if(!excluded(root,key)&&!same(record(old)[key],record(n)[key]))fields.add(key);
  if(fields.size)n.componentOverrides=[...fields].sort();
 }
}
function allocate(doc:ProjectDocumentV2,rootId:string,sourceId:string,reserved:Set<string>){
 let hash=2166136261;for(const c of rootId+"|"+sourceId)hash=Math.imul(hash^c.charCodeAt(0),16777619);
 const prefix="linked-"+(hash>>>0).toString(36);let id=prefix,i=0;
 while(doc.nodes[id]||reserved.has(id))id=prefix+"-"+(++i);
 reserved.add(id);return id;
}
/** Existing node IDs survive reconciliation when master keys and types match. */
export function reconcileInstance(doc:ProjectDocumentV2,rootId:string,variant:Variant,componentId:string,reset=false){
 const root=doc.nodes[rootId];if(!root?.componentRef||!root.componentSourceId)throw Error("Select a linked instance");
 const old=collectTree(doc.nodes,rootId),previous=new Map(old.map(n=>[n.componentSourceId,n]));
 const source=collectTree(variant.nodes,variant.rootId);
 const sourceRoot=variant.nodes[variant.rootId];
 if(root.type!==sourceRoot.type)throw Error("Variant root type must match the instance");
 const ids=new Map<string,string>(),reserved=new Set<string>([rootId]);
 for(const n of source){const prior=previous.get(n.id);ids.set(n.id,n.id===variant.rootId?rootId:prior&&prior.type===n.type&&prior.id!==rootId?prior.id:allocate(doc,rootId,n.id,reserved));}
 const next:Nodes={};const kept=new Set(ids.values());
 for(const n of source){
  const isRoot=n.id===variant.rootId,prior=isRoot?root:previous.get(n.id),id=ids.get(n.id)!;
  const copy=structuredClone(n);stripLink(copy);copy.id=id;copy.parentId=isRoot?root.parentId:ids.get(n.parentId!)!;
  if(copy.type==="frame")copy.children=copy.children.map(key=>ids.get(key)!);
  copy.componentSourceId=n.id;
  if(isRoot){copy.x=root.x;copy.y=root.y;copy.rotation=root.rotation;copy.componentRef={componentId,variantId:variant.id};}
  if(!reset&&prior?.type===n.type){
   const fields=(prior.componentOverrides??[]).filter(k=>!excluded(isRoot,k));
   for(const key of fields){if(Object.hasOwn(prior,key))record(copy)[key]=structuredClone(record(prior)[key]);else delete record(copy)[key];}
   if(fields.length)copy.componentOverrides=fields;
  }
  next[id]=copy;
 }
 for(const n of old){delete doc.nodes[n.id];if(!kept.has(n.id))for(const map of Object.values(doc.responsiveOverrides??{}))if(map)delete map[n.id];}
 Object.assign(doc.nodes,next);
}
export function updateComponentDefinition(doc:ProjectDocumentV2,component:Component){
 const old=doc.components?.[component.id];doc.components??={};doc.components[component.id]=structuredClone(component);
 if(!old)return;
 for(const root of Object.values(doc.nodes).filter(n=>n.componentSourceId&&n.componentRef?.componentId===component.id)){
  const variant=component.variants.find(v=>v.id===root.componentRef!.variantId);
  if(!variant)throw Error("Cannot remove a variant with linked instances");
  const before=old.variants.find(v=>v.id===variant.id);
  if(!same(before,variant))reconcileInstance(doc,root.id,variant,component.id);
 }
}
export function resetNodeOverrides(doc:ProjectDocumentV2,id:string){
 const n=doc.nodes[id],root=linkedRoot(doc,id);if(!root?.componentRef||!n?.componentSourceId)throw Error("Select a linked layer");
 const master=doc.components?.[root.componentRef.componentId]?.variants.find(v=>v.id===root.componentRef!.variantId)?.nodes[n.componentSourceId];
 if(!master||master.type!==n.type)throw Error("Missing master layer");
 for(const key of n.componentOverrides??[]){if(Object.hasOwn(master,key))record(n)[key]=structuredClone(record(master)[key]);else delete record(n)[key];}
 delete n.componentOverrides;
}
export function detachInstance(doc:ProjectDocumentV2,id:string){
 const root=linkedRoot(doc,id)??doc.nodes[id];if(!root?.componentRef)throw Error("Not a component");
 if(root.componentSourceId){for(const n of collectTree(doc.nodes,root.id))stripLink(n);}else delete root.componentRef;
}
/** Preserve existing master keys when editing its original source or linked instance.
 * New variants use corresponding tree paths of the base variant for compatible layers. */
export function alignedSnapshot(snapshot:Variant,base:Variant,sourceDoc:ProjectDocumentV2,sourceRootId:string,matchPaths:boolean):Variant{
 const ids=new Map<string,string>(),used=new Set<string>();
 function visit(id:string,baseId?:string){
  const n=snapshot.nodes[id],original=sourceDoc.nodes[id],b=baseId?base.nodes[baseId]:undefined;
  const stable=original?.componentSourceId??id;
  const candidate=id===sourceRootId?base.rootId:base.nodes[stable]?.type===n.type?stable:matchPaths&&b?.type===n.type?b.id:undefined;
  let key=candidate&&!used.has(candidate)?candidate:id;
  if(used.has(key)||(base.nodes[key]&&base.nodes[key].type!==n.type)){let i=0;do{key="master-"+used.size+"-"+(++i);}while(used.has(key)||base.nodes[key]||snapshot.nodes[key]);}
  used.add(key);ids.set(id,key);
  if(n.type==="frame")n.children.forEach((child,index)=>visit(child,b?.type==="frame"?b.children[index]:undefined));
 }
 visit(snapshot.rootId,base.rootId);
 const nodes:Nodes={};for(const n of Object.values(snapshot.nodes)){const copy=structuredClone(n);stripLink(copy);copy.id=ids.get(n.id)!;copy.parentId=n.parentId?ids.get(n.parentId)!:null;if(copy.type==="frame")copy.children=copy.children.map(id=>ids.get(id)!);nodes[copy.id]=copy;}
 return {...snapshot,rootId:ids.get(snapshot.rootId)!,nodes};
}
