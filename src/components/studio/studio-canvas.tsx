"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { demoBindings, type StudioElement, type StudioTemplate } from "@/features/studio/studio.schema";

type Tool="move"|"hand";
type Bounds={x:number;y:number;width:number;height:number};
const marks=Array.from({length:25},(_,i)=>i*100);
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const snap=(n:number,on:boolean)=>on?Math.round(n/10)*10:Math.round(n);
const rect=(n:StudioElement):Bounds=>({x:n.x,y:n.y,width:n.width,height:n.height});
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
function overlaps(a:Bounds,b:Bounds){
 return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
}
export function StudioCanvas({template,selectedIds,onSelect,onTransform,onGestureStart,onGestureEnd,
 editingId,onBeginEdit,onCommitText,onCancelEdit,tool="move",zoom=85,editable=true,showGrid=true,showRulers=true,snapToGrid=true}:{
 template:StudioTemplate;
 selectedIds:string[];
 onSelect:(ids:string[])=>void;
 onTransform:(patches:Record<string,Partial<StudioElement>>)=>void;
 onGestureStart?:()=>void;
 onGestureEnd?:()=>void;
 editingId?:string|null;
 onBeginEdit?:(id:string)=>void;
 onCommitText?:(id:string,value:string)=>void;
 onCancelEdit?:()=>void;
 tool?:Tool;
 zoom?:number;
 editable?:boolean;
 showGrid?:boolean;
 showRulers?:boolean;
 snapToGrid?:boolean;
}){
 const scale=zoom/100, ruler=showRulers?24:0;
 const surfaceRef=useRef<HTMLDivElement>(null);
 const editorRef=useRef<HTMLTextAreaElement>(null);
 const [draft,setDraft]=useState("");
 const [marquee,setMarquee]=useState<Bounds|null>(null);
 useEffect(()=>{
  if(!editingId)return;
  setDraft(template.elements.find(el=>el.id===editingId)?.text??"");
  requestAnimationFrame(()=>{editorRef.current?.focus();editorRef.current?.select()});
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[editingId]);
 const point=(e:{clientX:number;clientY:number})=>{
  const r=surfaceRef.current?.getBoundingClientRect();
  return {x:clamp((e.clientX-(r?.left??0))/scale,0,440),y:clamp((e.clientY-(r?.top??0))/scale,0,template.canvasHeight)};
 };
 function startGesture(event:PointerEvent<HTMLElement>,node:StudioElement,mode:"move"|"resize"){
  if(!editable||tool==="hand"||editingId===node.id||event.button!==0)return;
  event.stopPropagation();
  const additive=event.shiftKey||event.ctrlKey||event.metaKey;
  const wasSelected=selectedIds.includes(node.id);
  if(additive){
   onSelect(wasSelected?selectedIds.filter(x=>x!==node.id):[...selectedIds,node.id]);
   return;
  }
  const moving=wasSelected?selectedIds:[node.id];
  if(!wasSelected)onSelect(moving);
  const origin={x:event.clientX,y:event.clientY};
  const nodes=template.elements.filter(n=>moving.includes(n.id));
  const bases=Object.fromEntries(nodes.map(n=>[n.id,rect(n)]));
  const target=event.currentTarget,pointerId=event.pointerId;
  let started=false;
  target.setPointerCapture(pointerId);
  function move(ev:globalThis.PointerEvent){
   const dx=(ev.clientX-origin.x)/scale,dy=(ev.clientY-origin.y)/scale;
   if(!started&&Math.hypot(ev.clientX-origin.x,ev.clientY-origin.y)<5)return;
   if(!started){started=true;onGestureStart?.()}
   const patches:Record<string,Partial<StudioElement>>={};
   if(mode==="resize"){
    const original=bases[node.id];
    patches[node.id]={
     width:clamp(snap(original.width+dx,snapToGrid),24,440-original.x),
     height:clamp(snap(original.height+dy,snapToGrid),20,Math.min(1000,template.canvasHeight-original.y))
    };
   }else{
    const minDx=-Math.min(...nodes.map(n=>bases[n.id].x));
    const maxDx=Math.min(...nodes.map(n=>440-bases[n.id].x-bases[n.id].width));
    const minDy=-Math.min(...nodes.map(n=>bases[n.id].y));
    const maxDy=Math.min(...nodes.map(n=>template.canvasHeight-bases[n.id].y-bases[n.id].height));
    const boundedX=clamp(snap(dx,snapToGrid),minDx,maxDx);
    const boundedY=clamp(snap(dy,snapToGrid),minDy,maxDy);
    for(const n of nodes)patches[n.id]={x:clamp(bases[n.id].x+boundedX,0,440-n.width),y:clamp(bases[n.id].y+boundedY,0,template.canvasHeight-n.height)};
   }
   onTransform(patches);
  }
  function end(){
   target.removeEventListener("pointermove",move);
   target.removeEventListener("pointerup",end);
   target.removeEventListener("pointercancel",end);
   if(target.hasPointerCapture(pointerId))target.releasePointerCapture(pointerId);
   if(started)onGestureEnd?.();
  }
  target.addEventListener("pointermove",move);
  target.addEventListener("pointerup",end);
  target.addEventListener("pointercancel",end);
 }
 function startMarquee(event:PointerEvent<HTMLDivElement>){
  if(!editable||tool==="hand"||event.button!==0||event.target!==event.currentTarget)return;
  const start=point(event),target=event.currentTarget,pointerId=event.pointerId;
  const additive=event.shiftKey;
  let active=false;
  target.setPointerCapture(pointerId);
  if(!additive)onSelect([]);
  function move(ev:globalThis.PointerEvent){
   const p=point(ev);
   if(!active&&Math.hypot(ev.clientX-event.clientX,ev.clientY-event.clientY)<5)return;
   active=true;
   setMarquee({x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),width:Math.abs(p.x-start.x),height:Math.abs(p.y-start.y)});
  }
  function end(ev:globalThis.PointerEvent){
   if(active){
    const p=point(ev);
    const area={x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),width:Math.abs(p.x-start.x),height:Math.abs(p.y-start.y)};
    const hits=template.elements.filter(n=>overlaps(rect(n),area)).map(n=>n.id);
    onSelect(additive?[...new Set([...selectedIds,...hits])]:hits);
   }
   setMarquee(null);
   target.removeEventListener("pointermove",move);
   target.removeEventListener("pointerup",end);
   target.removeEventListener("pointercancel",end);
   if(target.hasPointerCapture(pointerId))target.releasePointerCapture(pointerId);
  }
  target.addEventListener("pointermove",move);
  target.addEventListener("pointerup",end);
  target.addEventListener("pointercancel",end);
 }
 function handleKey(e:KeyboardEvent<HTMLDivElement>,node:StudioElement){
  if(!editable||tool==="hand"||editingId||!selectedIds.includes(node.id))return;
  const step=e.shiftKey?10:1;
  const deltas:Record<string,[number,number]>={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};
  const delta=deltas[e.key];
  if(!delta)return;
  e.preventDefault();
  const selected=template.elements.filter(n=>selectedIds.includes(n.id));
  const patches:Record<string,Partial<StudioElement>>={};
  for(const n of selected)patches[n.id]={x:clamp(n.x+delta[0],0,440-n.width),y:clamp(n.y+delta[1],0,template.canvasHeight-n.height)};
  onGestureStart?.();onTransform(patches);onGestureEnd?.();
 }
 const contentHeight=template.canvasHeight*scale;
 return <div className="studio-preview-viewport" style={{width:440*scale+ruler,height:contentHeight+ruler}}>
  {showRulers&&<>
   <div className="studio-ruler-corner"/>
   <div className="studio-ruler-horizontal" style={{left:ruler,width:440*scale}}>{marks.filter(x=>x<=440).map(x=><span key={x} style={{left:x*scale}}>{x}</span>)}</div>
   <div className="studio-ruler-vertical" style={{top:ruler,height:contentHeight}}>{marks.filter(x=>x<=template.canvasHeight).map(x=><span key={x} style={{top:x*scale}}>{x}</span>)}</div>
  </>}
  <div ref={surfaceRef} className={`studio-render-surface ${tool==="hand"?"is-hand":""}`}
   style={{left:ruler,top:ruler,width:440,height:template.canvasHeight,transform:`scale(${scale})`,background:template.background}}
   onPointerDown={startMarquee}>
   {showGrid&&<div className="studio-grid-overlay" aria-hidden="true"/>}
   {template.elements.map(node=>{
    const isSelected=editable&&selectedIds.includes(node.id);
    const style:CSSProperties={left:node.x,top:node.y,width:node.width,height:node.height,opacity:node.opacity,
     backgroundColor:node.type==="image"?"transparent":node.background,color:node.color,borderRadius:node.radius,
     fontFamily:node.fontFamily==="serif"?"Georgia,serif":"Arial,sans-serif",fontSize:node.fontSize,
     fontWeight:Number(node.fontWeight),fontStyle:node.italic?"italic":"normal",
     textDecoration:[node.underline?"underline":"",node.strike?"line-through":""].filter(Boolean).join(" ")||"none",
     letterSpacing:node.letterSpacing,textAlign:node.textAlign,...(node.type==="shape"?shapeStyle(node.shapeKind):{})};
    return <div key={node.id} className={`studio-render-node studio-node-${node.type}${isSelected?" is-selected":""}`}
      data-studio-node={node.id} style={style} tabIndex={editable?0:undefined}
      role={editable?"button":undefined}
      aria-label={editable?`Элемент ${node.text||node.type}; Shift+нажатие для множественного выбора`:undefined}
      onClick={e=>e.stopPropagation()}
      onDoubleClick={editable&&(node.type==="text"||node.type==="button")?()=>{onSelect([node.id]);onBeginEdit?.(node.id)}:undefined}
      onPointerDown={e=>startGesture(e,node,"move")}
      onKeyDown={e=>handleKey(e,node)}>
      {editingId===node.id&&(node.type==="text"||node.type==="button")?
       <textarea ref={editorRef} className="studio-inline-textarea" maxLength={300} value={draft}
        aria-label="Изменить текст на холсте" onChange={e=>setDraft(e.target.value)}
        onClick={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()}
        onKeyDown={e=>{e.stopPropagation();if(e.key==="Escape"){e.preventDefault();onCancelEdit?.()}if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){e.preventDefault();onCommitText?.(node.id,draft)}}}
        onBlur={()=>{if(editingId===node.id)onCommitText?.(node.id,draft)}}/>:
       node.type==="image"?(node.imageSrc?
        <Image unoptimized src={node.imageSrc.startsWith("data:")?node.imageSrc:`${process.env.NEXT_PUBLIC_PAGES_BASE_PATH??""}${node.imageSrc}`}
        alt="" fill sizes="440px" draggable={false} style={{objectFit:"cover",borderRadius:node.radius}}/>:
        <span className="studio-image-empty">Фото</span>):node.type==="shape"?null:
        <span>{node.binding==="none"?node.text:demoBindings[node.binding]}</span>}
      {isSelected&&selectedIds.length===1&&editingId!==node.id&&tool==="move"&&
       <span className="studio-resize-handle" role="button" tabIndex={0} aria-label="Изменить размер элемента"
        onClick={e=>e.stopPropagation()} onPointerDown={e=>{e.stopPropagation();startGesture(e,node,"resize")}}/>}
     </div>;
   })}
   {marquee&&<div className="studio-marquee" style={{left:marquee.x,top:marquee.y,width:marquee.width,height:marquee.height}}/>}
  </div>
 </div>;
}
