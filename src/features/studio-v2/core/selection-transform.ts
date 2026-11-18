import type { ProjectDocumentV2, ProjectNodeV2 } from "./document.schema.ts";
import type { StudioCommand } from "./command-engine.ts";
import { unionRects, type Point, type Rect } from "./viewport.ts";

type Matrix = readonly [number, number, number, number, number, number];
const identity: Matrix = [1,0,0,1,0,0];
const multiply = (a: Matrix,b: Matrix): Matrix => [
 a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],
 a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],
 a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]
];
const translate = (x:number,y:number): Matrix => [1,0,0,1,x,y];
const rotation = (degrees:number):Matrix => {
 const a=degrees*Math.PI/180; return [Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0];
};
export const mapPoint=(m:Matrix,p:Point):Point=>({x:m[0]*p.x+m[2]*p.y+m[4],y:m[1]*p.x+m[3]*p.y+m[5]});
function nodeMatrix(n:ProjectNodeV2):Matrix {
 return multiply(multiply(translate(n.x+n.width/2,n.y+n.height/2),rotation(n.rotation)),translate(-n.width/2,-n.height/2));
}
/** Root geometry follows the artboard renderer; its placement is independent of node x/y. */
export function worldMatrix(doc:ProjectDocumentV2,id:string):Matrix {
 const n=doc.nodes[id]; if(!n)throw new Error("Unknown node");
 if(n.parentId===null){
  const p=doc.pages.find(p=>p.rootNodeId===id); if(!p)throw new Error("Unknown page");
  return translate(p.placement.x,p.placement.y);
 }
 return multiply(worldMatrix(doc,n.parentId),nodeMatrix(n));
}
export function canSelect(doc:ProjectDocumentV2,id:string):boolean {
 let n:ProjectNodeV2|undefined=doc.nodes[id];
 if(!n||n.parentId===null)return false;
 while(n){if(n.locked||!n.visible)return false; if(n.parentId===null)return true;n=doc.nodes[n.parentId];}
 return false;
}
/** Remove descendants when their ancestor is selected: each subtree moves once. */
export function normalizeSelection(doc:ProjectDocumentV2,ids:readonly string[]):string[]{
 const valid=new Set(ids.filter(id=>canSelect(doc,id)));
 return [...valid].filter(id=>{
  let p=doc.nodes[id].parentId;
  while(p!==null){if(valid.has(p))return false;p=doc.nodes[p].parentId;}
  return true;
 });
}
export function selectNode(doc:ProjectDocumentV2,ids:readonly string[],id:string,additive=false):string[]{
 if(!canSelect(doc,id))return normalizeSelection(doc,ids);
 return normalizeSelection(doc,additive?(ids.includes(id)?ids.filter(i=>i!==id):[...ids,id]):[id]);
}
export function nodeCorners(doc:ProjectDocumentV2,id:string):Point[]{
 const n=doc.nodes[id],m=worldMatrix(doc,id);
 return [{x:0,y:0},{x:n.width,y:0},{x:n.width,y:n.height},{x:0,y:n.height}].map(p=>mapPoint(m,p));
}
export function nodeBounds(doc:ProjectDocumentV2,id:string):Rect{
 const c=nodeCorners(doc,id);return unionRects(c.map(p=>({...p,width:0,height:0})));
}
export function selectionBounds(doc:ProjectDocumentV2,ids:readonly string[]):Rect{
 return unionRects(normalizeSelection(doc,ids).map(id=>nodeBounds(doc,id)));
}
/** Drag delta is in world units; rotate it back into each parent coordinate system. */
export function moveSelection(doc:ProjectDocumentV2,ids:readonly string[],delta:Point):StudioCommand{
 const positions:Record<string,{x:number;y:number}>={};
 for(const id of normalizeSelection(doc,ids)){
  const n=doc.nodes[id],m=n.parentId?worldMatrix(doc,n.parentId):identity;
  positions[id]={x:Math.max(-1e6,Math.min(1e6,n.x+m[0]*delta.x+m[1]*delta.y)),y:Math.max(-1e6,Math.min(1e6,n.y+m[2]*delta.x+m[3]*delta.y))};
 }
 return {kind:"moveNodes",positions};
}
export type Handle = "nw"|"ne"|"sw"|"se";
export function resizeNode(doc:ProjectDocumentV2,id:string,handle:Handle,delta:Point,proportional=false):StudioCommand{
 if(!canSelect(doc,id))throw new Error("Node is not editable");
 const n=doc.nodes[id], m=worldMatrix(doc,id);
 const dx=m[0]*delta.x+m[1]*delta.y,dy=m[2]*delta.x+m[3]*delta.y;
 const sx=handle.endsWith("e")?1:-1,sy=handle.startsWith("s")?1:-1;
 let width=Math.max(1,Math.min(20000,n.width+sx*dx)),height=Math.max(1,Math.min(20000,n.height+sy*dy));
 if(proportional){const k=Math.max(1/Math.min(n.width,n.height),Math.min(20000/Math.max(n.width,n.height),Math.abs(width/n.width-1)>Math.abs(height/n.height-1)?width/n.width:height/n.height));width=n.width*k;height=n.height*k;}
 const v=mapPoint(rotation(n.rotation),{x:sx*(width-n.width)/2,y:sy*(height-n.height)/2});
 return {kind:"updateNode",id,changes:{width,height,x:n.x+v.x+(n.width-width)/2,y:n.y+v.y+(n.height-height)/2}};
}
export function marqueeSelection(doc:ProjectDocumentV2,rootId:string,rect:Rect):string[]{
 const root=doc.nodes[rootId];if(root?.type!=="frame")return [];
 return normalizeSelection(doc,root.children.filter(id=>{if(!canSelect(doc,id))return false;const b=nodeBounds(doc,id);return b.x>=rect.x&&b.y>=rect.y&&b.x+b.width<=rect.x+rect.width&&b.y+b.height<=rect.y+rect.height;}));
}
export function snapMove(doc:ProjectDocumentV2,ids:readonly string[],delta:Point,zoom:number,tolerance=6){
 const chosen=normalizeSelection(doc,ids);const bounds=selectionBounds(doc,chosen);
 const parents=new Set(chosen.map(id=>doc.nodes[id].parentId));
 const targets=Object.values(doc.nodes).filter(n=>!chosen.includes(n.id)&&parents.has(n.parentId)&&canSelect(doc,n.id)).map(n=>nodeBounds(doc,n.id));
 const xs=[bounds.x,bounds.x+bounds.width/2,bounds.x+bounds.width].map(x=>x+delta.x);
 const ys=[bounds.y,bounds.y+bounds.height/2,bounds.y+bounds.height].map(y=>y+delta.y);
 let bestX=tolerance/zoom,bestY=tolerance/zoom,dx=0,dy=0;
 let guideX:number|undefined,guideY:number|undefined;
 for(const b of targets){
  for(const x of [b.x,b.x+b.width/2,b.x+b.width])for(const own of xs){const d=x-own;if(Math.abs(d)<bestX){bestX=Math.abs(d);dx=d;guideX=x;}}
  for(const y of [b.y,b.y+b.height/2,b.y+b.height])for(const own of ys){const d=y-own;if(Math.abs(d)<bestY){bestY=Math.abs(d);dy=d;guideY=y;}}
 }
 return {delta:{x:delta.x+dx,y:delta.y+dy},guideX,guideY};
}
export function groupSelection(doc:ProjectDocumentV2,ids:readonly string[],groupId:string):StudioCommand[]{
 const chosen=normalizeSelection(doc,ids);if(chosen.length<2)throw new Error("Select at least two nodes");
 const parentId=doc.nodes[chosen[0]].parentId!;const parent=doc.nodes[parentId];
 if(parent.type!=="frame"||parent.layout!=="free"||chosen.some(id=>doc.nodes[id].parentId!==parentId))throw new Error("Group requires siblings in a free frame");
 const ordered=parent.children.filter(id=>chosen.includes(id)),index=parent.children.indexOf(ordered[0]);
 if(ordered.some((id,i)=>parent.children[index+i]!==id))throw new Error("Group requires adjacent layers to preserve stacking");
 if(ordered.some(id=>doc.nodes[id].rotation!==0))throw new Error("Grouping rotated layers is not supported yet");
 const bounds=unionRects(ordered.map(id=>doc.nodes[id]));
 const group:ProjectNodeV2={id:groupId,parentId,type:"frame",name:"Группа",...bounds,rotation:0,opacity:1,visible:true,locked:false,children:[],layout:"free",gap:0,padding:{top:0,right:0,bottom:0,left:0},background:"#FFFFFF",clip:false};
 // Frame schema has no transparent background yet: group is a structural prototype.
 return [{kind:"insertNode",parentId,node:group,index},...ordered.flatMap(id=>[
 {kind:"reparentNode" as const,id,parentId:groupId},
 {kind:"updateNode" as const,id,changes:{x:doc.nodes[id].x-bounds.x,y:doc.nodes[id].y-bounds.y}}
 ])];
}
