"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft, Check, ChevronDown, Download, Grid2X2, Hand, Layers3, Maximize,
  Minus, MousePointer2, Move, Plus, Ruler, Undo2, Redo2, Smartphone, PanelLeftClose, PanelRightClose, Map as MapIcon,
} from "lucide-react";
import type { Locale } from "@/i18n/locales";
import { StudioV2Artboard } from "./studio-v2-artboard";
import { createStudioV2Demo } from "@/features/studio-v2/demo-project";
import { createEditorSession, dispatchStudioCommand, beginStudioTransaction, commitStudioTransaction, cancelStudioTransaction, undoStudio, redoStudio, type StudioEditorSession } from "@/features/studio-v2/core/command-engine.ts";
import { type ProjectDocumentV2, type StudioPageV2 } from "@/features/studio-v2/core/document.schema.ts";
import {
  clamp, fitBounds, minimapProjection, panViewport, RULER_THICKNESS,
  rulerMarks, screenToWorld, unionRects, zoomAt, worldToScreen, type Point, type Rect, type Size, type Viewport,
} from "@/features/studio-v2/core/viewport.ts";

import { canSelect, normalizeSelection, selectNode, nodeCorners, nodeBounds, selectionBounds, moveSelection, resizeNode, rotateNode, marqueeSelection, snapMove, groupSelection, ungroupSelection, type Handle } from "@/features/studio-v2/core/selection-transform.ts";

type Tool = "select" | "hand";
type NodeGesture = { pointer:number; start:Point; document:ProjectDocumentV2; ids:string[]; started:boolean; handle?:Handle; rotate?:boolean; zoom:number; };
type Marquee = { pointer:number; start:Point; current:Point; pageId:string; additive:boolean };
function rectBetween(a:Point,b:Point):Rect{return {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),width:Math.abs(a.x-b.x),height:Math.abs(a.y-b.y)};}
function nodeLabel(doc:ProjectDocumentV2,id:string){
 const node=doc.nodes[id];if(!node)return id;
 if(node.type==="frame")return node.name;
 if(node.type==="text")return node.runs.map(r=>r.text).join("").slice(0,40)||"Текст";
 if(node.type==="image")return doc.assets[node.assetId]?.name??"Фото";
 return "Фигура";
}
function LayerRows({document,ids,selected,onSelect,depth=0}:{document:ProjectDocumentV2;ids:string[];selected:string[];onSelect:(id:string,add:boolean)=>void;depth?:number}){
 return <>{[...ids].reverse().map(id=>{
  const n=document.nodes[id];if(!n)return null;
  return <div key={id}><button className="v2-layer-row" style={{paddingLeft:12+depth*14}} aria-pressed={selected.includes(id)} disabled={!canSelect(document,id)} onClick={e=>onSelect(id,e.shiftKey)}><span>{n.type==="frame"?"▣":n.type==="text"?"T":n.type==="image"?"▧":"◇"}</span><span>{nodeLabel(document,id)}</span></button>{n.type==="frame"&&<LayerRows document={document} ids={n.children} selected={selected} onSelect={onSelect} depth={depth+1}/>}</div>
 })}</>;
}
const clampZoom = (zoom: number) => clamp(zoom, 0.025, 3);
const initialViewport: Viewport = { x: 150, y: 120, zoom: .25 };
function pageRect(document: ProjectDocumentV2, page: StudioPageV2): Rect {
  const root = document.nodes[page.rootNodeId];
  return { x: page.placement.x, y: page.placement.y, width: root.width, height: root.height };
}
function downloadDocument(project: ProjectDocumentV2) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "invito-studio-v2-demo.json";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}
function Rulers({viewport, size}:{viewport:Viewport;size:Size}) {
  const xMarks = rulerMarks(viewport, size, "x");
  const yMarks = rulerMarks(viewport, size, "y");
  const t = RULER_THICKNESS;
  return <div className="v2-rulers" aria-hidden="true">
    <div className="v2-ruler-corner" style={{ width:t,height:t }}/>
    <svg className="v2-ruler-top" width={size.width} height={t} style={{left:t,top:0}}>
      {xMarks.map(mark=><g key={mark.value} transform={`translate(${mark.position},0)`}>
        <line x1={0} y1={9} x2={0} y2={t} stroke="#929BAA" strokeWidth={1}/>
        <text x={3} y={8} fontSize={8.5} fill="#737D8B">{mark.value}</text>
      </g>)}
    </svg>
    <svg className="v2-ruler-left" width={t} height={size.height} style={{left:0,top:t}}>
      {yMarks.map(mark=><g key={mark.value} transform={`translate(0,${mark.position})`}>
        <line x1={9} y1={0} x2={t} y2={0} stroke="#929BAA" strokeWidth={1}/>
        <text x={3} y={-3} fontSize={8.5} fill="#737D8B" transform="rotate(-90)">{mark.value}</text>
      </g>)}
    </svg>
  </div>;
}
function MiniMap({frames, viewport, size, onCenter}:{
  frames:Rect[];viewport:Viewport;size:Size;onCenter:(world:Point)=>void;
}) {
  const mapSize={width:188,height:122};
  const projection=minimapProjection(frames,viewport,size,mapSize);
  function click(event:React.MouseEvent<HTMLDivElement>){
    const rect=event.currentTarget.getBoundingClientRect();
    onCenter(projection.unproject({x:event.clientX-rect.left,y:event.clientY-rect.top}));
  }
  return <div className="v2-minimap" role="button" tabIndex={0} aria-label="Мини-карта проекта. Кликните для перехода"
    onClick={click} onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();onCenter({x:projection.scene.x+projection.scene.width/2,y:projection.scene.y+projection.scene.height/2})}}}>
    <div className="v2-minimap-title"><MapIcon size={13}/> Навигатор</div>
    <div className="v2-minimap-surface" style={{width:mapSize.width,height:mapSize.height}}>
      {projection.artboards.map((frame,index)=><div key={index} className="v2-mini-frame" style={{
        left:frame.x,top:frame.y,width:Math.max(2,frame.width),height:Math.max(2,frame.height)
      }}/>)}
      <div className="v2-mini-visible" style={{
        left:projection.viewport.x,top:projection.viewport.y,
        width:projection.viewport.width,height:projection.viewport.height
      }}/>
    </div>
  </div>;
}
export function StudioV2Workspace({locale}:{locale:Locale}) {
  const [session,setSession]=useState<StudioEditorSession>(()=>createEditorSession(createStudioV2Demo()));
  const [selectedPage,setSelectedPage]=useState<string|null>("page-1");
  const [selectedIds,setSelectedIds]=useState<string[]>([]);
  const [selectionError,setSelectionError]=useState<string|null>(null);
  const [marquee,setMarquee]=useState<Rect|null>(null);
  const [guides,setGuides]=useState<{guideX?:number;guideY?:number}>({});
  const nodeGesture=useRef<NodeGesture|null>(null);
  const marqueeGesture=useRef<Marquee|null>(null);
  const touchTap=useRef<{pointer:number;start:Point;id:string;pageId:string}|null>(null);
  const [tool,setTool]=useState<Tool>("select");
  const [spaceHeld,setSpaceHeld]=useState(false);
  const [viewport,setViewport]=useState<Viewport>(initialViewport);
  const [size,setSize]=useState<Size>({width:900,height:650});
  const [grid,setGrid]=useState(true);
  const [rulers,setRulers]=useState(true);
  const [leftOpen,setLeftOpen]=useState(false);
  const [rightOpen,setRightOpen]=useState(false);
  const [minimapOpen,setMinimapOpen]=useState(true);
  const stageRef=useRef<HTMLDivElement>(null);
  const pointerMap=useRef<Map<number,Point>>(new Map());
  const panPointer=useRef<{pointer:number;last:Point}|null>(null);
  const pinch=useRef<{distance:number;zoom:number;anchorWorld:Point}|null>(null);
  const pageDrag=useRef<{id:string;start:Point;origin:Point;started:boolean;pointer:number}|null>(null);
  const fitted=useRef(false);
  const document=session.document;
  const frames=useMemo(()=>document.pages.map(page=>pageRect(document,page)),[document]);
  const activeTool=spaceHeld?"hand":tool;
  const selected=document.pages.find(p=>p.id===selectedPage)??null;
  const selectedRoot=selected?document.nodes[selected.rootNodeId]:null;
  const nodeIds=normalizeSelection(document,selectedIds);
  const activeNode=nodeIds.length===1?document.nodes[nodeIds[0]]:null;
  const selectionRect=nodeIds.length?selectionBounds(document,nodeIds):null;
  const selectionPolygon=activeNode?nodeCorners(document,activeNode.id):selectionRect?[{x:selectionRect.x,y:selectionRect.y},{x:selectionRect.x+selectionRect.width,y:selectionRect.y},{x:selectionRect.x+selectionRect.width,y:selectionRect.y+selectionRect.height},{x:selectionRect.x,y:selectionRect.y+selectionRect.height}]:[];
  const selectionScreen=selectionPolygon.map(p=>worldToScreen(p,viewport));
  function chooseNode(id:string,add=false){
    setSelectionError(null);setSelectedIds(ids=>selectNode(document,ids,id,add));
  }
  function performGroup(){
    const id="group-"+crypto.randomUUID();
    try{const commands=groupSelection(document,nodeIds,id);setSession(s=>dispatchStudioCommand(s,commands));setSelectedIds([id]);setSelectionError(null);}catch{setSelectionError("Для группы выберите соседние слои одного свободного фрейма.");}
  }
  function performUngroup(){
    if(!activeNode||activeNode.type!=="frame")return;
    try{const commands=ungroupSelection(document,activeNode.id);setSession(s=>dispatchStudioCommand(s,commands));setSelectedIds(activeNode.children);setSelectionError(null);}catch{setSelectionError("Разгруппировка недоступна для этого фрейма.");}
  }
  const inset=rulers?RULER_THICKNESS:0;
  const sceneSize={width:Math.max(1,size.width-inset),height:Math.max(1,size.height-inset)};

  useEffect(()=>{
    const stage=stageRef.current;
    if(!stage)return;
    const observer=new ResizeObserver(entries=>{
      const rect=entries[0]?.contentRect;
      if(!rect)return;
      const next={width:rect.width,height:rect.height};
      setSize(next);
      if(!fitted.current&&rect.width>100&&rect.height>100){
        fitted.current=true;
        const initial=rect.width<640?frames.slice(0,1):frames.slice(0,3);
        setViewport(fitBounds(unionRects(initial),{width:rect.width-14,height:rect.height-14},rect.width<640?24:55));
      }
    });
    observer.observe(stage);
    return()=>observer.disconnect();
    // Fit only once: later edits must not reset the user's camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{
    function down(e:KeyboardEvent){
      const target=e.target as HTMLElement|null;
      if(target?.closest("input,textarea,select,[contenteditable=true]"))return;
      if(e.code==="Space"){e.preventDefault();setSpaceHeld(true);return}
      if(e.key.toLowerCase()==="v"&&!e.metaKey&&!e.ctrlKey)setTool("select");
      if(e.key.toLowerCase()==="h"&&!e.metaKey&&!e.ctrlKey)setTool("hand");
      if(e.key==="Escape"){setSelectedIds([]);setSelectedPage(null);setLeftOpen(false);setRightOpen(false);if(nodeGesture.current){nodeGesture.current=null;setSession(s=>s.transaction?cancelStudioTransaction(s):s);setGuides({});}marqueeGesture.current=null;setMarquee(null);return;}
      if(nodeGesture.current||pageDrag.current)return;
      if(nodeIds.length&&["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){
        e.preventDefault();const step=e.shiftKey?10:1;
        const delta={x:e.key==="ArrowLeft"?-step:e.key==="ArrowRight"?step:0,y:e.key==="ArrowUp"?-step:e.key==="ArrowDown"?step:0};
        setSession(s=>dispatchStudioCommand(s,moveSelection(s.document,nodeIds,delta)));return;
      }
      if(nodeIds.length&&(e.key==="Delete"||e.key==="Backspace")){
        e.preventDefault();setSession(s=>dispatchStudioCommand(s,nodeIds.map(id=>({kind:"deleteNode" as const,id}))));setSelectedIds([]);return;
      }
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){
        e.preventDefault();setSession(s=>s.transaction?s:e.shiftKey?redoStudio(s):undoStudio(s));
      }
    }
    const up=(e:KeyboardEvent)=>{if(e.code==="Space")setSpaceHeld(false)};
    const blur=()=>setSpaceHeld(false);
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur)};
  },[nodeIds]);
  function zoomTo(value:number, screenAnchor:Point={x:sceneSize.width/2,y:sceneSize.height/2}){
    setViewport(v=>zoomAt(v,clampZoom(value),screenAnchor));
  }
  function fitAll(){
    setViewport(fitBounds(unionRects(frames),sceneSize,size.width<640?20:50));
  }
  function center(world:Point){
    setViewport(v=>({...v,x:sceneSize.width/2-world.x*v.zoom,y:sceneSize.height/2-world.y*v.zoom}));
  }
  function focusPage(page:StudioPageV2){
    setSelectedPage(page.id);setSelectedIds([]);
    const rect=pageRect(document,page);
    center({x:rect.x+rect.width/2,y:rect.y+rect.height/2});
    setLeftOpen(false);
  }
  function addPage(){
    const root=document.nodes[document.pages[0].rootNodeId];
    if(root.type!=="frame"||document.pages.length>=30)return;
    const name="Новая страница "+(document.pages.length+1);
    const key="new-"+Math.random().toString(36).slice(2,10);
    const x=Math.max(...frames.map(r=>r.x+r.width))+200;
    const page={id:"page-"+key,rootNodeId:"frame-"+key,name,placement:{x,y:0}};
    setSession(s=>dispatchStudioCommand(s,{kind:"createPage",page,root:{
      ...root,id:page.rootNodeId,children:[],name
    }}));
    setSelectedPage(page.id);setSelectedIds([]);
    setViewport(v=>({...v,x:sceneSize.width/2-(x+root.width/2)*v.zoom,y:sceneSize.height/2-root.height/2*v.zoom}));
  }
  function startPageDrag(e:ReactPointerEvent<HTMLButtonElement>,page:StudioPageV2){
    if(activeTool!=="select"||e.button!==0)return;
    e.stopPropagation();setSelectedPage(page.id);setSelectedIds([]);
    pageDrag.current={id:page.id,start:{x:e.clientX,y:e.clientY},origin:{...page.placement},started:false,pointer:e.pointerId};
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function updatePageDrag(e:ReactPointerEvent<HTMLButtonElement>){
    const drag=pageDrag.current;
    if(!drag||drag.pointer!==e.pointerId)return;
    const dx=e.clientX-drag.start.x,dy=e.clientY-drag.start.y;
    if(!drag.started&&Math.hypot(dx,dy)<5)return;
    if(!drag.started){drag.started=true;setSession(s=>beginStudioTransaction(s,"Перемещение страницы"))}
    setSession(s=>dispatchStudioCommand(s,{
      kind:"movePage",id:drag.id,
      placement:{x:Math.round(drag.origin.x+dx/viewport.zoom),y:Math.round(drag.origin.y+dy/viewport.zoom)}
    }));
  }
  function endPageDrag(e:ReactPointerEvent<HTMLButtonElement>){
    const drag=pageDrag.current;
    if(!drag||drag.pointer!==e.pointerId)return;
    pageDrag.current=null;
    if(drag.started)setSession(s=>commitStudioTransaction(s));
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function localPoint(e:{clientX:number;clientY:number}):Point {
    const rect=stageRef.current?.getBoundingClientRect();
    return {x:e.clientX-(rect?.left??0)-inset,y:e.clientY-(rect?.top??0)-inset};
  }
  function distance(a:Point,b:Point){return Math.hypot(a.x-b.x,a.y-b.y)}
  function middle(a:Point,b:Point){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
  function startNodeGesture(e:ReactPointerEvent<HTMLElement>,ids:string[],handle?:Handle,rotate=false){
    nodeGesture.current={pointer:e.pointerId,start:localPoint(e),document,ids,started:false,handle,rotate,zoom:viewport.zoom};
    stageRef.current?.setPointerCapture(e.pointerId);
  }
  function stagePointerDown(e:ReactPointerEvent<HTMLDivElement>){
    const local=localPoint(e);
    const target=e.target as Element;
    if(target.closest("button,.v2-minimap"))return;
    const hit=target.closest<HTMLElement>("[data-studio-node]");
    const pageHit=target.closest<HTMLElement>("[data-studio-page]");
    const id=hit?.dataset.studioNode,pageId=pageHit?.dataset.studioPage;
    if(e.pointerType==="touch"&&activeTool==="select"&&id&&pageId&&canSelect(document,id))touchTap.current={pointer:e.pointerId,start:local,id,pageId};
    if(e.pointerType!=="touch"&&e.button===0&&activeTool==="select"){
      if(id&&canSelect(document,id)){
        if(pageId)setSelectedPage(pageId);
        const ids=e.shiftKey?selectNode(document,nodeIds,id,true):nodeIds.includes(id)?nodeIds:[id];
        setSelectionError(null);setSelectedIds(ids);
        if(ids.includes(id))startNodeGesture(e,ids);
        return;
      }
      if(pageId){
        setSelectedPage(pageId);if(!e.shiftKey)setSelectedIds([]);
        marqueeGesture.current={pointer:e.pointerId,start:local,current:local,pageId,additive:e.shiftKey};
        e.currentTarget.setPointerCapture(e.pointerId);return;
      }
      if(!e.shiftKey)setSelectedIds([]);
    }
    if(e.pointerType==="touch"){
      pointerMap.current.set(e.pointerId,local);
      e.currentTarget.setPointerCapture(e.pointerId);
      const entries=[...pointerMap.current.values()];
      if(entries.length===2){
        touchTap.current=null;
        const m=middle(entries[0],entries[1]);
        pinch.current={distance:Math.max(1,distance(entries[0],entries[1])),zoom:viewport.zoom,anchorWorld:screenToWorld(m,viewport)};
        panPointer.current=null;
      }else if(entries.length===1)panPointer.current={pointer:e.pointerId,last:local};
      return;
    }
    if(e.button!==0&&e.button!==1)return;
    const onEmpty=e.target===e.currentTarget||(e.target as HTMLElement).classList.contains("v2-stage-background");
    if(activeTool==="hand"||onEmpty||e.button===1){
      panPointer.current={pointer:e.pointerId,last:local};
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }
  function stagePointerMove(e:ReactPointerEvent<HTMLDivElement>){
    const local=localPoint(e);
    if(touchTap.current?.pointer===e.pointerId&&distance(local,touchTap.current.start)>5)touchTap.current=null;
    const drag=nodeGesture.current;
    if(drag?.pointer===e.pointerId){
      const delta={x:(local.x-drag.start.x)/drag.zoom,y:(local.y-drag.start.y)/drag.zoom};
      if(!drag.started&&distance(local,drag.start)<4)return;
      if(!drag.started){drag.started=true;setSession(s=>beginStudioTransaction(s,"Трансформация слоя"));}
      if(drag.rotate){
        const id=drag.ids[0],b=nodeBounds(drag.document,id),center=worldToScreen({x:b.x+b.width/2,y:b.y+b.height/2},viewport);
        const angle=(Math.atan2(local.y-center.y,local.x-center.x)-Math.atan2(drag.start.y-center.y,drag.start.x-center.x))*180/Math.PI+drag.document.nodes[id].rotation;
        setSession(s=>dispatchStudioCommand(s,rotateNode(drag.document,id,e.shiftKey?Math.round(angle/15)*15:angle)));
      }else if(drag.handle){
        const command=resizeNode(drag.document,drag.ids[0],drag.handle,delta,e.shiftKey);
        setSession(s=>dispatchStudioCommand(s,command));
      }else{
        const snapped=e.altKey?{delta,guideX:undefined,guideY:undefined}:snapMove(drag.document,drag.ids,delta,drag.zoom);
        setGuides({guideX:snapped.guideX,guideY:snapped.guideY});
        setSession(s=>dispatchStudioCommand(s,moveSelection(drag.document,drag.ids,snapped.delta)));
      }
      return;
    }
    const box=marqueeGesture.current;
    if(box?.pointer===e.pointerId){box.current=local;setMarquee(rectBetween(box.start,local));return;}
    if(e.pointerType==="touch"&&pointerMap.current.has(e.pointerId)){
      pointerMap.current.set(e.pointerId,local);
      const points=[...pointerMap.current.values()];
      if(points.length>=2&&pinch.current){
        const centerPoint=middle(points[0],points[1]);
        const nextZoom=clampZoom(pinch.current.zoom*distance(points[0],points[1])/pinch.current.distance);
        const anchor=pinch.current.anchorWorld;
        setViewport({zoom:nextZoom,x:centerPoint.x-anchor.x*nextZoom,y:centerPoint.y-anchor.y*nextZoom});
        return;
      }
    }
    if(panPointer.current?.pointer===e.pointerId){
      const last=panPointer.current.last;
      setViewport(v=>panViewport(v,{x:local.x-last.x,y:local.y-last.y}));
      panPointer.current.last=local;
    }
  }
  function stagePointerUp(e:ReactPointerEvent<HTMLDivElement>){
    const drag=nodeGesture.current;
    if(drag?.pointer===e.pointerId){
      nodeGesture.current=null;setGuides({});
      if(drag.started)setSession(s=>s.transaction?(e.type==="pointercancel"?cancelStudioTransaction(s):commitStudioTransaction(s)):s);
    }
    const box=marqueeGesture.current;
    if(box?.pointer===e.pointerId){
      marqueeGesture.current=null;setMarquee(null);
      if(e.type!=="pointercancel"&&distance(box.start,box.current)>=4){
        const page=document.pages.find(p=>p.id===box.pageId);
        if(page){const ids=marqueeSelection(document,page.rootNodeId,rectBetween(screenToWorld(box.start,viewport),screenToWorld(box.current,viewport)));setSelectedIds(old=>normalizeSelection(document,box.additive?[...old,...ids]:ids));}
      }
    }
    const tap=touchTap.current;
    if(tap?.pointer===e.pointerId){touchTap.current=null;if(e.type!=="pointercancel"){setSelectedPage(tap.pageId);chooseNode(tap.id);}}
    pointerMap.current.delete(e.pointerId);
    if(panPointer.current?.pointer===e.pointerId)panPointer.current=null;
    if(pointerMap.current.size<2)pinch.current=null;
    if(pointerMap.current.size===1){
      const [pointer,last]=[...pointerMap.current.entries()][0];
      panPointer.current={pointer,last};
    }
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function stageWheel(e:ReactWheelEvent<HTMLDivElement>){
    e.preventDefault();
    if(nodeGesture.current||marqueeGesture.current)return;
    if(e.ctrlKey||e.metaKey){
      const anchor=localPoint(e);
      setViewport(v=>zoomAt(v,v.zoom*Math.exp(-e.deltaY*.008),anchor));
    }else{
      setViewport(v=>panViewport(v,{x:-e.deltaX-(e.shiftKey?e.deltaY:0),y:e.shiftKey?0:-e.deltaY}));
    }
  }
  function moveSelected(axis:"x"|"y",delta:number){
    if(!selected)return;
    setSession(s=>dispatchStudioCommand(s,{kind:"movePage",id:selected.id,placement:{
      ...selected.placement,[axis]:selected.placement[axis]+delta,
    }}));
  }
  const zoomPercent=Math.round(viewport.zoom*100);
  const gridWorld=viewport.zoom<.3?100:40;
  const backgroundStyle:CSSProperties={
    backgroundSize:`${gridWorld*viewport.zoom}px ${gridWorld*viewport.zoom}px`,
    backgroundPosition:`${viewport.x}px ${viewport.y}px`,
  };
  return <main className="studio-v2" lang={locale}>
    <header className="v2-topbar">
      <div className="v2-brand">
        <Link href={`/${locale}`} aria-label="На главную"><ArrowLeft size={16}/></Link>
        <strong>INVITO <span>Studio 2.0</span></strong>
        <span className="v2-project-title">Свадебная коллекция <ChevronDown size={13}/></span>
        <span className="v2-draft-state">Демо · без сохранения</span>
      </div>
      <div className="v2-tools" role="toolbar" aria-label="Инструменты холста">
        <button aria-label="Выделение (V)" title="Выделение (V)" aria-pressed={activeTool==="select"} onClick={()=>setTool("select")}><MousePointer2 size={19}/></button>
        <button aria-label="Рука (H или пробел)" title="Рука (H или пробел)" aria-pressed={activeTool==="hand"} onClick={()=>setTool("hand")}><Hand size={19}/></button>
        <span className="v2-top-divider"/>
        <button title="Показать или скрыть сетку" aria-label="Сетка" aria-pressed={grid} onClick={()=>setGrid(v=>!v)}><Grid2X2 size={18}/></button>
        <button title="Тонкие линейки" aria-label="Линейки" aria-pressed={rulers} onClick={()=>setRulers(v=>!v)}><Ruler size={18}/></button>
      </div>
      <div className="v2-top-actions">
        <button title="Отменить" aria-label="Отменить" disabled={!session.undoStack.length} onClick={()=>setSession(s=>s.transaction?s:undoStudio(s))}><Undo2 size={18}/></button>
        <button title="Повторить" aria-label="Повторить" disabled={!session.redoStack.length} onClick={()=>setSession(s=>s.transaction?s:redoStudio(s))}><Redo2 size={18}/></button>
        <button className="v2-export" onClick={()=>downloadDocument(document)}><Download size={16}/> JSON</button>
        <span className="v2-stage-tag"><Check size={13}/> Функциональный прототип</span>
      </div>
    </header>
    <div className="v2-body">
      <aside className={`v2-left ${leftOpen?"is-open":""}`} aria-label="Страницы и библиотека">
        <div className="v2-sidebar-tabs"><strong>Страницы</strong><span>Слои</span><span>Ресурсы</span></div>
        <div className="v2-sidebar-heading"><strong>Страницы <small>{document.pages.length}</small></strong>
          <button title="Добавить страницу" aria-label="Добавить страницу" onClick={addPage} disabled={document.pages.length>=30}><Plus size={18}/></button>
        </div>
        <div className="v2-page-list">{document.pages.map((page,index)=>{
          const background=document.nodes[page.rootNodeId];
          return <button className={`v2-page-item ${selectedPage===page.id?"is-selected":""}`} key={page.id} onClick={()=>focusPage(page)}>
            <span className="v2-page-index">{index+1}</span>
            <span className="v2-page-thumbnail" style={{background:background.type==="frame"?background.background:"#FFF"}}>
              <span>{page.name==="Обложка"?"А & Т":page.name==="RSVP"?"RSVP":page.name.slice(0,1)}</span>
            </span>
            <span>{page.name}</span>
          </button>;
        })}</div>
        <div className="v2-sidebar-section">
          <div className="v2-sidebar-heading"><strong>Слои {selected?.name}</strong></div>
          {selectedRoot?.type==="frame"&&<LayerRows document={document} ids={selectedRoot.children} selected={nodeIds} onSelect={chooseNode}/>}
        </div>
        <div className="v2-sidebar-tip"><Move size={17}/> <span>Перетаскивайте название страницы над фреймом, чтобы изменить расположение.</span></div>
      </aside>
      <section className="v2-workspace" aria-label="Бесконечная рабочая область">
        <div className="v2-mobile-panel-controls">
          <button aria-label="Открыть страницы" onClick={()=>setLeftOpen(v=>!v)}><Layers3 size={18}/> Страницы</button>
          <button aria-label="Открыть свойства" onClick={()=>setRightOpen(v=>!v)}>Свойства</button>
        </div>
        <div ref={stageRef} className={`v2-stage ${activeTool==="hand"?"is-hand":""}`}
          onPointerDown={stagePointerDown} onPointerMove={stagePointerMove}
          onPointerUp={stagePointerUp} onPointerCancel={stagePointerUp} onWheel={stageWheel}>
          <div className="v2-stage-background" style={grid?backgroundStyle:undefined}/>
          <div className="v2-stage-inner" style={{left:inset,top:inset}}>
            <div className="v2-world" style={{
              transform:`translate3d(${viewport.x}px,${viewport.y}px,0) scale(${viewport.zoom})`,
            }}>
              {document.pages.map(page=>{
                const root=document.nodes[page.rootNodeId];
                return <div key={page.id} data-studio-page={page.id} className={`v2-frame ${selectedPage===page.id?"is-selected":""}`}
                  style={{left:page.placement.x,top:page.placement.y,width:root.width,height:root.height}}
                  >
                  <StudioV2Artboard document={document} rootNodeId={page.rootNodeId}/>
                </div>;
              })}
            </div>
            {selectionScreen.length>0&&<svg className="v2-selection-outline" width={sceneSize.width} height={sceneSize.height} aria-hidden="true"><polygon points={selectionScreen.map(p=>p.x+","+p.y).join(" ")} fill="none" stroke="#2549d9" strokeWidth="1.5"/></svg>}
            {activeNode&&activeTool==="select"&&selectionScreen.map((point,index)=><button key={index} className="v2-transform-handle" aria-label={"Изменить размер "+["NW","NE","SE","SW"][index]} style={{left:point.x,top:point.y}} onPointerDown={e=>{e.stopPropagation();if(e.button===0)startNodeGesture(e,[activeNode.id],(["nw","ne","se","sw"] as const)[index]);}}/>)}
            {activeNode&&activeTool==="select"&&selectionScreen.length===4&&<button className="v2-transform-rotate" aria-label="Вращение" style={{left:(selectionScreen[0].x+selectionScreen[1].x)/2,top:(selectionScreen[0].y+selectionScreen[1].y)/2-24}} onPointerDown={e=>{e.stopPropagation();if(e.button===0)startNodeGesture(e,[activeNode.id],undefined,true);}}>↻</button>}
            {marquee&&<div className="v2-marquee" style={{left:marquee.x,top:marquee.y,width:marquee.width,height:marquee.height}}/>}
            {guides.guideX!==undefined&&<div className="v2-guide v2-guide-x" style={{left:guides.guideX*viewport.zoom+viewport.x}}/>}
            {guides.guideY!==undefined&&<div className="v2-guide v2-guide-y" style={{top:guides.guideY*viewport.zoom+viewport.y}}/>}
            {document.pages.map(page=>{
              const rect=pageRect(document,page);
              const point={x:rect.x*viewport.zoom+viewport.x,y:rect.y*viewport.zoom+viewport.y};
              return <button key={page.id} className={`v2-frame-label ${selectedPage===page.id?"is-selected":""}`}
                style={{left:point.x,top:point.y-28,width:Math.max(110,rect.width*viewport.zoom)}}
                title="Перетащите название, чтобы переместить страницу"
                onPointerDown={e=>startPageDrag(e,page)}
                onPointerMove={updatePageDrag} onPointerUp={endPageDrag} onPointerCancel={endPageDrag}
                onClick={()=>setSelectedPage(page.id)}>
                {page.name} <small>{rootSizeLabel(document,page)}</small>
              </button>;
            })}
          </div>
          {rulers&&<Rulers viewport={viewport} size={sceneSize}/>}
          <div className="v2-canvas-actions">
            <button onClick={()=>setViewport(v=>zoomAt(v,v.zoom/1.25,{x:sceneSize.width/2,y:sceneSize.height/2}))} aria-label="Уменьшить масштаб"><Minus size={16}/></button>
            <span>{zoomPercent}%</span>
            <button onClick={()=>setViewport(v=>zoomAt(v,v.zoom*1.25,{x:sceneSize.width/2,y:sceneSize.height/2}))} aria-label="Увеличить масштаб"><Plus size={16}/></button>
            <button onClick={fitAll} aria-label="Показать все страницы" title="Все страницы"><Maximize size={16}/></button>
          </div>
          <div className="v2-viewport-hint">Колесо — перемещение · Ctrl/⌘ + колесо — масштаб · два пальца — масштаб и перемещение</div>
          <button className="v2-minimap-toggle" onClick={()=>setMinimapOpen(v=>!v)} aria-label="Показать или скрыть мини-карту" aria-expanded={minimapOpen}><MapIcon size={17}/></button>
          {minimapOpen&&<MiniMap frames={frames} viewport={viewport} size={sceneSize} onCenter={center}/>}
        </div>
      </section>
      <aside className={`v2-right ${rightOpen?"is-open":""}`} aria-label="Свойства выбранной страницы">
        <div className="v2-sidebar-tabs"><strong>Дизайн</strong><span>Прототип</span><span>Анимация</span></div>
        <section className="v2-inspector-section">
          <h3>Рабочая область</h3>
          <div className="v2-info-row"><span>Масштаб</span><strong>{zoomPercent}%</strong></div>
          <div className="v2-info-row"><span>Страниц</span><strong>{document.pages.length}</strong></div>
          <div className="v2-info-row"><span>Инструмент</span><strong>{activeTool==="hand"?"Рука":"Выделение"}</strong></div>
          <button className="v2-inspector-button" onClick={fitAll}><Maximize size={15}/> Показать весь проект</button>
        </section>
        <section className="v2-inspector-section">
          <h3>Выделение</h3>
          {selectionError&&<p role="alert" className="v2-placeholder">{selectionError}</p>}
          {nodeIds.length>0?<><strong className="v2-selected-name">{activeNode?nodeLabel(document,activeNode.id):nodeIds.length+" слоёв"}</strong>
          {activeNode&&<div className="v2-inspector-grid">{(["x","y","width","height","rotation"] as const).map(key=><label key={key}>{({x:"X",y:"Y",width:"W",height:"H",rotation:"°"})[key]}<input type="number" value={Math.round(activeNode[key]*100)/100} onChange={e=>{const v=Number(e.target.value);if(!Number.isFinite(v)||e.target.value==="")return;const valid=key==="width"||key==="height"?v>=1&&v<=20000:key==="rotation"?Math.abs(v)<=360:Math.abs(v)<=1e6;if(valid)setSession(s=>dispatchStudioCommand(s,{kind:"updateNode",id:activeNode.id,changes:{[key]:v}}));}}/></label>)}</div>}
          {nodeIds.length>1&&<button className="v2-inspector-button" onClick={performGroup}>Группировать</button>}
          {activeNode?.type==="frame"&&activeNode.background==="transparent"&&<button className="v2-inspector-button" onClick={performUngroup}>Разгруппировать</button>}
          <button className="v2-inspector-button" onClick={()=>setSelectedIds([])}>Снять выделение</button></>:<p className="v2-placeholder">Выберите слой на холсте или в списке. Shift — несколько слоёв.</p>}
        </section>
        <section className="v2-inspector-section">
          <h3>Страница</h3>
          {selected&&selectedRoot?<>
            <strong className="v2-selected-name">{selected.name}</strong>
            <div className="v2-inspector-grid">
              <label>X<input type="number" value={Math.round(selected.placement.x)} onChange={e=>{
                const x=Number(e.target.value);
                if(Number.isFinite(x)&&Math.abs(x)<=1_000_000)setSession(s=>dispatchStudioCommand(s,{kind:"movePage",id:selected.id,placement:{...selected.placement,x}}));
              }}/></label>
              <label>Y<input type="number" value={Math.round(selected.placement.y)} onChange={e=>{
                const y=Number(e.target.value);
                if(Number.isFinite(y)&&Math.abs(y)<=1_000_000)setSession(s=>dispatchStudioCommand(s,{kind:"movePage",id:selected.id,placement:{...selected.placement,y}}));
              }}/></label>
              <label>W<input value={selectedRoot.width} readOnly/></label>
              <label>H<input value={selectedRoot.height} readOnly/></label>
            </div>
            <div className="v2-info-row"><span>Цвет бумаги</span><span className="v2-paper-swatch" style={{background:selectedRoot.type==="frame"?selectedRoot.background:"#FFFFFF"}}/></div>
            <div className="v2-nudge">
              <button onClick={()=>moveSelected("x",-100)}>← 100</button>
              <button onClick={()=>moveSelected("x",100)}>100 →</button>
            </div>
          </>:<p className="v2-placeholder">Выберите страницу на холсте или слева.</p>}
        </section>
        <section className="v2-inspector-section v2-phase-note">
          <h3>Этап #23 · Transform</h3>
          <p>Выберите объект, затем перетащите его или угловые маркеры. Shift — точные углы и сохранение пропорций, Alt — отключение привязки.</p>
          <p>Это демонстрационный документ: изменения не публикуются и не сохраняются на сервере.</p>
        </section>
      </aside>
    </div>
    {(leftOpen||rightOpen)&&<button className="v2-backdrop" onClick={()=>{setLeftOpen(false);setRightOpen(false)}} aria-label="Закрыть панель"/>}
  </main>;
}
function rootSizeLabel(document: ProjectDocumentV2,page:StudioPageV2){
  const root=document.nodes[page.rootNodeId];
  return `${root.width} × ${root.height}`;
}
