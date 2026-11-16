"use client";

import Image from "next/image";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { demoBindings, type StudioElement, type StudioTemplate } from "@/features/studio/studio.schema";

function elementText(el: StudioElement) {
  return el.binding === "none" ? el.text : demoBindings[el.binding];
}

export function StudioCanvas({template,selectedId,onSelect,onMove,editable=true,viewport=440}:{
  template:StudioTemplate;
  selectedId?:string|null;
  onSelect?:(id:string)=>void;
  onMove?:(id:string,x:number,y:number)=>void;
  editable?:boolean;
  viewport?:number;
}) {
  const scale=viewport/440;
  function handlePointerDown(event:PointerEvent<HTMLDivElement>,node:StudioElement){
    if(!editable||!onMove||!onSelect||event.button!==0)return;
    const originX=event.clientX,originY=event.clientY;
    const initialX=node.x,initialY=node.y;
    const target=event.currentTarget;
    target.setPointerCapture(event.pointerId);
    onSelect(node.id);
    const move=(ev:globalThis.PointerEvent)=>{
      const x=Math.round(Math.min(440-node.width,Math.max(0,initialX+(ev.clientX-originX)/scale)));
      const y=Math.round(Math.min(template.canvasHeight-node.height,Math.max(0,initialY+(ev.clientY-originY)/scale)));
      onMove(node.id,x,y);
    };
    const finish=()=>{
      target.removeEventListener("pointermove",move);
      target.removeEventListener("pointerup",finish);
      target.removeEventListener("pointercancel",finish);
    };
    target.addEventListener("pointermove",move);
    target.addEventListener("pointerup",finish);
    target.addEventListener("pointercancel",finish);
  }
  function handleKey(event:KeyboardEvent<HTMLDivElement>,node:StudioElement){
    if(!editable||!onMove||!onSelect)return;
    const delta=event.shiftKey?10:1;
    const movement:Record<string,[number,number]>={ArrowLeft:[-delta,0],ArrowRight:[delta,0],ArrowUp:[0,-delta],ArrowDown:[0,delta]};
    const d=movement[event.key];
    if(!d)return;
    event.preventDefault();
    onSelect(node.id);
    onMove(node.id,Math.max(0,Math.min(440-node.width,node.x+d[0])),Math.max(0,Math.min(template.canvasHeight-node.height,node.y+d[1])));
  }
  return <div className="studio-preview-viewport" style={{width:viewport,height:Math.ceil(template.canvasHeight*scale)}}>
    <div className="studio-render-surface" style={{width:440,height:template.canvasHeight,transform:`scale(${scale})`,background:template.background}}>
      {template.elements.map(node=>{
        const style:CSSProperties={left:node.x,top:node.y,width:node.width,height:node.height,opacity:node.opacity,
          backgroundColor:node.type==="image"?"transparent":node.background,color:node.color,borderRadius:node.radius,
          fontFamily:node.fontFamily==="serif"?"Georgia, serif":"Arial, sans-serif",
          fontSize:node.fontSize,fontWeight:Number(node.fontWeight),textAlign:node.textAlign};
        return <div key={node.id} data-studio-node={node.id}
          className={`studio-render-node studio-node-${node.type}${editable&&selectedId===node.id?" is-selected":""}`}
          style={style} role={editable?"button":undefined} tabIndex={editable?0:undefined}
          aria-label={editable?`Элемент: ${node.text||node.type}. Стрелки — перемещение`:undefined}
          onClick={editable?()=>onSelect?.(node.id):undefined}
          onPointerDown={event=>handlePointerDown(event,node)}
          onKeyDown={event=>handleKey(event,node)}>
          {node.type==="image" ? (node.imageSrc ?
            <Image src={node.imageSrc} alt="" fill sizes="440px" draggable={false} style={{objectFit:"cover",borderRadius:node.radius}}/> :
            <span className="studio-image-empty">Фото</span>) :
            node.type==="shape"?null:<span>{elementText(node)}</span>}
        </div>;
      })}
    </div>
  </div>;
}
