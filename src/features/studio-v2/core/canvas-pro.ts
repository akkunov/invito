import {stripLink} from "./linked-components.ts";
import type {ProjectDocumentV2,ProjectNodeV2} from "./document.schema.ts";
import type {StudioCommand} from "./command-engine.ts";
import {canSelect,normalizeSelection,nodeBounds,selectionBounds,worldMatrix,mapPoint,moveSelection,type Handle} from "./selection-transform.ts";
import type {Point,Rect} from "./viewport.ts";
export type Alignment="left"|"center"|"right"|"top"|"middle"|"bottom";
export type Axis="x"|"y";
type Nodes=ProjectDocumentV2["nodes"];
type Overrides=NonNullable<ProjectDocumentV2["responsiveOverrides"]>;
export type CanvasClipboard={projectId:string;roots:string[];nodes:Nodes;overrides:Overrides;centers:Record<string,Point>;angles:Record<string,number>;pageOrigins:Record<string,Point>};
const angle=(m:ReturnType<typeof worldMatrix>)=>Math.atan2(m[1],m[0])*180/Math.PI;
const normalizeAngle=(v:number)=>((v%360)+540)%360-180;
const clampCoord=(v:number)=>Math.max(-1e6,Math.min(1e6,v));
function localPoint(doc:ProjectDocumentV2,parent:string,p:Point):Point{
 const m=worldMatrix(doc,parent),x=p.x-m[4],y=p.y-m[5];return {x:m[0]*x+m[1]*y,y:m[2]*x+m[3]*y};
}
export function freeSelection(doc:ProjectDocumentV2,ids:readonly string[]){
 const selected=normalizeSelection(doc,ids);return selected.length>0&&selected.every(id=>{const p=doc.nodes[doc.nodes[id].parentId!];return p?.type==="frame"&&p.layout==="free";});
}
export function canResizeSelection(doc:ProjectDocumentV2,ids:readonly string[]){
 return freeSelection(doc,ids)&&normalizeSelection(doc,ids).every(id=>{const n=doc.nodes[id];return (!n.sizing||n.sizing.width==="fixed"&&n.sizing.height==="fixed")&&!(n.type==="text"&&n.autoHeight);});
}
function position(doc:ProjectDocumentV2,id:string,center:Point,width:number,height:number):Point{
 const local=localPoint(doc,doc.nodes[id].parentId!,center);return {x:clampCoord(local.x-width/2),y:clampCoord(local.y-height/2)};
}
function centerOf(doc:ProjectDocumentV2,id:string){const n=doc.nodes[id];return mapPoint(worldMatrix(doc,id),{x:n.width/2,y:n.height/2});}
export function alignSelection(doc:ProjectDocumentV2,ids:readonly string[],alignment:Alignment):StudioCommand{
 const chosen=normalizeSelection(doc,ids);if(chosen.length<2||!freeSelection(doc,chosen))throw Error("Alignment requires free-positioned layers");
 const all=selectionBounds(doc,chosen),positions:Record<string,Point>={};
 const value=(r:Rect)=>alignment==="left"?r.x:alignment==="center"?r.x+r.width/2:alignment==="right"?r.x+r.width:alignment==="top"?r.y:alignment==="middle"?r.y+r.height/2:r.y+r.height;
 for(const id of chosen){const d=value(all)-value(nodeBounds(doc,id));const move=moveSelection(doc,[id],["left","center","right"].includes(alignment)?{x:d,y:0}:{x:0,y:d});if(move.kind==="moveNodes")Object.assign(positions,move.positions);}
 return {kind:"moveNodes",positions};
}
export function distributeSelection(doc:ProjectDocumentV2,ids:readonly string[],axis:Axis):StudioCommand{
 const chosen=normalizeSelection(doc,ids);if(chosen.length<3||!freeSelection(doc,chosen))throw Error("Distribution requires three free-positioned layers");
 const size=axis==="x"?"width":"height";
 const entries=chosen.map(id=>({id,b:nodeBounds(doc,id)})).sort((a,b)=>a.b[axis]-b.b[axis]||a.id.localeCompare(b.id));
 const first=entries[0].b,last=entries[entries.length-1].b;
 const gap=(last[axis]+last[size]-first[axis]-entries.reduce((sum,e)=>sum+e.b[size],0))/(entries.length-1);
 let cursor=first[axis];const positions:Record<string,Point>={};
 for(const {id,b} of entries){const move=moveSelection(doc,[id],axis==="x"?{x:cursor-b.x,y:0}:{x:0,y:cursor-b.y});if(move.kind==="moveNodes")Object.assign(positions,move.positions);cursor+=b[size]+gap;}
 return {kind:"moveNodes",positions};
}
export function scaleSelection(doc:ProjectDocumentV2,ids:readonly string[],handle:Handle,delta:Point):StudioCommand[]{
 if(!canResizeSelection(doc,ids))throw Error("Selection cannot be resized");
 const chosen=normalizeSelection(doc,ids),b=selectionBounds(doc,chosen);
 const sx=handle.endsWith("e")?1:-1,sy=handle.startsWith("s")?1:-1;
 const axis={x:sx*b.width,y:sy*b.height},raw=1+(delta.x*axis.x+delta.y*axis.y)/(axis.x**2+axis.y**2);
 let min=0,max=Infinity;
 for(const id of chosen){const n=doc.nodes[id];min=Math.max(min,(n.sizing?.minWidth??1)/n.width,(n.sizing?.minHeight??1)/n.height);max=Math.min(max,(n.sizing?.maxWidth??20000)/n.width,(n.sizing?.maxHeight??20000)/n.height);}
 const k=Math.max(min,Math.min(max,raw)),anchor={x:sx===1?b.x:b.x+b.width,y:sy===1?b.y:b.y+b.height};
 return chosen.map(id=>{const n=doc.nodes[id],c=centerOf(doc,id),width=n.width*k,height=n.height*k;return {kind:"updateNode",id,changes:{...position(doc,id,{x:anchor.x+(c.x-anchor.x)*k,y:anchor.y+(c.y-anchor.y)*k},width,height),width,height}};});
}
export function rotateSelection(doc:ProjectDocumentV2,ids:readonly string[],degrees:number):StudioCommand[]{
 if(!Number.isFinite(degrees)||!freeSelection(doc,ids))throw Error("Selection cannot rotate");
 const chosen=normalizeSelection(doc,ids),b=selectionBounds(doc,chosen),center={x:b.x+b.width/2,y:b.y+b.height/2},a=degrees*Math.PI/180;
 return chosen.map(id=>{const n=doc.nodes[id],c=centerOf(doc,id),x=c.x-center.x,y=c.y-center.y;return {kind:"updateNode",id,changes:{...position(doc,id,{x:center.x+x*Math.cos(a)-y*Math.sin(a),y:center.y+x*Math.sin(a)+y*Math.cos(a)},n.width,n.height),rotation:normalizeAngle(n.rotation+degrees)}};});
}
export function copySelection(source:ProjectDocumentV2,resolved:ProjectDocumentV2,ids:readonly string[]):CanvasClipboard{
 const chosen=normalizeSelection(resolved,ids),nodes:Nodes={},centers:Record<string,Point>={},angles:Record<string,number>={},overrides:Overrides={},pageOrigins:Record<string,Point>={};
 if(!chosen.length)throw Error("Nothing selected");
 function visit(id:string){const n=source.nodes[id];nodes[id]=structuredClone(n);if(n.type==="frame")n.children.forEach(visit);}
 for(const id of chosen){visit(id);centers[id]=centerOf(resolved,id);angles[id]=angle(worldMatrix(resolved,id));let root=id;while(resolved.nodes[root].parentId)root=resolved.nodes[root].parentId!;pageOrigins[id]=mapPoint(worldMatrix(resolved,root),{x:0,y:0});}
 for(const root of chosen){if(nodes[root].componentSourceId&&!nodes[root].componentRef){const pending=[root];while(pending.length){const n=nodes[pending.pop()!];stripLink(n);if(n.type==="frame")pending.push(...n.children);}}}
 for(const device of ["desktop","tablet","mobile"] as const){const map=source.responsiveOverrides?.[device];if(map)overrides[device]=Object.fromEntries(Object.entries(map).filter(([id])=>Object.hasOwn(nodes,id)).map(([id,p])=>[id,structuredClone(p)]));}
 return {projectId:source.id,roots:chosen,nodes,overrides,centers,angles,pageOrigins};
}
export function pasteSelection(doc:ProjectDocumentV2,clip:CanvasClipboard,parentId:string,newId:()=>string,offset:Point={x:24,y:24}):{command:StudioCommand;ids:string[]}{
 const target=doc.nodes[parentId];if(doc.id!==clip.projectId||target?.type!=="frame")throw Error("Paste requires a target frame in the same project");
 if(Object.keys(doc.nodes).length+Object.keys(clip.nodes).length>500)throw Error("Node limit exceeded");
 let pageRoot=parentId;while(doc.nodes[pageRoot].parentId)pageRoot=doc.nodes[pageRoot].parentId!;
 const pageOrigin=mapPoint(worldMatrix(doc,pageRoot),{x:0,y:0});
 const ids=Object.fromEntries(Object.keys(clip.nodes).map(id=>[id,newId()]));
 if(new Set(Object.values(ids)).size!==Object.keys(ids).length)throw Error("Duplicate clipboard IDs");
 const nodes:Nodes={},overrides:Overrides={};
 for(const [id,original] of Object.entries(clip.nodes)){
  const n=structuredClone(original),root=clip.roots.includes(id);n.id=ids[id];n.parentId=root?parentId:ids[n.parentId!];
  if(n.type==="frame")n.children=n.children.map(child=>ids[child]);
  if(root){const c=localPoint(doc,parentId,{x:clip.centers[id].x-clip.pageOrigins[id].x+pageOrigin.x+offset.x,y:clip.centers[id].y-clip.pageOrigins[id].y+pageOrigin.y+offset.y});n.x=clampCoord(c.x-n.width/2);n.y=clampCoord(c.y-n.height/2);n.rotation=normalizeAngle(clip.angles[id]-angle(worldMatrix(doc,parentId)));}
  nodes[n.id]=n;
 }
 for(const device of ["desktop","tablet","mobile"] as const){const map=clip.overrides[device];if(map)overrides[device]=Object.fromEntries(Object.entries(map).map(([id,p])=>[ids[id],structuredClone(p)]));}
 const roots=clip.roots.map(id=>ids[id]);return {ids:roots,command:{kind:"pasteNodes",parentId,nodes,roots,overrides}};
}
export function reparentPreserveWorld(doc:ProjectDocumentV2,id:string,parentId:string,index?:number):StudioCommand[]{
 const n=doc.nodes[id],parent=doc.nodes[parentId];
 if(!canSelect(doc,id)||parent?.type!=="frame"||parent.locked||!parent.visible)throw Error("Invalid target");
 let ancestor:string|null=parentId;while(ancestor){if(ancestor===id)throw Error("Cannot move into own subtree");ancestor=doc.nodes[ancestor].parentId;}
 if(n.parentId===parentId&&index!==undefined)return [{kind:"reorderNode",id,index}];
 if(parent.layout!=="free")return [{kind:"reparentNode",id,parentId,index}];
 const c=localPoint(doc,parentId,centerOf(doc,id));
 return [{kind:"reparentNode",id,parentId,index},{kind:"updateNode",id,changes:{x:clampCoord(c.x-n.width/2),y:clampCoord(c.y-n.height/2),rotation:normalizeAngle(angle(worldMatrix(doc,id))-angle(worldMatrix(doc,parentId)))}}];
}
export type DistanceGuide={axis:Axis;from:Point;to:Point;distance:number};
export function distanceGuides(doc:ProjectDocumentV2,ids:readonly string[],targetId:string):DistanceGuide[]{
 if(!canSelect(doc,targetId)||normalizeSelection(doc,ids).includes(targetId)||!ids.length)return [];
 const a=selectionBounds(doc,ids),b=nodeBounds(doc,targetId),out:DistanceGuide[]=[];
 if(a.x+a.width<=b.x||b.x+b.width<=a.x){const left=a.x<b.x?a:b,right=left===a?b:a,y=Math.max(left.y,right.y)+(Math.min(left.y+left.height,right.y+right.height)-Math.max(left.y,right.y))/2;out.push({axis:"x",from:{x:left.x+left.width,y},to:{x:right.x,y},distance:right.x-left.x-left.width});}
 if(a.y+a.height<=b.y||b.y+b.height<=a.y){const top=a.y<b.y?a:b,bottom=top===a?b:a,x=Math.max(top.x,bottom.x)+(Math.min(top.x+top.width,bottom.x+bottom.width)-Math.max(top.x,bottom.x))/2;out.push({axis:"y",from:{x,y:top.y+top.height},to:{x,y:bottom.y},distance:bottom.y-top.y-top.height});}
 return out;
}
