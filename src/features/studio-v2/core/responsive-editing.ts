import type {ProjectDocumentV2} from "./document.schema.ts";
import type {Device,NodeOverride} from "./responsive-engine.ts";
import {responsiveSource} from "./responsive-engine.ts";
import {canSelect,moveSelection,resizeNode,type Handle} from "./selection-transform.ts";
import type {Point} from "./viewport.ts";
import type {StudioCommand} from "./command-engine.ts";
const coord=(n:number)=>Math.max(-1e6,Math.min(1e6,n));
export function devicePatch(doc:ProjectDocumentV2,id:string,device:Device,patch:NodeOverride):StudioCommand{
 return {kind:"setResponsiveOverride",id,device,patch:{...doc.responsiveOverrides?.[device]?.[id],...patch}};
}
export function canDragDeviceNode(doc:ProjectDocumentV2,id:string){
 const n=doc.nodes[id],p=n?.parentId?doc.nodes[n.parentId]:undefined;
 return !!n&&canSelect(doc,id)&&p?.type==="frame"&&p.layout==="free"&&n.sizing?.width!=="fill"&&n.sizing?.height!=="fill";
}
export function canResizeDeviceNode(doc:ProjectDocumentV2,id:string){
 const n=doc.nodes[id];return canDragDeviceNode(doc,id)&&!!n&&(!n.sizing||n.sizing.width==="fixed"&&n.sizing.height==="fixed")&&(!n.anchors||n.anchors.x==="start"&&n.anchors.y==="start")&&!(n.type==="text"&&n.autoHeight);
}
/** Convert solved geometry changes to authored device-local deltas. Anchors are not applied twice. */
export function deviceGesture(doc:ProjectDocumentV2,resolved:ProjectDocumentV2,id:string,device:Device,delta:Point,handle?:Handle,proportional=false):StudioCommand{
 const n=resolved.nodes[id],raw=responsiveSource(doc,device).nodes[id];
 if(!n||!raw||!(handle?canResizeDeviceNode(resolved,id):canDragDeviceNode(resolved,id)))throw Error("Layer is controlled by layout or locked");
 if(!handle){const cmd=moveSelection(resolved,[id],delta);if(cmd.kind!=="moveNodes")throw Error("Invalid move");const p=cmd.positions[id];return devicePatch(doc,id,device,{x:coord(raw.x+p.x-n.x),y:coord(raw.y+p.y-n.y)});}
 const cmd=resizeNode(resolved,id,handle,delta,proportional);if(cmd.kind!=="updateNode")throw Error("Invalid resize");
 const p=cmd.changes;
 // Clamp size to declared limits. Reject rather than drifting the opposite handle.
 const w=p.width!,h=p.height!;
 if(w<(n.sizing?.minWidth??1)||w>(n.sizing?.maxWidth??20000)||h<(n.sizing?.minHeight??1)||h>(n.sizing?.maxHeight??20000))throw Error("Size exceeds layer constraints");
 return devicePatch(doc,id,device,{x:coord(raw.x+p.x!-n.x),y:coord(raw.y+p.y!-n.y),width:w,height:h});
}
