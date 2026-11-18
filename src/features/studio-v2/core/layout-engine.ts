import type { ProjectDocumentV2, ProjectNodeV2 } from "./document.schema.ts";
import type { Rect } from "./viewport.ts";
type Axis = "width" | "height";
type Frame = Extract<ProjectNodeV2,{type:"frame"}>;
type Geometry = Record<string,Rect>;
const limit=(n:ProjectNodeV2,axis:Axis,v:number)=>Math.max(axis==="width"?n.sizing?.minWidth??1:n.sizing?.minHeight??1,Math.min(axis==="width"?n.sizing?.maxWidth??20000:n.sizing?.maxHeight??20000,v));
const mode=(n:ProjectNodeV2,axis:Axis)=>n.sizing?.[axis]??"fixed";
const inset=(n:Frame,axis:Axis)=>axis==="width"?n.padding.left+n.padding.right:n.padding.top+n.padding.bottom;
const start=(n:Frame,axis:Axis)=>axis==="width"?n.padding.left:n.padding.top;
const coordinate=(axis:Axis)=>axis==="width"?"x" as const:"y" as const;
const visibleChildren=(doc:ProjectDocumentV2,n:Frame)=>n.children.map(id=>doc.nodes[id]).filter(c=>c.visible);
const align=(available:number,content:number,value:string)=>value==="center"?(available-content)/2:value==="end"?available-content:0;

/** Intrinsic size is bottom-up; fill children contribute their minimum to hug parents.
 * No feedback cycle between child fill and parent hug. Geometry is in parent-local units. */
export function resolveLayout(doc:ProjectDocumentV2):Geometry {
 const intrinsic=new Map<string,{width:number;height:number}>();
 function measure(n:ProjectNodeV2):{width:number;height:number}{
   const cached=intrinsic.get(n.id);if(cached)return cached;
   const result={width:limit(n,"width",n.width),height:limit(n,"height",n.height)};
   if(n.type==="frame"){
     const children=visibleChildren(doc,n);for(const c of children)measure(c);
     if(n.layout!=="free"){
       const main:Axis=n.layout==="horizontal"?"width":"height";
       for(const axis of ["width","height"] as const){
         if(mode(n,axis)!=="hug")continue;
         const values=children.map(c=>mode(c,axis)==="fill"?limit(c,axis,1):measure(c)[axis]);
         const content=main===axis?values.reduce((a,b)=>a+b,0)+Math.max(0,values.length-1)*n.gap:Math.max(0,...values);
         result[axis]=limit(n,axis,content+inset(n,axis));
       }
     }
   }
   intrinsic.set(n.id,result);return result;
 }
 for(const page of doc.pages)measure(doc.nodes[page.rootNodeId]);
 const result:Geometry={};
 function arrange(n:ProjectNodeV2,rect:Rect){
   result[n.id]=rect;
   if(n.type!=="frame")return;
   const children=visibleChildren(doc,n);
   if(n.layout==="free"){
     for(const c of children){
       const measured=measure(c);
       const next={x:c.x,y:c.y,...measured};
       for(const axis of ["width","height"] as const){
         const pos=coordinate(axis),change=rect[axis]-n[axis],anchor=c.anchors?.[pos]??"start";
         if(mode(c,axis)==="fill"){next[axis]=limit(c,axis,rect[axis]-inset(n,axis));next[pos]=start(n,axis);continue;}
         if(anchor==="stretch")next[axis]=limit(c,axis,measured[axis]+change);
         if(anchor==="end")next[pos]+=change-(next[axis]-measured[axis]);
         else if(anchor==="center")next[pos]+=(change-(next[axis]-measured[axis]))/2;
       }
       arrange(c,next);
     }
     return;
   }
   const main:Axis=n.layout==="horizontal"?"width":"height",cross:Axis=main==="width"?"height":"width";
   const available=Math.max(0,rect[main]-inset(n,main)),crossAvailable=Math.max(0,rect[cross]-inset(n,cross));
   const gap=Math.max(0,children.length-1)*n.gap;
   const lengths=new Map(children.map(c=>[c.id,mode(c,main)==="fill"?limit(c,main,1):measure(c)[main]]));
   let remaining=Math.max(0,available-gap-[...lengths.values()].reduce((a,b)=>a+b,0));
   let flex=children.filter(c=>mode(c,main)==="fill");
   // Water filling respects max bounds and redistributes unused space.
   while(flex.length&&remaining>1e-7){
     const share=remaining/flex.length;
     let used=0;
     for(const c of flex){const old=lengths.get(c.id)!;const next=limit(c,main,old+share);lengths.set(c.id,next);used+=next-old;}
     remaining=Math.max(0,remaining-used);if(used<1e-7)break;
     flex=flex.filter(c=>limit(c,main,20000)-lengths.get(c.id)!>1e-7);
   }
   const used=[...lengths.values()].reduce((a,b)=>a+b,0)+gap;
   const extra=Math.max(0,available-used);
   const distributed=n.distribution==="space-between"&&children.length>1?extra/(children.length-1):0;
   let cursor=start(n,main)+align(extra,0,n.distribution??"start");
   for(const c of children){
     const length=lengths.get(c.id)!;
     const breadth=mode(c,cross)==="fill"?limit(c,cross,crossAvailable):measure(c)[cross];
     const next={x:0,y:0,width:0,height:0};
     next[coordinate(main)]=cursor;next[main]=length;
     next[coordinate(cross)]=start(n,cross)+align(crossAvailable,breadth,n.alignment??"start");next[cross]=breadth;
     arrange(c,next);cursor+=length+n.gap+distributed;
   }
 }
 for(const page of doc.pages){const node=doc.nodes[page.rootNodeId];arrange(node,{x:node.x,y:node.y,...measure(node)});}
 return result;
}
/** Derived render-only document. Never write solved coordinates back into the source. */
export function layoutDocument(doc:ProjectDocumentV2):ProjectDocumentV2 {
 const geometry=resolveLayout(doc);
 return {...doc,nodes:Object.fromEntries(Object.entries(doc.nodes).map(([id,n])=>[id,geometry[id]?{...n,...geometry[id]}:n]))};
}
