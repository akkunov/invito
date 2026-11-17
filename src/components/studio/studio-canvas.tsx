"use client";

import Image from "next/image";
import {useEffect,useRef,useState,type CSSProperties,type KeyboardEvent,type PointerEvent} from "react";
import {demoBindings,type StudioElement,type StudioTemplate} from "@/features/studio/studio.schema";

function getText(node:StudioElement){return node.binding==="none"?node.text:demoBindings[node.binding]}
const rulerMarks=Array.from({length:25},(_,i)=>i*100);
function snap(value:number,enabled:boolean){return enabled?Math.round(value/10)*10:Math.round(value)}
function shapeStyle(kind:StudioElement["shapeKind"]):CSSProperties{
  switch(kind){
    case "circle":case "ellipse":return {borderRadius:"50%"};
    case "triangle":return {clipPath:"polygon(50% 0,100% 100%,0 100%)"};
    case "diamond":return {clipPath:"polygon(50% 0,100% 50%,50% 100%,0 50%)"};
    case "star":return {clipPath:"polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"};
    case "heart":return {clipPath:"polygon(50% 92%,6% 50%,0 28%,5% 11%,22% 3%,40% 12%,50% 26%,60% 12%,78% 3%,95% 11%,100% 28%,94% 50%)"};
    default:return {};
  }
}
export function StudioCanvas({template,selectedId,onSelect,onMove,onResize,editingId,onBeginEdit,onCommitText,onCancelEdit,editable=true,viewport=440,showGrid=false,showRulers=false,snapToGrid=false}:{
 template:StudioTemplate;selectedId?:string|null;onSelect?:(id:string|null)=>void;
 onMove?:(id:string,x:number,y:number)=>void;onResize?:(id:string,width:number,height:number)=>void;
 editingId?:string|null;onBeginEdit?:(id:string)=>void;onCommitText?:(id:string,value:string)=>void;onCancelEdit?:()=>void;
 editable?:boolean;viewport?:number;showGrid?:boolean;showRulers?:boolean;snapToGrid?:boolean;
}){
 const scale=viewport/440;
 const ruler=showRulers?24:0;
 const editorRef=useRef<HTMLTextAreaElement>(null);
 const [draft,setDraft]=useState("");
 useEffect(()=>{
   if(!editingId)return;
   setDraft(template.elements.find(el=>el.id===editingId)?.text??"");
   requestAnimationFrame(()=>{editorRef.current?.focus();editorRef.current?.select()});
   // eslint-disable-next-line react-hooks/exhaustive-deps
 },[editingId]);

 function handlePointer(event:PointerEvent<HTMLElement>,node:StudioElement,mode:"move"|"resize"){
   if(!editable||event.button!==0||editingId===node.id)return;
   event.stopPropagation();
   // First click only selects; a second deliberate gesture starts moving.
   if(selectedId!==node.id){onSelect?.(node.id);return}
   const target=event.currentTarget;
   const originX=event.clientX,originY=event.clientY;
   let moved=false;
   const pointerId=event.pointerId;
   target.setPointerCapture(pointerId);
   function onPointerMove(ev:globalThis.PointerEvent){
     const dx=(ev.clientX-originX)/scale;
     const dy=(ev.clientY-originY)/scale;
     if(!moved && Math.hypot(ev.clientX-originX,ev.clientY-originY)<7)return;
     moved=true;
     if(mode==="move"){
       const x=Math.min(440-node.width,Math.max(0,snap(node.x+dx,snapToGrid)));
       const y=Math.min(template.canvasHeight-node.height,Math.max(0,snap(node.y+dy,snapToGrid)));
       onMove?.(node.id,x,y);
     }else{
       const width=Math.min(440-node.x,Math.max(24,snap(node.width+dx,snapToGrid)));
       const height=Math.min(Math.min(1000,template.canvasHeight-node.y),Math.max(20,snap(node.height+dy,snapToGrid)));
       onResize?.(node.id,width,height);
     }
   }
   function finish(){
     target.removeEventListener("pointermove",onPointerMove);
     target.removeEventListener("pointerup",finish);
     target.removeEventListener("pointercancel",finish);
     if(target.hasPointerCapture(pointerId))target.releasePointerCapture(pointerId);
   }
   target.addEventListener("pointermove",onPointerMove);
   target.addEventListener("pointerup",finish);
   target.addEventListener("pointercancel",finish);
 }
 function handleKey(event:KeyboardEvent<HTMLDivElement>,node:StudioElement){
   if(!editable||editingId===node.id||selectedId!==node.id)return;
   const delta=event.shiftKey?10:1;
   const d:Record<string,[number,number]>={ArrowLeft:[-delta,0],ArrowRight:[delta,0],ArrowUp:[0,-delta],ArrowDown:[0,delta]};
   if(!d[event.key])return;
   event.preventDefault();
   onMove?.(node.id,
     Math.max(0,Math.min(440-node.width,node.x+d[event.key][0])),
     Math.max(0,Math.min(template.canvasHeight-node.height,node.y+d[event.key][1])));
 }
 return <div className="studio-preview-viewport" style={{width:viewport+ruler,height:Math.ceil(template.canvasHeight*scale)+ruler}}>
  {showRulers&&<>
    <div className="studio-ruler-corner"/>
    <div className="studio-ruler-horizontal" style={{left:ruler,width:viewport}}>
      {rulerMarks.filter(x=>x<=440).map(x=><span key={x} style={{left:x*scale}}>{x}</span>)}
    </div>
    <div className="studio-ruler-vertical" style={{top:ruler,height:template.canvasHeight*scale}}>
      {rulerMarks.filter(x=>x<=template.canvasHeight).map(x=><span key={x} style={{top:x*scale}}>{x}</span>)}
    </div>
  </>}
  <div className="studio-render-surface" style={{left:ruler,top:ruler,width:440,height:template.canvasHeight,transform:`scale(${scale})`,background:template.background}}
    onClick={event=>{if(event.target===event.currentTarget)onSelect?.(null)}}>
   {showGrid&&<div className="studio-grid-overlay" aria-hidden="true"/>}
   {template.elements.map(node=>{
     const isSelected=editable&&selectedId===node.id;
     const style:CSSProperties={left:node.x,top:node.y,width:node.width,height:node.height,opacity:node.opacity,
       backgroundColor:node.type==="image"?"transparent":node.background,color:node.color,borderRadius:node.radius,
       fontFamily:node.fontFamily==="serif"?"Georgia, serif":"Arial, sans-serif",
       fontSize:node.fontSize,fontWeight:Number(node.fontWeight),fontStyle:node.italic?"italic":"normal",
       textDecoration:[node.underline?"underline":"",node.strike?"line-through":""].filter(Boolean).join(" ")||"none",
       letterSpacing:node.letterSpacing,textAlign:node.textAlign,
       ...(node.type==="shape"?shapeStyle(node.shapeKind):{})};
     return <div key={node.id} data-studio-node={node.id}
       className={`studio-render-node studio-node-${node.type}${isSelected?" is-selected":""}`}
       style={style} role={editable?"button":undefined} tabIndex={editable?0:undefined}
       aria-label={editable?`Элемент: ${node.text||node.type}. Стрелки — перемещение`:undefined}
       onClick={event=>{event.stopPropagation();if(editable)onSelect?.(node.id)}}
       onDoubleClick={editable&&(node.type==="text"||node.type==="button")?()=>{onSelect?.(node.id);onBeginEdit?.(node.id)}:undefined}
       onPointerDown={event=>handlePointer(event,node,"move")}
       onKeyDown={event=>handleKey(event,node)}>
       {editingId===node.id&&(node.type==="text"||node.type==="button")?
         <textarea ref={editorRef} className="studio-inline-textarea" maxLength={300}
           aria-label="Редактировать текст на холсте" value={draft} onChange={e=>setDraft(e.target.value)}
           onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}
           onKeyDown={e=>{e.stopPropagation();if(e.key==="Escape"){e.preventDefault();onCancelEdit?.()}if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){e.preventDefault();onCommitText?.(node.id,draft)}}}
           onBlur={()=>{if(editingId===node.id)onCommitText?.(node.id,draft)}}/>:
         node.type==="image"?(node.imageSrc?
           <Image unoptimized src={node.imageSrc.startsWith("data:")?node.imageSrc:`${process.env.NEXT_PUBLIC_PAGES_BASE_PATH??""}${node.imageSrc}`}
             alt="" fill sizes="440px" draggable={false} style={{objectFit:"cover",borderRadius:node.radius}}/>:
           <span className="studio-image-empty">Фото</span>):
         node.type==="shape"?null:<span>{getText(node)}</span>}
       {isSelected&&editingId!==node.id&&<span className="studio-resize-handle" role="button"
         aria-label="Изменить размер" onClick={e=>e.stopPropagation()}
         onPointerDown={e=>{e.stopPropagation();handlePointer(e,node,"resize")}}/>}
     </div>;
   })}
  </div>
 </div>;
}
