import {viewportWorldBounds,type Rect,type Size,type Viewport} from "./viewport.ts";
import type {ProjectDocumentV2} from "./document.schema.ts";
export const ARTBOARD_OVERSCAN_PX=240;
export const VIRTUALIZE_PAGE_THRESHOLD=8;
export const VIRTUALIZE_NODE_THRESHOLD=200;
export type RenderPage={id:string;rect:Rect};
/** Keep shells, minimap and authored geometry independent of render visibility.
 * Overscan is in screen pixels so panning never exposes a blank artboard edge. */
export function visibleArtboards(pages:readonly RenderPage[],viewport:Viewport,size:Size,pinned:ReadonlySet<string>,nodeCount:number):Set<string>{
 if(pages.length<VIRTUALIZE_PAGE_THRESHOLD&&nodeCount<VIRTUALIZE_NODE_THRESHOLD)return new Set(pages.map(p=>p.id));
 const bounds=viewportWorldBounds(viewport,size),margin=ARTBOARD_OVERSCAN_PX/viewport.zoom;
 const x=bounds.x-margin,y=bounds.y-margin,right=bounds.x+bounds.width+margin,bottom=bounds.y+bounds.height+margin;
 return new Set(pages.filter(({id,rect:r})=>pinned.has(id)||(r.x<=right&&r.x+r.width>=x&&r.y<=bottom&&r.y+r.height>=y)).map(p=>p.id));
}
/** A selection can span several pages; never unmount a live editor or gesture target. */
export function pinnedArtboards(doc:ProjectDocumentV2,selectedPage:string|null,nodeIds:readonly string[],editingId?:string,draggedPage?:string):Set<string>{
 const roots=new Map(doc.pages.map(p=>[p.rootNodeId,p.id])),result=new Set<string>();
 if(selectedPage)result.add(selectedPage);if(draggedPage)result.add(draggedPage);
 for(const id of [...nodeIds,...(editingId?[editingId]:[])]){
  let n=doc.nodes[id];const seen=new Set<string>();
  while(n&&!seen.has(n.id)){
   seen.add(n.id);
   const page=roots.get(n.id);if(page){result.add(page);break;}
   if(!n.parentId)break;n=doc.nodes[n.parentId];
  }
 }
 return result;
}
