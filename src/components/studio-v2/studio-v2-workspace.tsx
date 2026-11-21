"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import Link from "next/link";
import NextImage from "next/image";
import type { Locale } from "@/i18n/locales";
import { AssetLibrary, ImageControls, useMediaUrls, useCloudAssetUrls } from "./studio-v2-assets";
import { loadLocalProjectWithRecovery, saveLocalProject, type LocalProjectLoad } from "@/features/studio-v2/browser/media-store";
import { linkedRoot, alignedSnapshot } from "@/features/studio-v2/core/linked-components.ts";
import { snapshotVariant, instantiateComponent, imageNode, type Asset, type Component } from "@/features/studio-v2/core/component-engine.ts";
import { InspectorTabs, InspectorPanel, InspectorGroup, type InspectorTab } from "./studio-v2-inspector-shell";
import { StudioIcon } from "./studio-icon";
import { projectPalette } from "./studio-v2-color-picker";
import { TemplateManager } from "./studio-v2-template-manager";
import { StudioV2PrintDialog } from "./studio-v2-print-dialog";
import { StudioCloudPanel, StudioCloudUnavailable } from "./studio-v2-cloud-panel";
import { StudioPublishPanel, StudioPublishUnavailable } from "./studio-v2-publish-panel";
import {StudioNumberInput} from "./studio-number-input";
import type { RemoteSyncSettings } from "@/features/studio-v2/browser/remote-sync";
import { ResponsiveEditor } from "./studio-v2-responsive-editor";
import { MotionControls, MotionTimeline } from "./studio-v2-motion-controls";
import { motionTracks } from "@/features/studio-v2/core/motion-engine.ts";
import { StudioV2ProjectRenderer } from "./studio-v2-project-renderer";
import { pageProfile, DEVICE_WIDTH, type Device, type NodeOverride, type PageProfile } from "@/features/studio-v2/core/responsive-engine.ts";
import { InvitationControls } from "./studio-v2-invitation-controls";
import { BLOCK_NAMES, bindDocument, createWidget, type BlockKind } from "@/features/studio-v2/core/invitation-behavior.ts";
import { alignSelection, distributeSelection, scaleSelection, rotateSelection, copySelection, pasteSelection, reparentPreserveWorld, distanceGuides, freeSelection, canResizeSelection, type CanvasClipboard, type DistanceGuide } from "@/features/studio-v2/core/canvas-pro.ts";
import { StyleLibrary, StyleBindings } from "./studio-v2-style-library";
import { resolveStyleDocument, resolveStyleNode } from "@/features/studio-v2/core/style-tokens.ts";
import type {VisualProperties} from "@/features/studio-v2/core/appearance.schema.ts";
import { AdvancedProperties } from "./studio-v2-advanced-properties";
import { createFrameCoalescer } from "@/features/studio-v2/core/frame-coalescer.ts";
import { visibleArtboards, pinnedArtboards } from "@/features/studio-v2/core/render-window.ts";
import { StudioV2Artboard } from "./studio-v2-artboard";
import { StudioV2TextEditor, TextControls, type TextEditingSession } from "./studio-v2-text-editor";
import { plainText, formatRange, rangeStyle, type TextRun, type TextStyle, type TextRange, type TextNode } from "@/features/studio-v2/core/rich-text-engine.ts";
import { createStudioV2Demo } from "@/features/studio-v2/demo-project";
import { createEditorSession, dispatchStudioCommand, beginStudioTransaction, commitStudioTransaction, cancelStudioTransaction, undoStudio, redoStudio, type StudioEditorSession } from "@/features/studio-v2/core/command-engine.ts";
import { type ProjectDocumentV2, type StudioPageV2 } from "@/features/studio-v2/core/document.schema.ts";
import {
  clamp, fitBounds, minimapProjection, panViewport, RULER_THICKNESS,
  rulerMarks, screenToWorld, unionRects, zoomAt, worldToScreen, type Point, type Rect, type Size, type Viewport,
} from "@/features/studio-v2/core/viewport.ts";

import { canSelect, normalizeSelection, selectNode, nodeCorners, selectionBounds, moveSelection, resizeNode, rotateNode, marqueeSelection, snapMove, groupSelection, ungroupSelection, type Handle } from "@/features/studio-v2/core/selection-transform.ts";

import { layoutDocument } from "@/features/studio-v2/core/layout-engine.ts";
import type { StudioCommand } from "@/features/studio-v2/core/command-engine.ts";

type Tool = "select" | "hand";
type NodeGesture = { pointer:number; start:Point; document:ProjectDocumentV2; ids:string[]; started:boolean; handle?:Handle; rotate?:boolean; zoom:number; };
type Marquee = { pointer:number; start:Point; current:Point; pageId:string; additive:boolean };
function rectBetween(a:Point,b:Point):Rect{return {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),width:Math.abs(a.x-b.x),height:Math.abs(a.y-b.y)};}
function nodeLabel(doc:ProjectDocumentV2,id:string){
 const node=doc.nodes[id];if(!node)return id;
 if(node.layerName)return node.layerName;
 if(node.type==="frame")return node.name;
 if(node.type==="text")return node.runs.map(r=>r.text).join("").slice(0,40)||"Текст";
 if(node.type==="image")return doc.assets[node.assetId]?.name??"Фото";
 if(node.type==="widget")return BLOCK_NAMES[node.block.kind][doc.locale];
 return "Фигура";
}
function LayerRows({document,ids,selected,onSelect,onDropLayer,onState,depth=0}:{document:ProjectDocumentV2;ids:string[];selected:string[];onSelect:(id:string,add:boolean)=>void;onDropLayer:(id:string,target:string)=>void;onState:(id:string,patch:{locked?:boolean;visible?:boolean})=>void;depth?:number}){
 return <>{[...ids].reverse().map(id=>{
  const n=document.nodes[id];if(!n)return null;
  return <div key={id}><div className="v2-layer-with-actions"><button draggable={canSelect(document,id)} onDragStart={e=>{e.dataTransfer.setData("application/x-invito-layer",id);e.dataTransfer.effectAllowed="move";}} onDragOver={e=>{if(e.dataTransfer.types.includes("application/x-invito-layer")){e.preventDefault();e.dataTransfer.dropEffect="move";}}} onDrop={e=>{e.preventDefault();e.stopPropagation();const source=e.dataTransfer.getData("application/x-invito-layer");if(source&&source!==id)onDropLayer(source,id);}} className="v2-layer-row" style={{paddingLeft:12+depth*14}} aria-pressed={selected.includes(id)} disabled={!canSelect(document,id)} onClick={e=>onSelect(id,e.shiftKey)}><span><StudioIcon name={n.componentRef?"component":n.type==="widget"?"component":n.type}/></span><span>{nodeLabel(document,id)}</span></button><button className="v2-layer-state" aria-label={(n.visible?"Скрыть ":"Показать ")+nodeLabel(document,id)} aria-pressed={!n.visible} onClick={()=>onState(id,{visible:!n.visible})}><StudioIcon name="eye" style={{opacity:n.visible?1:.35}}/></button><button className="v2-layer-state" aria-label={(n.locked?"Разблокировать ":"Заблокировать ")+nodeLabel(document,id)} aria-pressed={n.locked} onClick={()=>onState(id,{locked:!n.locked})}><StudioIcon name="lock" style={{opacity:n.locked?1:.35}}/></button></div>{n.type==="frame"&&<LayerRows document={document} ids={n.children} selected={selected} onSelect={onSelect} onDropLayer={onDropLayer} onState={onState} depth={depth+1}/>}</div>
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
  anchor.download = project.id+".json";
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
    <div className="v2-minimap-title"><StudioIcon name="map" size={13}/> Навигатор</div>
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
export function StudioV2Workspace({locale,remoteSettings}:{locale:Locale;remoteSettings?:RemoteSyncSettings}) {
  const [session,setSession]=useState<StudioEditorSession>(()=>createEditorSession(createStudioV2Demo()));
  const [previewOpen,setPreviewOpen]=useState(false);
  const [templateManagerOpen,setTemplateManagerOpen]=useState(false);
  const [printOpen,setPrintOpen]=useState(false);
  const [cloudPanelOpen,setCloudPanelOpen]=useState(false);
  const [publishPanelOpen,setPublishPanelOpen]=useState(false);
  const [responsiveOpen,setResponsiveOpen]=useState(false);
  const [timelineOpen,setTimelineOpen]=useState(false);
  const [timelineTime,setTimelineTime]=useState(0);
  const [previewRun,setPreviewRun]=useState(0);
  const [device,setDevice]=useState<Device>("mobile");
  const [libraryOpen,setLibraryOpen]=useState(false);
  const [stylesOpen,setStylesOpen]=useState(false);
  const [inspectorTab,setInspectorTab]=useState<InspectorTab>("design");
  const [storageStatus,setStorageStatus]=useState("Загрузка локального проекта");
  const [loaded,setLoaded]=useState(false);
  const [loadFailure,setLoadFailure]=useState<string|null>(null);
  const [recovery,setRecovery]=useState<Extract<LocalProjectLoad,{kind:"recoverable"}>|null>(null);
  const [loadAttempt,setLoadAttempt]=useState(0);
  const [restoring,setRestoring]=useState(false);
  const saveGeneration=useRef(0);
  const [selectedPage,setSelectedPage]=useState<string|null>("page-1");
  const [pageStatus,setPageStatus]=useState("");
  const [selectedIds,setSelectedIds]=useState<string[]>([]);
  const clipboard=useRef<CanvasClipboard|null>(null);
  const [hasClipboard,setHasClipboard]=useState(false);
  const [distanceMarks,setDistanceMarks]=useState<DistanceGuide[]>([]);
  const [hoveredNodeId,setHoveredNodeId]=useState<string|null>(null);
  const [menu,setMenu]=useState<{x:number;y:number;ids:string[]}|null>(null);
  const [moveTarget,setMoveTarget]=useState("");
  const [guideAxis,setGuideAxis]=useState<"x"|"y">("x");
  const [guidePosition,setGuidePosition]=useState("0");
  const [editing,setEditing]=useState<TextEditingSession|null>(null);
  const [textMeasurements,setTextMeasurements]=useState<Record<string,number>>({});
  const measureText=useCallback((id:string,height:number)=>setTextMeasurements(old=>old[id]===height?old:{...old,[id]:height}),[]);
  const [selectionError,setSelectionError]=useState<string|null>(null);
  const [marquee,setMarquee]=useState<Rect|null>(null);
  const [guides,setGuides]=useState<{guideX?:number;guideY?:number}>({});
  const gestureQueue=useMemo(()=>createFrameCoalescer<StudioCommand|readonly StudioCommand[]>(command=>setSession(s=>{try{return dispatchStudioCommand(s,command);}catch{return s;}}),run=>requestAnimationFrame(run),id=>cancelAnimationFrame(id)),[]);
  useEffect(()=>()=>gestureQueue.clear(),[gestureQueue]);
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
  const sourceDocument=session.document;
  const palette=useMemo(()=>projectPalette(sourceDocument),[sourceDocument]);
  const localMediaUrls=useMediaUrls(sourceDocument.assets);
  const cloudMediaUrls=useCloudAssetUrls(sourceDocument,remoteSettings);
  const mediaUrls=useMemo(()=>({...localMediaUrls,...cloudMediaUrls}),[localMediaUrls,cloudMediaUrls]);
  useEffect(()=>{
    let active=true;let id="studio-v2-demo";
    try{id=localStorage.getItem("invito-studio-active-project")??id;}catch{/* active project preference is optional */}
    setLoaded(false);setLoadFailure(null);setRecovery(null);setStorageStatus("Загрузка локального проекта");
    void loadLocalProjectWithRecovery(id).then(result=>{
      if(!active)return;
      if(result.kind==="recoverable"){setRecovery(result);setStorageStatus("Требуется восстановление");return;}
      if(result.kind==="missing"&&id!=="studio-v2-demo"){setLoadFailure("Сохранённый проект не найден. Автосохранение остановлено, чтобы не заменить ваши данные.");return;}
      if(result.kind==="ready"){setSession(createEditorSession(result.document));setSelectedPage(result.document.pages[0].id);setSelectedIds([]);}
      setStorageStatus("Локальный проект");setLoaded(true);
    }).catch(()=>{if(active){setLoadFailure("Не удалось открыть локальный проект. Ваши данные не будут перезаписаны.");setStorageStatus("Хранилище недоступно");}});
    return()=>{active=false;};
  },[loadAttempt]);
  async function restoreProject(){
    if(!recovery||restoring)return;
    setRestoring(true);
    try{
      await saveLocalProject(recovery.document,{allowRecovery:true});
      setSession(createEditorSession(recovery.document));setSelectedPage(recovery.document.pages[0].id);setSelectedIds([]);setTextMeasurements({});
      setRecovery(null);setLoadFailure(null);setStorageStatus("Восстановлено из копии");setLoaded(true);
    }catch{setLoadFailure("Не удалось восстановить проект. Резервная копия сохранена.");}
    finally{setRestoring(false);}
  }
  async function openTemplateProject(doc:ProjectDocumentV2){
    if(!loaded||session.transaction||editing)throw Error("Завершите редактирование перед открытием проекта.");
    await saveLocalProject(sourceDocument);await saveLocalProject(doc);
    try{localStorage.setItem("invito-studio-active-project",doc.id);}catch{/* project still stored in IndexedDB */}
    setSession(createEditorSession(doc));setSelectedPage(doc.pages[0].id);setSelectedIds([]);setSelectionError(null);setTextMeasurements({});clipboard.current=null;setHasClipboard(false);setViewport(fitBounds(unionRects(doc.pages.map(page=>pageRect(doc,page))),{width:Math.max(1,size.width-14),height:Math.max(1,size.height-14)},45));setStorageStatus("Сохранено локально");
  }
  useEffect(()=>{
    const generation=++saveGeneration.current;
    if(!loaded||session.transaction)return;
    let submitted=false;
    setStorageStatus("Сохранение…");
    const save=()=>{
      if(submitted)return;submitted=true;
      void Promise.resolve().then(()=>saveLocalProject(sourceDocument)).then(()=>{
        if(saveGeneration.current===generation)setStorageStatus("Сохранено локально");
      }).catch(()=>{if(saveGeneration.current===generation)setStorageStatus("Не удалось сохранить");});
    };
    const timer=window.setTimeout(save,250);
    const onVisibility=()=>{if(documentGlobal.visibilityState==="hidden")save();};
    const documentGlobal=window.document;
    documentGlobal.addEventListener("visibilitychange",onVisibility);window.addEventListener("pagehide",save);
    return()=>{window.clearTimeout(timer);documentGlobal.removeEventListener("visibilitychange",onVisibility);window.removeEventListener("pagehide",save);};
  },[loaded,session.transaction,sourceDocument]);
  const document=useMemo(()=>{const bound=bindDocument({...sourceDocument,locale});if(editing&&sourceDocument.nodes[editing.id])bound.nodes[editing.id]=sourceDocument.nodes[editing.id];return layoutDocument(resolveStyleDocument(bound),textMeasurements);},[sourceDocument,textMeasurements,editing?.id,locale]);
  const frames=useMemo(()=>document.pages.map(page=>pageRect(document,page)),[document]);
  const activeTool=spaceHeld?"hand":tool;
  const selected=document.pages.find(p=>p.id===selectedPage)??null;
  const selectedRoot=selected?document.nodes[selected.rootNodeId]:null;
  const nodeIds=normalizeSelection(document,selectedIds);
  const activeNode=nodeIds.length===1?document.nodes[nodeIds[0]]:null;
  const authoredNode=activeNode?sourceDocument.nodes[activeNode.id]:null;
  const selectedInstance=authoredNode?linkedRoot(sourceDocument,authoredNode.id):undefined;
  const instanceComponent=selectedInstance?.componentRef?sourceDocument.components?.[selectedInstance.componentRef.componentId]:undefined;
  const currentProfile=selected?pageProfile(sourceDocument,selected,device):null;
  const currentOverride=authoredNode?sourceDocument.responsiveOverrides?.[device]?.[authoredNode.id]??{}:{};
  function updateProfile(patch:Partial<PageProfile>){if(selected&&currentProfile&&!editing)libraryCommands({kind:"setPageProfile",id:selected.id,device,profile:{...currentProfile,...patch}});}
  function updateOverride(patch:NodeOverride){if(authoredNode&&!editing)libraryCommands({kind:"setResponsiveOverride",id:authoredNode.id,device,patch:{...currentOverride,...patch}});}
  function finishText(cancel=false){
    if(!editing)return;
    setSession(s=>s.transaction?(cancel?cancelStudioTransaction(s):commitStudioTransaction(s)):s);setEditing(null);
  }
  function startText(id:string){
    const n=sourceDocument.nodes[id];if(n?.type!=="text"||!canSelect(sourceDocument,id)||editing?.id===id||nodeGesture.current?.started||pageDrag.current?.started)return;
    if(editing)finishText();
    setSelectedIds([id]);setEditing({id,range:{start:0,end:plainText(n.runs).length},typingStyle:null});
    setSession(s=>beginStudioTransaction(s,"Редактирование текста"));
  }
  function editTextRuns(id:string,runs:TextRun[]){setSession(s=>{try{return dispatchStudioCommand(s,{kind:"updateNode",id,changes:{runs}});}catch{return s;}});}
  function updateTextRange(range:TextRange){setEditing(old=>old?{...old,range,typingStyle:old.range.start===range.start&&old.range.end===range.end?old.typingStyle:null}:null);}
  function styleText(node:TextNode,patch:Partial<TextStyle>){
    if(node.tokenRefs?.textColor&&"color" in patch||node.tokenRefs?.typography&&(["fontFamily","fontSize","fontWeight"] as const).some(k=>k in patch)){setSelectionError("Сначала отсоедините соответствующий связанный стиль текста.");return;}
    const range=editing?.id===node.id?editing.range:{start:0,end:plainText(node.runs).length};
    if(editing?.id===node.id&&range.start===range.end){setEditing(old=>old?{...old,typingStyle:{...(old.typingStyle??rangeStyle(node.runs,range)),...patch}}:null);if(!plainText(node.runs))editTextRuns(node.id,formatRange(node.runs,range,patch));return;}
    try{editTextRuns(node.id,formatRange(node.runs,range,patch));}catch{/* Keep valid runs. */}
  }
  function addText(){
    const target=authoredNode?.type==="frame"?authoredNode:selectedRoot;
    if(target?.type!=="frame"||target.locked||editing||linkedRoot(sourceDocument,target.id))return;
    const id="text-"+crypto.randomUUID();
    const n:TextNode={id,type:"text",parentId:target.id,x:24,y:24,width:Math.min(400,target.width),height:80,rotation:0,opacity:1,visible:true,locked:false,runs:[{text:"Новый текст",style:{fontFamily:"sans",fontSize:48,fontWeight:400,italic:false,underline:false,strike:false,color:"#20242B"}}],textAlign:"left",bindingKey:null,autoHeight:true};
    setSession(s=>dispatchStudioCommand(s,{kind:"insertNode",parentId:target.id,node:n}));setSelectedIds([id]);
  }
  const container=authoredNode?.type==="frame"?authoredNode:!activeNode&&selectedRoot?.type==="frame"?sourceDocument.nodes[selectedRoot.id]:null;
  const layoutFrame=container?.type==="frame"?container:null;
  const targetFrame=authoredNode?.type==="frame"?authoredNode:selectedRoot?.type==="frame"?selectedRoot:null;
  const canInsert=!!targetFrame&&!targetFrame.locked&&!editing&&!linkedRoot(sourceDocument,targetFrame.id);
  function libraryCommands(commands:StudioCommand|readonly StudioCommand[]){setSession(s=>{if(s.transaction)return s;try{return dispatchStudioCommand(s,commands);}catch{return s;}});}
  function insertWidget(kind:BlockKind){if(!targetFrame||!canInsert)return;const id="widget-"+crypto.randomUUID();const width=Math.max(1,Math.min(900,targetFrame.width-48));libraryCommands({kind:"insertNode",parentId:targetFrame.id,node:createWidget(kind,id,targetFrame.id,width)});setSelectedIds([id]);}
  function addAsset(a:Asset){libraryCommands({kind:"putAsset",asset:a});}
  function insertAsset(a:Asset){if(!targetFrame||!canInsert)return;const id="image-"+crypto.randomUUID();libraryCommands({kind:"insertNode",parentId:targetFrame.id,node:imageNode(a,targetFrame.id,id)});setSelectedIds([id]);}
  function replaceAsset(a:Asset){if(authoredNode?.type!=="image"||editing){setSelectionError("Выберите изображение для замены.");return;}libraryCommands({kind:"updateNode",id:authoredNode.id,changes:{assetId:a.id}});}
  function deleteAsset(a:Asset){const used=(n:ProjectDocumentV2["nodes"][string])=>n.type==="image"&&n.assetId===a.id||n.type==="widget"&&n.block.kind==="gallery"&&n.block.assetIds.includes(a.id);if(Object.values(sourceDocument.nodes).some(used)||Object.values(sourceDocument.components??{}).some(c=>c.variants.some(v=>Object.values(v.nodes).some(used)))){setSelectionError("Ресурс используется в документе или библиотеке.");return;}libraryCommands({kind:"deleteAsset",id:a.id});}
  function createComponent(name:string){if(!authoredNode||editing)return;const id="component-"+crypto.randomUUID();libraryCommands({kind:"putComponent",component:{id,name,variants:[snapshotVariant(sourceDocument,authoredNode.id,"variant-default","Основной")]}});}
  function addVariant(c:Component,name:string){
    if(!authoredNode||editing)return;
    proAction(()=>{const base=c.variants[0];if(base.nodes[base.rootId].type!==authoredNode.type)throw Error("Тип корневого слоя варианта должен совпадать.");
      const variant=alignedSnapshot(snapshotVariant(sourceDocument,authoredNode.id,"variant-"+crypto.randomUUID(),name),base,sourceDocument,authoredNode.id,true);
      return {kind:"putComponent",component:{...c,variants:[...c.variants,variant]}};
    });
  }
  function updateMaster(c:Component,variantId:string){
    if(!authoredNode||editing)return;
    proAction(()=>{const base=c.variants.find(v=>v.id===variantId);if(!base||base.nodes[base.rootId].type!==authoredNode.type)throw Error("Выберите слой того же типа, что и мастер.");
      const variant=alignedSnapshot(snapshotVariant(sourceDocument,authoredNode.id,base.id,base.name),base,sourceDocument,authoredNode.id,false);
      return {kind:"putComponent",component:{...c,variants:c.variants.map(v=>v.id===variantId?variant:v)}};
    });
  }
  function insertComponent(c:Component,variantId:string){
    if(!targetFrame||!canInsert||session.transaction)return;
    try{const commands=instantiateComponent(c,variantId,targetFrame.id,()=>"node-"+crypto.randomUUID());const next=dispatchStudioCommand(session,commands);setSession(next);const first=commands[0];if(first?.kind==="pasteNodes")setSelectedIds(first.roots);setSelectionError(null);}catch(error){setSelectionError(error instanceof Error?error.message:"Не удалось добавить компонент.");}
  }
  function insertShape(shape:"rectangle"|"circle"|"ellipse"|"triangle"|"star"|"heart"){if(!targetFrame||!canInsert)return;const id="shape-"+crypto.randomUUID();libraryCommands({kind:"insertNode",parentId:targetFrame.id,node:{id,type:"shape",parentId:targetFrame.id,x:24,y:24,width:160,height:160,rotation:0,opacity:1,visible:true,locked:false,shape,fill:"#707A5C",stroke:null,strokeWidth:0}});setSelectedIds([id]);}
  const parent=authoredNode?.parentId?sourceDocument.nodes[authoredNode.parentId]:null;
  const inStack=parent?.type==="frame"&&parent.layout!=="free";
  const movable=(ids:string[])=>ids.every(id=>{const p=sourceDocument.nodes[sourceDocument.nodes[id].parentId??""];return p?.type==="frame"&&p.layout==="free";});
  function editLayout(id:string,changes:Extract<StudioCommand,{kind:"updateNode"}>["changes"]){
    setSession(s=>{if(s.transaction)return s;try{return dispatchStudioCommand(s,{kind:"updateNode",id,changes});}catch{return s;}});
  }
  function createFrame(){
    const target=layoutFrame??(selectedRoot?.type==="frame"?sourceDocument.nodes[selectedRoot.id]:null);
    if(target?.type!=="frame"||target.locked||linkedRoot(sourceDocument,target.id))return;
    const id="frame-"+crypto.randomUUID();
    const node={id,parentId:target.id,type:"frame" as const,name:"Новый фрейм",x:24,y:24,width:320,height:240,rotation:0,opacity:1,visible:true,locked:false,children:[],layout:"free" as const,gap:16,padding:{top:16,right:16,bottom:16,left:16},background:"transparent",clip:false};
    setSession(s=>dispatchStudioCommand(s,{kind:"insertNode",parentId:target.id,node}));setSelectedIds([id]);
  }
  function changeVisual(node:ProjectDocumentV2["nodes"][string],resolved:ProjectDocumentV2["nodes"][string],visual:VisualProperties){
    const next={...node.visual} as Record<string,unknown>,effective=resolved.visual??{},incoming=visual as Record<string,unknown>,old=effective as Record<string,unknown>;
    const controlled:Record<string,boolean>={fill:!!node.tokenRefs?.fill,stroke:!!node.tokenRefs?.stroke,shadow:!!node.tokenRefs?.effect,blur:!!node.tokenRefs?.effect,corners:!!node.tokenRefs?.corners};
    for(const key of new Set([...Object.keys(old),...Object.keys(incoming)])){
      if(JSON.stringify(old[key])===JSON.stringify(incoming[key]))continue;
      if(controlled[key]){setSelectionError("Сначала отсоедините соответствующий связанный стиль.");return;}
      if(Object.hasOwn(incoming,key))next[key]=incoming[key];else delete next[key];
    }
    proAction(()=>({kind:"updateNode",id:node.id,changes:{visual:next as VisualProperties}}));
  }
  function proAction(make:()=>StudioCommand|StudioCommand[]){
    if(editing||session.transaction)return;
    try{const commands=make();const next=dispatchStudioCommand(session,commands);setSession(next);setSelectionError(null);}
    catch(error){setSelectionError(error instanceof Error?error.message:"Не удалось изменить слои.");}
    setMenu(null);
  }
  function copyLayers(ids=nodeIds){
    try{clipboard.current=copySelection(sourceDocument,document,ids);setHasClipboard(true);setSelectionError(null);}catch{setSelectionError("Выберите слои для копирования.");}
    setMenu(null);
  }
  function pasteLayers(duplicate=false,ids=nodeIds){
    if(editing||session.transaction)return;
    try{
      const clip=duplicate?copySelection(sourceDocument,document,ids):clipboard.current;
      const first=ids.length?document.nodes[ids[0]]:null;
      const target=duplicate?first?.parentId:(first?.type==="frame"?first.id:first?.parentId??selectedRoot?.id);
      if(!clip||!target)throw Error("Выберите страницу или фрейм.");
      const result=pasteSelection(document,clip,target,()=>"node-"+crypto.randomUUID());
      setSession(dispatchStudioCommand(session,result.command));setSelectedIds(result.ids);setSelectionError(null);
    }catch(error){setSelectionError(error instanceof Error?error.message:"Не удалось вставить слои.");}setMenu(null);
  }
  function moveLayer(id:string,targetId:string){
    const target=document.nodes[targetId];if(!target)return;
    proAction(()=>{
      if(target.type==="frame")return reparentPreserveWorld(document,id,target.id);
      if(!target.parentId)throw Error("Нужен фрейм");
      const parent=document.nodes[target.parentId];if(parent.type!=="frame")throw Error("Нужен фрейм");
      const index=parent.children.indexOf(targetId);
      return reparentPreserveWorld(document,id,parent.id,index);
    });
  }
  function moveLayerToFrame(){if(activeNode&&moveTarget)moveLayer(activeNode.id,moveTarget);}
  function addGuide(){const position=Number(guidePosition);if(!guidePosition.trim()||!Number.isFinite(position)||Math.abs(position)>1e6){setSelectionError("Введите координату от −1000000 до 1000000.");return;}proAction(()=>({kind:"setGuides",guides:[...(sourceDocument.guides??[]),{id:"guide-"+crypto.randomUUID(),axis:guideAxis,position}]}));}
  const selectionRect=nodeIds.length?selectionBounds(document,nodeIds):null;
  const selectionPolygon=activeNode?nodeCorners(document,activeNode.id):selectionRect?[{x:selectionRect.x,y:selectionRect.y},{x:selectionRect.x+selectionRect.width,y:selectionRect.y},{x:selectionRect.x+selectionRect.width,y:selectionRect.y+selectionRect.height},{x:selectionRect.x,y:selectionRect.y+selectionRect.height}]:[];
  const selectionScreen=selectionPolygon.map(p=>worldToScreen(p,viewport));
  function chooseNode(id:string,add=false){
    if(editing)finishText();
    setSelectionError(null);setSelectedIds(ids=>selectNode(document,ids,id,add));
  }
  function performGroup(){
    const id="group-"+crypto.randomUUID();
    try{const commands=groupSelection(document,nodeIds,id);setSession(dispatchStudioCommand(session,commands));setSelectedIds([id]);setSelectionError(null);}catch{setSelectionError("Для группы выберите соседние слои одного свободного фрейма.");}
  }
  function performUngroup(){
    if(!activeNode||activeNode.type!=="frame")return;
    try{const commands=ungroupSelection(document,activeNode.id);setSession(dispatchStudioCommand(session,commands));setSelectedIds(activeNode.children);setSelectionError(null);}catch{setSelectionError("Разгруппировка недоступна для этого фрейма.");}
  }
  const inset=rulers?RULER_THICKNESS:0;
  const sceneSize={width:Math.max(1,size.width-inset),height:Math.max(1,size.height-inset)};
  const renderPages=visibleArtboards(document.pages.map((p,i)=>({id:p.id,rect:frames[i]})),viewport,sceneSize,pinnedArtboards(document,selectedPage,[...nodeIds,...(nodeGesture.current?.ids??[])],editing?.id,pageDrag.current?.id),Object.keys(document.nodes).length);

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
      if(!loaded)return;
      const target=e.target as HTMLElement|null;
      if(templateManagerOpen||printOpen){return;}
      if(responsiveOpen){if(e.key==="Escape"){e.preventDefault();setResponsiveOpen(false);return;}if(!target?.closest("input,textarea,select,[contenteditable]")&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();changeHistory(e.shiftKey);}return;}
      if(previewOpen){if(e.key==="Escape"){setPreviewOpen(false);setTimelineOpen(false);}return;}
      if(target?.closest("input,textarea,select,[contenteditable=true],[contenteditable=plaintext-only]"))return;
      if(menu&&e.key==="Escape"){setMenu(null);e.preventDefault();return;}
      if(editing){if(e.key==="Escape"){finishText(true);e.preventDefault();}return;}
      if(e.key==="Enter"&&activeNode?.type==="text"){e.preventDefault();startText(activeNode.id);return;}
      if(e.key.toLowerCase()==="t"&&!e.ctrlKey&&!e.metaKey){addText();return;}
      if(e.code==="Space"){e.preventDefault();setSpaceHeld(true);return}
      if(e.key.toLowerCase()==="v"&&!e.metaKey&&!e.ctrlKey)setTool("select");
      if(e.key.toLowerCase()==="h"&&!e.metaKey&&!e.ctrlKey)setTool("hand");
      if(e.key==="Escape"){setSelectedIds([]);setSelectedPage(null);setLeftOpen(false);setRightOpen(false);if(nodeGesture.current||pageDrag.current){gestureQueue.clear();nodeGesture.current=null;pageDrag.current=null;setSession(s=>s.transaction?cancelStudioTransaction(s):s);setGuides({});}marqueeGesture.current=null;setMarquee(null);return;}
      if(nodeGesture.current||pageDrag.current)return;
      if((e.ctrlKey||e.metaKey)&&!e.altKey){const key=e.key.toLowerCase();if(key==="c"&&nodeIds.length){e.preventDefault();copyLayers();return;}if(key==="v"&&hasClipboard){e.preventDefault();pasteLayers();return;}if(key==="d"&&nodeIds.length){e.preventDefault();pasteLayers(true);return;}}
      if(nodeIds.length&&["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){
        e.preventDefault();const step=e.shiftKey?10:1;
        const delta={x:e.key==="ArrowLeft"?-step:e.key==="ArrowRight"?step:0,y:e.key==="ArrowUp"?-step:e.key==="ArrowDown"?step:0};
        if(movable(nodeIds))setSession(s=>dispatchStudioCommand(s,moveSelection(layoutDocument(s.document,textMeasurements),nodeIds,delta)));return;
      }
      if(!nodeIds.length&&selectedPage&&(e.key==="Delete"||e.key==="Backspace")){e.preventDefault();deletePage(selectedPage);return;}
      if(nodeIds.length&&(e.key==="Delete"||e.key==="Backspace")){
        e.preventDefault();proAction(()=>nodeIds.map(id=>({kind:"deleteNode" as const,id})));setSelectedIds([]);return;
      }
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){
        e.preventDefault();changeHistory(e.shiftKey);
      }
    }
    const up=(e:KeyboardEvent)=>{if(e.code==="Space")setSpaceHeld(false);if(e.key==="Alt")setDistanceMarks([]);};
    const blur=()=>{setSpaceHeld(false);setDistanceMarks([]);};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur)};
  },[loaded,nodeIds,editing,sourceDocument,previewOpen,responsiveOpen,templateManagerOpen,printOpen,hasClipboard,menu,selectedPage,session,document,gestureQueue]);
  function zoomTo(value:number, screenAnchor:Point={x:sceneSize.width/2,y:sceneSize.height/2}){
    setViewport(v=>zoomAt(v,clampZoom(value),screenAnchor));
  }
  function fitAll(){
    setViewport(fitBounds(unionRects(frames),sceneSize,size.width<640?20:50));
  }
  function center(world:Point){
    setViewport(v=>({...v,x:sceneSize.width/2-world.x*v.zoom,y:sceneSize.height/2-world.y*v.zoom}));
  }
  function changeHistory(redo=false){
    if(editing||session.transaction)return;
    const next=redo?redoStudio(session):undoStudio(session);
    if(next===session)return;
    const restored=next.document.pages.find(p=>!session.document.pages.some(old=>old.id===p.id));
    const current=next.document.pages.find(p=>p.id===selectedPage);
    if(restored){setSelectedPage(restored.id);setSelectedIds([]);setPageStatus(redo?"Страница возвращена.":"Страница восстановлена.");}
    else if(!current&&selectedPage){setSelectedPage(next.document.pages[0].id);setSelectedIds([]);setPageStatus("");}
    else{setSelectedIds(ids=>ids.filter(id=>next.document.nodes[id]));setPageStatus("");}
    setSession(next);
  }
  function deletePage(id:string){
    if(editing||session.transaction||document.pages.length<=1)return;
    const index=document.pages.findIndex(p=>p.id===id);if(index<0)return;
    try{
      const next=dispatchStudioCommand(session,{kind:"deletePage",id});
      const fallback=next.document.pages[Math.min(index,next.document.pages.length-1)];
      if(selectedPage===id){setSelectedPage(fallback.id);setSelectedIds([]);}
      setSession(next);setPageStatus("Страница удалена. Ctrl+Z — вернуть.");setSelectionError(null);
    }catch(error){setSelectionError(error instanceof Error?error.message:"Не удалось удалить страницу.");}
  }
  function reorderPage(id:string,index:number){
    if(editing||session.transaction)return;
    proAction(()=>({kind:"reorderPage",id,index}));
  }
  function focusPage(page:StudioPageV2){
    if(editing)finishText();
    setSelectedPage(page.id);setSelectedIds([]);
    const rect=pageRect(document,page);
    center({x:rect.x+rect.width/2,y:rect.y+rect.height/2});
    setLeftOpen(false);
  }
  function addPage(){
    if(editing)finishText();
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
    if(activeTool!=="select"||e.button!==0||sourceDocument.nodes[page.rootNodeId]?.locked||session.transaction&&!editing)return;
    if(editing)finishText();
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
    gestureQueue.queue({
      kind:"movePage",id:drag.id,
      placement:{x:Math.max(-1e6,Math.min(1e6,Math.round(drag.origin.x+dx/viewport.zoom))),y:Math.max(-1e6,Math.min(1e6,Math.round(drag.origin.y+dy/viewport.zoom)))}
    });
  }
  function endPageDrag(e:ReactPointerEvent<HTMLButtonElement>){
    const drag=pageDrag.current;
    if(!drag||drag.pointer!==e.pointerId)return;
    pageDrag.current=null;
    if(e.type==="pointercancel")gestureQueue.clear();else gestureQueue.flush();
    if(drag.started)setSession(s=>s.transaction?(e.type==="pointercancel"?cancelStudioTransaction(s):commitStudioTransaction(s)):s);
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function localPoint(e:{clientX:number;clientY:number}):Point {
    const rect=stageRef.current?.getBoundingClientRect();
    return {x:e.clientX-(rect?.left??0)-inset,y:e.clientY-(rect?.top??0)-inset};
  }
  function distance(a:Point,b:Point){return Math.hypot(a.x-b.x,a.y-b.y)}
  function middle(a:Point,b:Point){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
  function startNodeGesture(e:ReactPointerEvent<HTMLElement>,ids:string[],handle?:Handle,rotate=false){
    if(editing)return;
    if(rotate&&!freeSelection(document,ids))return;
    if(handle&&!canResizeSelection(document,ids))return;
    if(!rotate&&!handle&&!movable(ids))return;
    if(handle&&ids.some(id=>{const n=sourceDocument.nodes[id];return n.sizing?.width==="hug"||n.sizing?.height==="hug"||n.sizing?.width==="fill"||n.sizing?.height==="fill"||!movable([id]);}))return;
    nodeGesture.current={pointer:e.pointerId,start:localPoint(e),document,ids,started:false,handle,rotate,zoom:viewport.zoom};
    if(handle||rotate)stageRef.current?.setPointerCapture(e.pointerId);else (e.target as Element).setPointerCapture(e.pointerId);
  }
  function stagePointerDown(e:ReactPointerEvent<HTMLDivElement>){
    const local=localPoint(e);
    const target=e.target as Element;
    if(menu&&!target.closest(".v2-canvas-menu"))setMenu(null);
    if(target.closest("button,.v2-minimap,.v2-text-edit"))return;
    if(editing){finishText();return;}
    const hit=target.closest<HTMLElement>("[data-studio-node]");
    const pageHit=target.closest<HTMLElement>("[data-studio-page]");
    const id=hit?.dataset.studioNode,pageId=pageHit?.dataset.studioPage;
    if(e.pointerType==="touch"&&activeTool==="select"&&id&&pageId&&canSelect(document,id))touchTap.current={pointer:e.pointerId,start:local,id,pageId};
    if(e.pointerType!=="touch"&&e.button===0&&activeTool==="select"){
      if(id&&canSelect(document,id)){
        if(pageId)setSelectedPage(pageId);
        const ids=e.shiftKey?selectNode(document,nodeIds,id,true):nodeIds.includes(id)?nodeIds:[id];
        setSelectionError(null);setSelectedIds(ids);
        if(ids.includes(id)&&movable(ids))startNodeGesture(e,ids);
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
    if(!drag){
      const id=(e.target as Element).closest<HTMLElement>("[data-studio-node]")?.dataset.studioNode;
      const hovered=id&&document.nodes[id]?.parentId!==null&&document.nodes[id]?.visible?id:null;
      setHoveredNodeId(old=>old===(hovered??null)?old:hovered??null);
      setDistanceMarks(old=>{const next=e.altKey&&hovered?distanceGuides(document,nodeIds,hovered):[];return JSON.stringify(old)===JSON.stringify(next)?old:next;});
    }
    if(drag?.pointer===e.pointerId){
      const delta={x:(local.x-drag.start.x)/drag.zoom,y:(local.y-drag.start.y)/drag.zoom};
      if(!drag.started&&distance(local,drag.start)<4)return;
      if(!drag.started){drag.started=true;setSession(s=>beginStudioTransaction(s,"Трансформация слоя"));}
      if(drag.rotate){
        const id=drag.ids[0],b=selectionBounds(drag.document,drag.ids),center=worldToScreen({x:b.x+b.width/2,y:b.y+b.height/2},viewport);
        const change=(Math.atan2(local.y-center.y,local.x-center.x)-Math.atan2(drag.start.y-center.y,drag.start.x-center.x))*180/Math.PI;
        const angle=change+(drag.ids.length===1?drag.document.nodes[id].rotation:0),snapped=e.shiftKey?Math.round(angle/15)*15:angle;
        const commands=drag.ids.length===1?rotateNode(drag.document,id,snapped):rotateSelection(drag.document,drag.ids,snapped);
        gestureQueue.queue(commands);
      }else if(drag.handle){
        const command=drag.ids.length===1?resizeNode(drag.document,drag.ids[0],drag.handle,delta,e.shiftKey):scaleSelection(drag.document,drag.ids,drag.handle,delta);
        gestureQueue.queue(command);
      }else{
        const snapped=e.altKey?{delta,guideX:undefined,guideY:undefined}:snapMove(drag.document,drag.ids,delta,drag.zoom);
        setGuides({guideX:snapped.guideX,guideY:snapped.guideY});
        gestureQueue.queue(moveSelection(drag.document,drag.ids,snapped.delta));
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
      if(e.type==="pointercancel")gestureQueue.clear();else gestureQueue.flush();
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
  function stageWheel(e:WheelEvent){
    // React's delegated wheel listener may be passive. The native non-passive
    // listener guarantees Ctrl+wheel zooms the artboard, not the browser page.
    if(e.cancelable)e.preventDefault();
    if(nodeGesture.current||marqueeGesture.current)return;
    const step=e.deltaMode===1?16:e.deltaMode===2?Math.max(1,stageRef.current?.clientHeight??800):1;
    const dx=e.deltaX*step,dy=e.deltaY*step;
    if(e.ctrlKey){
      const rect=stageRef.current?.getBoundingClientRect();
      if(!rect)return;
      const inset=rulers?RULER_THICKNESS:0;
      const anchor={x:e.clientX-rect.left-inset,y:e.clientY-rect.top-inset};
      setViewport(v=>zoomAt(v,v.zoom*Math.exp(-Math.max(-350,Math.min(350,dy))*.0025),anchor));
    }else{
      setViewport(v=>panViewport(v,{x:-dx-(e.shiftKey?dy:0),y:e.shiftKey?0:-dy}));
    }
  }
  useEffect(()=>{
    const stage=stageRef.current;if(!stage)return;
    stage.addEventListener("wheel",stageWheel,{passive:false});
    return()=>stage.removeEventListener("wheel",stageWheel);
    // The native handler only closes over ruler inset and stable state dispatchers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[rulers]);
  function moveSelected(axis:"x"|"y",delta:number){
    if(!selected)return;
    setSession(s=>dispatchStudioCommand(s,{kind:"movePage",id:selected.id,placement:{
      ...selected.placement,[axis]:selected.placement[axis]+delta,
    }}));
  }
  const hoverNode=hoveredNodeId&&!editing&&activeTool==="select"&&!nodeGesture.current&&!pageDrag.current?document.nodes[hoveredNodeId]:null;
  const hoverScreen=hoverNode?nodeCorners(document,hoverNode.id).map(point=>worldToScreen(point,viewport)):[];
  const hoverX=hoverScreen.length?Math.min(...hoverScreen.map(point=>point.x)):0;
  const hoverY=hoverScreen.length?Math.min(...hoverScreen.map(point=>point.y)):0;
  const zoomPercent=Math.round(viewport.zoom*100);
  const gridWorld=viewport.zoom<.3?100:40;
  const backgroundStyle:CSSProperties={
    backgroundSize:`${gridWorld*viewport.zoom}px ${gridWorld*viewport.zoom}px`,
    backgroundPosition:`${viewport.x}px ${viewport.y}px`,
  };
  return <main className="studio-v2" lang={locale}>
    <header className="v2-topbar" inert={!loaded}>
      <div className="v2-brand">
        <Link href={`/${locale}`} aria-label="На главную"><StudioIcon name="back" size={16}/></Link>
        <strong><NextImage className="v2-brand-logo" src="/brand/eventiq-logo.svg" alt="eventiq" width={1170} height={287}/><span>Studio 2.0</span></strong>
        <button className="v2-project-title" aria-label="Менеджер шаблонов" disabled={!loaded||!!editing||!!session.transaction} onClick={()=>setTemplateManagerOpen(true)}>Шаблоны <StudioIcon name="down" size={13}/></button>
        <span className="v2-draft-state" role="status">{storageStatus}</span>
      </div>
      <div className="v2-tools" role="toolbar" aria-label="Инструменты холста">
        <button aria-label="Выделение (V)" title="Выделение (V)" aria-pressed={activeTool==="select"} onClick={()=>setTool("select")}><StudioIcon name="select" size={20}/></button>
        <button aria-label="Рука (H или пробел)" title="Рука (H или пробел)" aria-pressed={activeTool==="hand"} onClick={()=>setTool("hand")}><StudioIcon name="hand" size={20}/></button>
        <button aria-label="Создать фрейм" title="Создать фрейм" onClick={createFrame} disabled={!!editing}><StudioIcon name="frame" size={20}/></button>
        <button aria-label="Добавить текст (T)" title="Добавить текст (T)" onClick={addText} disabled={!!editing}><StudioIcon name="text" size={20}/></button>
        <span className="v2-top-divider"/>
        <button title="Показать или скрыть сетку" aria-label="Сетка" aria-pressed={grid} onClick={()=>setGrid(v=>!v)}><StudioIcon name="grid" size={18}/></button>
        <button title="Тонкие линейки" aria-label="Линейки" aria-pressed={rulers} onClick={()=>setRulers(v=>!v)}><StudioIcon name="ruler" size={18}/></button>
      </div>
      <div className="v2-top-actions">
        <button title="Открыть Template Manager" aria-label="Открыть Template Manager" disabled={!loaded||!!editing||!!session.transaction} onClick={()=>setTemplateManagerOpen(true)}><StudioIcon name="component" size={18}/></button>
        <button title="Отменить" aria-label="Отменить" disabled={!session.undoStack.length} onClick={()=>changeHistory()}><StudioIcon name="undo" size={18}/></button>
        <button title="Повторить" aria-label="Повторить" disabled={!session.redoStack.length} onClick={()=>changeHistory(true)}><StudioIcon name="redo" size={18}/></button>
        <button className="v2-responsive-toggle" aria-label="Адаптивный редактор" title="Адаптивный редактор" disabled={!!editing||!!session.transaction} onClick={()=>setResponsiveOpen(true)}><StudioIcon name="responsive" size={18}/></button>
        <button className="v2-preview-button" title="Предпросмотр" aria-label="Предпросмотр" onClick={()=>{if(editing)finishText();setPreviewOpen(true);}}><StudioIcon name="phone" size={18}/></button>
        <button className="v2-export" title="Синхронизация с сервером" aria-label="Синхронизация с сервером" disabled={!loaded||!!editing||!!session.transaction} onClick={()=>setCloudPanelOpen(true)}><StudioIcon name="component" size={16}/> Облако</button>
        <button className="v2-export" title="Опубликовать приглашение" aria-label="Опубликовать приглашение" disabled={!loaded||!!editing||!!session.transaction} onClick={()=>setPublishPanelOpen(true)}><StudioIcon name="share" size={16}/> Публикация</button>
        <button className="v2-export" title="Экспорт и печать" aria-label="Экспорт и печать" disabled={!loaded||!!editing||!!session.transaction} onClick={()=>setPrintOpen(true)}><StudioIcon name="printer" size={16}/> Экспорт</button>
        <span className="v2-stage-tag"><StudioIcon name="check" size={13}/> Функциональный прототип</span>
      </div>
    </header>
    <div className="v2-body" inert={!loaded}>
      <aside className={`v2-left ${leftOpen?"is-open":""}`} aria-label="Страницы и библиотека">
        <div className="v2-sidebar-tabs"><button aria-pressed={!libraryOpen&&!stylesOpen} onClick={()=>{setLibraryOpen(false);setStylesOpen(false);}}>Страницы / слои</button><button aria-pressed={libraryOpen&&!stylesOpen} onClick={()=>{setLibraryOpen(true);setStylesOpen(false);}}>Ресурсы</button><button aria-pressed={stylesOpen} onClick={()=>setStylesOpen(true)}><StudioIcon name="styles"/> Стили</button></div>
        <div hidden={!stylesOpen}><StyleLibrary document={sourceDocument} palette={palette} disabled={!!editing} onCommand={command=>proAction(()=>command)}/></div>
        {!stylesOpen&&(libraryOpen?<><AssetLibrary document={sourceDocument} urls={mediaUrls} onUpload={addAsset} onInsert={insertAsset} onReplace={replaceAsset} onFolder={(a,folder)=>libraryCommands({kind:"putAsset",asset:{...a,folder}})} onDelete={deleteAsset} onCreateComponent={createComponent} onAddVariant={addVariant} onUpdateVariant={updateMaster} onInsertComponent={insertComponent} canCreate={!!authoredNode&&!editing} canInsert={canInsert} onError={setSelectionError}/><div className="v2-sidebar-section"><div className="v2-sidebar-heading"><strong>Фигуры</strong></div><div className="v2-nudge">{(["rectangle","circle","triangle","star","heart"] as const).map(shape=><button key={shape} title={shape} disabled={!canInsert} onClick={()=>insertShape(shape)}><StudioIcon name={shape==="rectangle"?"shape":shape}/></button>)}</div></div></>:<>
        <div className="v2-sidebar-heading"><strong>Страницы <small>{document.pages.length}</small></strong>
          <button title="Добавить страницу" aria-label="Добавить страницу" onClick={addPage} disabled={document.pages.length>=30}><StudioIcon name="plus" size={18}/></button>
        </div>
        <div className="v2-page-list">{document.pages.map((page,index)=>{
          const background=document.nodes[page.rootNodeId];
          return <div key={page.id} className="v2-page-row"><button draggable={!editing&&!background.locked} onDragStart={e=>{e.dataTransfer.setData("application/x-invito-page",page.id);e.dataTransfer.effectAllowed="move";}} onDragOver={e=>{if(e.dataTransfer.types.includes("application/x-invito-page")){e.preventDefault();e.dataTransfer.dropEffect="move";}}} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("application/x-invito-page");if(id&&id!==page.id)reorderPage(id,index);}} className={`v2-page-item ${selectedPage===page.id?"is-selected":""}`} onClick={()=>focusPage(page)}>
            <span className="v2-page-index">{index+1}</span>
            <span className="v2-page-thumbnail" style={{background:background.type==="frame"?background.background:"#FFF"}}>
              <span>{page.name==="Обложка"?"А & Т":page.name==="RSVP"?"RSVP":page.name.slice(0,1)}</span>
            </span>
            <span>{page.name}</span>
          </button><button className="v2-page-delete" title="Удалить страницу" aria-label={"Удалить страницу "+page.name} disabled={document.pages.length<=1||!!editing||background.locked} onClick={()=>deletePage(page.id)}><StudioIcon name="close"/></button></div>;
        })}</div>
        <div className="v2-sidebar-section">
          <div className="v2-sidebar-heading"><strong>Слои {selected?.name}</strong></div>
          {selectedRoot?.type==="frame"&&<LayerRows document={document} ids={selectedRoot.children} selected={nodeIds} onSelect={chooseNode} onDropLayer={moveLayer} onState={(id,patch)=>proAction(()=>({kind:"setLayerState",id,...patch}))}/>}
        </div>
        <div className="v2-sidebar-tip"><StudioIcon name="move" size={17}/> <span>Перетаскивайте страницу в списке для изменения порядка; название над холстом — для перемещения.</span></div></>)}
      </aside>
      <section className="v2-workspace" aria-label="Бесконечная рабочая область">
        <div className="v2-mobile-panel-controls">
          <button aria-label="Открыть страницы" onClick={()=>setLeftOpen(v=>!v)}><StudioIcon name="layers" size={18}/> Страницы</button>
          <button aria-label="Открыть свойства" onClick={()=>setRightOpen(v=>!v)}><StudioIcon name="styles"/> Свойства</button>
        </div>
        <div ref={stageRef} className={`v2-stage ${activeTool==="hand"?"is-hand":""} ${editing?"is-text-editing":""}`}
          onContextMenu={e=>{if(editing)return;e.preventDefault();const id=(e.target as Element).closest<HTMLElement>("[data-studio-node]")?.dataset.studioNode;const ids=id&&canSelect(document,id)?nodeIds.includes(id)?nodeIds:[id]:[];if(id&&ids.includes(id))setSelectedIds(ids);const page=(e.target as Element).closest<HTMLElement>("[data-studio-page]")?.dataset.studioPage;if(page){setSelectedPage(page);if(!id)setSelectedIds([]);}const local=localPoint(e);setMenu({x:Math.max(4,Math.min(sceneSize.width-210,local.x)),y:Math.max(4,Math.min(sceneSize.height-220,local.y)),ids});}} onPointerLeave={()=>{setDistanceMarks([]);setHoveredNodeId(null);}} onPointerDown={stagePointerDown} onPointerMove={stagePointerMove}
          onPointerUp={stagePointerUp} onPointerCancel={stagePointerUp} onDoubleClick={e=>{if(activeTool!=="select")return;const target=(e.target as Element).closest<HTMLElement>("[data-studio-node]");const id=target?.dataset.studioNode;if(id)startText(id);}}>
          <div className="v2-stage-background" style={grid?backgroundStyle:undefined}/>
          <div className="v2-stage-inner" style={{left:inset,top:inset}}>
            <div className="v2-world" style={{
              transform:`translate3d(${viewport.x}px,${viewport.y}px,0) scale(${viewport.zoom})`,
            }}>
              {document.pages.map(page=>{
                const root=document.nodes[page.rootNodeId];
                return <div key={page.id} data-studio-page={page.id} data-artboard-rendered={renderPages.has(page.id)?"true":"false"} className={`v2-frame ${selectedPage===page.id?"is-selected":""}`}
                  style={{left:page.placement.x,top:page.placement.y,width:root.width,height:root.height}}
                  >
                  {renderPages.has(page.id)&&<StudioV2Artboard document={document} mediaUrls={mediaUrls} rootNodeId={page.rootNodeId} editingId={editing?.id} onMeasure={measureText} renderEditor={editing?node=>editing.id===node.id?<StudioV2TextEditor node={node} editing={editing} onRuns={runs=>editTextRuns(node.id,runs)} onRange={updateTextRange} onFinish={finishText}/>:null:undefined}/>}
                </div>;
              })}
            </div>
            {hoverNode&&hoverScreen.length===4&&<>
              <svg className="v2-hover-outline" width={sceneSize.width} height={sceneSize.height} aria-hidden="true"><polygon points={hoverScreen.map(p=>p.x+","+p.y).join(" ")} fill="none" stroke="#2974e5" strokeWidth="1.3"/></svg>
              <div className="v2-hover-measure" aria-hidden="true" style={{left:Math.max(6,Math.min(sceneSize.width-114,hoverX)),top:Math.max(5,Math.min(sceneSize.height-25,hoverY-25))}}>
                {Math.round(hoverNode.width)} × {Math.round(hoverNode.height)} <span>px</span>
              </div>
            </>}
            {selectionScreen.length>0&&<svg className="v2-selection-outline" width={sceneSize.width} height={sceneSize.height} aria-hidden="true"><polygon points={selectionScreen.map(p=>p.x+","+p.y).join(" ")} fill="none" stroke="#2549d9" strokeWidth="1.5"/></svg>}
            {nodeIds.length>0&&!editing&&activeTool==="select"&&canResizeSelection(document,nodeIds)&&selectionScreen.map((point,index)=><button key={index} className="v2-transform-handle" aria-label={"Изменить размер "+["NW","NE","SE","SW"][index]} style={{left:point.x,top:point.y}} onPointerDown={e=>{e.stopPropagation();if(e.button===0)startNodeGesture(e,nodeIds,(["nw","ne","se","sw"] as const)[index]);}}/>)}
            {nodeIds.length>0&&!editing&&activeTool==="select"&&freeSelection(document,nodeIds)&&selectionScreen.length===4&&<button className="v2-transform-rotate" aria-label="Вращение" style={{left:(selectionScreen[0].x+selectionScreen[1].x)/2,top:(selectionScreen[0].y+selectionScreen[1].y)/2-24}} onPointerDown={e=>{e.stopPropagation();if(e.button===0)startNodeGesture(e,nodeIds,undefined,true);}}>↻</button>}
            {menu&&<div className="v2-canvas-menu" role="group" aria-label="Действия со слоями" style={{left:menu.x,top:menu.y}} onPointerDown={e=>e.stopPropagation()}><button disabled={!menu.ids.length} onClick={()=>copyLayers(menu.ids)}>Копировать <kbd>Ctrl+C</kbd></button><button disabled={!hasClipboard} onClick={()=>pasteLayers(false,menu.ids)}>Вставить <kbd>Ctrl+V</kbd></button><button disabled={!menu.ids.length} onClick={()=>pasteLayers(true,menu.ids)}>Дублировать <kbd>Ctrl+D</kbd></button><button disabled={!menu.ids.length} onClick={()=>{proAction(()=>menu.ids.map(id=>({kind:"deleteNode",id})));setSelectedIds([]);}}>Удалить</button><button onClick={()=>setMenu(null)}>Закрыть</button></div>}
            {distanceMarks.length>0&&<svg className="v2-distance-overlay" width={sceneSize.width} height={sceneSize.height} aria-hidden="true">{distanceMarks.map((mark,i)=>{const a=worldToScreen(mark.from,viewport),b=worldToScreen(mark.to,viewport);return <g key={i}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#dc2626" strokeDasharray="3 2"/><text x={(a.x+b.x)/2} y={(a.y+b.y)/2-5} textAnchor="middle" fontSize={11} fill="#dc2626">{Math.round(mark.distance)}</text></g>;})}</svg>}
            {marquee&&<div className="v2-marquee" style={{left:marquee.x,top:marquee.y,width:marquee.width,height:marquee.height}}/>}
            {(sourceDocument.guides??[]).map(g=><div key={g.id} aria-hidden="true" className={"v2-custom-guide v2-custom-guide-"+g.axis} style={g.axis==="x"?{left:g.position*viewport.zoom+viewport.x}:{top:g.position*viewport.zoom+viewport.y}}/>)}
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
            <button onClick={()=>setViewport(v=>zoomAt(v,v.zoom/1.25,{x:sceneSize.width/2,y:sceneSize.height/2}))} aria-label="Уменьшить масштаб"><StudioIcon name="minus" size={16}/></button>
            <span>{zoomPercent}%</span>
            <button onClick={()=>setViewport(v=>zoomAt(v,v.zoom*1.25,{x:sceneSize.width/2,y:sceneSize.height/2}))} aria-label="Увеличить масштаб"><StudioIcon name="plus" size={16}/></button>
            <button onClick={fitAll} aria-label="Показать все страницы" title="Все страницы"><StudioIcon name="fit" size={16}/></button>
          </div>
          <div className="v2-viewport-hint">Колесо — перемещение · Ctrl + колесо — масштаб холста · два пальца — жесты</div>
          <button className="v2-minimap-toggle" onClick={()=>setMinimapOpen(v=>!v)} aria-label="Показать или скрыть мини-карту" aria-expanded={minimapOpen}><StudioIcon name="map" size={17}/></button>
          {minimapOpen&&<MiniMap frames={frames} viewport={viewport} size={sceneSize} onCenter={center}/>}
        </div>
      </section>
      <aside className={`v2-right ${rightOpen?"is-open":""}`} aria-label="Свойства выбранной страницы">
        <InspectorTabs value={inspectorTab} onChange={setInspectorTab}/>
        <div className="v2-inspector-selection"><StudioIcon name={authoredNode?.componentRef?"component":authoredNode?.type==="text"?"text":authoredNode?.type==="image"?"image":authoredNode?.type==="shape"?"shape":"frame"}/><strong>{authoredNode?nodeLabel(sourceDocument,authoredNode.id):nodeIds.length>1?nodeIds.length+" слоёв":selected?.name??"Нет выделения"}</strong></div>
        {selectionError&&<p role="alert" className="v2-inspector-error">{selectionError}</p>}
        <InspectorPanel active={inspectorTab==="design"} label="Дизайн">
        {nodeIds.length>0?<><section className="v2-inspector-section">
          <h3>Трансформация</h3>
          {authoredNode&&<label className="v2-widget-field">Название слоя<input key={authoredNode.id+":"+(authoredNode.layerName??"")} maxLength={100} defaultValue={nodeLabel(sourceDocument,authoredNode.id)} disabled={!!editing} onBlur={e=>{const name=e.target.value.trim();if(name&&name!==nodeLabel(sourceDocument,authoredNode.id))proAction(()=>({kind:"updateNode",id:authoredNode.id,changes:{layerName:name}}));}} onKeyDown={e=>{if(e.key==="Enter")e.currentTarget.blur();}}/></label>}
          {nodeIds.length>0?<><strong className="v2-selected-name">{activeNode?nodeLabel(document,activeNode.id):nodeIds.length+" слоёв"}</strong>
          {activeNode&&<div className="v2-inspector-grid">{(["x","y","width","height","rotation"] as const).map(key=><label key={key}>{({x:"X",y:"Y",width:"W",height:"H",rotation:"°"})[key]}<StudioNumberInput
  key={activeNode.id+":"+key}
  aria-label={({x:"Координата X",y:"Координата Y",width:"Ширина слоя",height:"Высота слоя",rotation:"Угол поворота"})[key]}
  value={Math.round(activeNode[key]*100)/100}
  min={key==="width"||key==="height"?1:key==="rotation"?-360:-1_000_000}
  max={key==="width"||key==="height"?20_000:key==="rotation"?360:1_000_000}
  step={key==="rotation"?1:key==="width"||key==="height"?1:0.1}
  steppers
  disabled={!!editing||inStack&&(key==="x"||key==="y")||(key==="width"||key==="height")&&authoredNode?.sizing?.[key]!==undefined&&authoredNode.sizing[key]!=="fixed"}
  onValueChange={v=>{if(v!==undefined)proAction(()=>({kind:"updateNode",id:activeNode.id,changes:{[key]:v}}));}}/></label>)}</div>}
          {authoredNode&&<label className="v2-layout-field">Непрозрачность (%)<StudioNumberInput aria-label="Непрозрачность слоя" min={0} max={100} value={Math.round(authoredNode.opacity*100)} disabled={!!editing||authoredNode.locked} onChange={e=>{const n=Number(e.target.value);if(e.target.value!==""&&Number.isFinite(n)&&n>=0&&n<=100)proAction(()=>({kind:"updateNode",id:authoredNode.id,changes:{opacity:n/100}}));}}/></label>}
          {nodeIds.length>1&&<button className="v2-inspector-button" onClick={performGroup}>Группировать</button>}
          {activeNode?.type==="frame"&&activeNode.background==="transparent"&&<button className="v2-inspector-button" onClick={performUngroup}>Разгруппировать</button>}
          <button className="v2-inspector-button" onClick={()=>{if(editing)finishText();setSelectedIds([]);}}>Снять выделение</button></>:<p className="v2-placeholder">Выберите слой на холсте или в списке. Shift — несколько слоёв.</p>}
        <InspectorGroup title="Действия со слоями" icon="copy"><div className="v2-pro-actions"><button disabled={!nodeIds.length||!!editing} onClick={()=>copyLayers()}>Копировать</button><button disabled={!hasClipboard||!!editing} onClick={()=>pasteLayers()}>Вставить</button><button disabled={!nodeIds.length||!!editing} onClick={()=>pasteLayers(true)}>Дублировать</button></div>
          {nodeIds.length>=2&&<><p className="v2-placeholder">Выравнивание по границам выделения</p><div className="v2-pro-actions">{(["left","center","right","top","middle","bottom"] as const).map((a,i)=><button key={a} aria-label={["Слева","Центр X","Справа","Сверху","Центр Y","Снизу"][i]} title={["Слева","Центр X","Справа","Сверху","Центр Y","Снизу"][i]} disabled={!!editing||!freeSelection(document,nodeIds)} onClick={()=>proAction(()=>alignSelection(document,nodeIds,a))}><StudioIcon name={a}/></button>)}</div><div className="v2-pro-actions">{(["x","y"] as const).map(axis=><button key={axis} disabled={nodeIds.length<3||!!editing||!freeSelection(document,nodeIds)} onClick={()=>proAction(()=>distributeSelection(document,nodeIds,axis))} title={"Интервал "+axis.toUpperCase()} aria-label={"Интервал "+axis.toUpperCase()}><StudioIcon name={axis==="x"?"distributeX":"distributeY"}/></button>)}</div><div className="v2-pro-actions"><button disabled={!freeSelection(document,nodeIds)||!!editing} onClick={()=>proAction(()=>rotateSelection(document,nodeIds,-15))}>−15°</button><button disabled={!freeSelection(document,nodeIds)||!!editing} onClick={()=>proAction(()=>rotateSelection(document,nodeIds,15))}>+15°</button></div></>}
          {activeNode&&<><label className="v2-layout-field">Переместить в<select value={moveTarget} onChange={e=>setMoveTarget(e.target.value)}><option value="">Выберите фрейм</option>{Object.values(document.nodes).filter(n=>n.type==="frame"&&n.id!==activeNode.id&&n.id!==activeNode.parentId&&!n.locked&&n.visible).map(n=><option key={n.id} value={n.id}>{nodeLabel(document,n.id)} · {n.id.slice(0,12)}</option>)}</select></label><button className="v2-inspector-button" disabled={!moveTarget||!!editing} onClick={moveLayerToFrame}>Переместить слой</button></>}</InspectorGroup></section></>:<section className="v2-inspector-section">
          <h3>Страница</h3>
          {selected&&selectedRoot?<>
            <strong className="v2-selected-name">{selected.name}</strong>
            <label className="v2-widget-field">Название страницы<input key={selected.id+selected.name} defaultValue={selected.name} maxLength={100} disabled={!!editing||selectedRoot.locked} onBlur={e=>{const name=e.target.value.trim();if(name&&name!==selected.name)proAction(()=>({kind:"renamePage",id:selected.id,name}));}} onKeyDown={e=>{if(e.key==="Enter")e.currentTarget.blur();}}/></label>
            <div className="v2-pro-actions"><button disabled={!!editing||document.pages[0].id===selected.id||selectedRoot.locked} onClick={()=>reorderPage(selected.id,document.pages.findIndex(p=>p.id===selected.id)-1)}>↑ Выше</button><button disabled={!!editing||document.pages.at(-1)?.id===selected.id||selectedRoot.locked} onClick={()=>reorderPage(selected.id,document.pages.findIndex(p=>p.id===selected.id)+1)}>↓ Ниже</button></div>
            <button className="v2-inspector-button v2-danger" disabled={document.pages.length<=1||!!editing||selectedRoot.locked} onClick={()=>deletePage(selected.id)}>Удалить страницу</button>
            <p className="v2-placeholder" role="status">{pageStatus||"Удаление и перемещение можно отменить через Ctrl+Z."}</p>
            <div className="v2-inspector-grid">
              <label>X<StudioNumberInput value={Math.round(selected.placement.x)} onChange={e=>{
                const x=Number(e.target.value);
                if(Number.isFinite(x)&&Math.abs(x)<=1_000_000)setSession(s=>dispatchStudioCommand(s,{kind:"movePage",id:selected.id,placement:{...selected.placement,x}}));
              }}/></label>
              <label>Y<StudioNumberInput value={Math.round(selected.placement.y)} onChange={e=>{
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
        </section>}
        {authoredNode&&selectedInstance&&instanceComponent&&<section className="v2-inspector-section v2-linked-inspector"><h3>Связанный компонент</h3><strong>{instanceComponent.name}</strong><p className="v2-placeholder">{authoredNode.id===selectedInstance.id?"Экземпляр":"Вложенный слой"} · {(authoredNode.componentOverrides??[]).length} изменённых свойств</p><label className="v2-widget-field">Вариант<select aria-label="Вариант компонента" disabled={!!editing} value={selectedInstance.componentRef!.variantId} onChange={e=>proAction(()=>({kind:"switchComponentVariant",id:selectedInstance.id,variantId:e.target.value}))}>{instanceComponent.variants.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label><button className="v2-inspector-button" disabled={!!editing||!authoredNode.componentOverrides?.length} onClick={()=>proAction(()=>({kind:"resetComponentOverrides",id:authoredNode.id,scope:"layer"}))}>Сбросить свойства слоя</button><button className="v2-inspector-button" disabled={!!editing} onClick={()=>proAction(()=>({kind:"resetComponentOverrides",id:selectedInstance.id,scope:"instance"}))}>Сбросить экземпляр</button><button className="v2-inspector-button" disabled={!!editing} onClick={()=>proAction(()=>({kind:"detachComponent",id:selectedInstance.id}))}>Отсоединить экземпляр</button><p className="v2-placeholder">Для изменения структуры отсоедините экземпляр или обновите мастер в библиотеке.</p></section>}
        {authoredNode?.componentRef&&!selectedInstance&&<section className="v2-inspector-section"><h3>Компонент</h3><p className="v2-placeholder">Старая независимая копия. Создайте новый связанный экземпляр из библиотеки.</p><button className="v2-inspector-button" onClick={()=>proAction(()=>({kind:"detachComponent",id:authoredNode.id}))}>Отсоединить</button></section>}
        {authoredNode?.type==="text"&&<TextControls node={authoredNode} palette={palette} document={sourceDocument} onUnlink={()=>proAction(()=>({kind:"bindStyle",id:authoredNode.id,slot:"textColor",tokenId:null}))} editing={editing} onStyle={patch=>styleText(authoredNode,patch)} onNode={patch=>{if(authoredNode.tokenRefs?.typography&&("lineHeight" in patch||"letterSpacing" in patch)){setSelectionError("Сначала отсоедините стиль текста.");return;}setSession(s=>dispatchStudioCommand(s,{kind:"updateNode",id:authoredNode.id,changes:patch}));}} onFinish={()=>finishText()}/>}
        {(layoutFrame||authoredNode)&&<InspectorGroup title="Auto Layout и ограничения" icon="frame"><section className="v2-inspector-section">
          <h3>Auto Layout</h3>
          <button className="v2-inspector-button" disabled={!!editing} onClick={addText}>+ Текст (T)</button>
          {activeNode?.type==="text"&&!editing&&<button className="v2-inspector-button" onClick={()=>startText(activeNode.id)}>Редактировать текст</button>}
          <button className="v2-inspector-button" disabled={!!editing} onClick={createFrame}>+ Создать фрейм</button>
          {layoutFrame&&<>
            <label className="v2-layout-field">Расположение<select value={layoutFrame.layout} onChange={e=>editLayout(layoutFrame.id,{layout:e.target.value as "free"|"vertical"|"horizontal"})}><option value="free">Свободное</option><option value="vertical">Вертикальное</option><option value="horizontal">Горизонтальное</option></select></label>
            {layoutFrame.layout!=="free"&&<>
              <label className="v2-layout-field">Gap<StudioNumberInput min={0} max={2000} value={layoutFrame.gap} onChange={e=>editLayout(layoutFrame.id,{gap:Number(e.target.value)})}/></label>
              <div className="v2-inspector-grid">{(["top","right","bottom","left"] as const).map(side=><label key={side}>{({top:"↑",right:"→",bottom:"↓",left:"←"})[side]}<StudioNumberInput aria-label={"Padding "+side} min={0} max={2000} value={layoutFrame.padding[side]} onChange={e=>editLayout(layoutFrame.id,{padding:{...layoutFrame.padding,[side]:Number(e.target.value)}})}/></label>)}</div>
              <label className="v2-layout-field">Выравнивание<select value={layoutFrame.alignment??"start"} onChange={e=>editLayout(layoutFrame.id,{alignment:e.target.value as "start"|"center"|"end"})}><option value="start">Начало</option><option value="center">Центр</option><option value="end">Конец</option></select></label>
              <label className="v2-layout-field">Распределение<select value={layoutFrame.distribution??"start"} onChange={e=>editLayout(layoutFrame.id,{distribution:e.target.value as "start"|"center"|"end"|"space-between"})}><option value="start">Начало</option><option value="center">Центр</option><option value="end">Конец</option><option value="space-between">Между элементами</option></select></label>
            </>}
            <label className="v2-layout-field">Обрезать содержимое<input type="checkbox" checked={layoutFrame.clip} onChange={e=>editLayout(layoutFrame.id,{clip:e.target.checked})}/></label>
          </>}
          {(authoredNode??layoutFrame)&&(()=>{
            const n=(authoredNode??layoutFrame)!;
            const sizing:NonNullable<typeof n.sizing>=n.sizing??{width:"fixed",height:"fixed"};
            return <>{(["width","height"] as const).map(axis=><label key={axis} className="v2-layout-field">{axis==="width"?"Ширина":"Высота"}<select value={sizing[axis]} onChange={e=>editLayout(n.id,{sizing:{...sizing,[axis]:e.target.value as "fixed"|"fill"|"hug"}})}><option value="fixed">Fixed</option>{n.parentId&&<option value="fill">Fill</option>}{n.type==="frame"&&n.layout!=="free"&&<option value="hug">Hug</option>}</select></label>)}
            <div className="v2-inspector-grid">{(["minWidth","maxWidth","minHeight","maxHeight"] as const).map(key=><label key={key}>{({minWidth:"min W",maxWidth:"max W",minHeight:"min H",maxHeight:"max H"})[key]}<StudioNumberInput min={1} max={20000} value={sizing[key]??""} placeholder={key.startsWith("min")?"1":"20000"} onChange={e=>editLayout(n.id,{sizing:{...sizing,[key]:e.target.value===""?undefined:Number(e.target.value)}})}/></label>)}</div>
            {n.parentId&&parent?.type==="frame"&&parent.layout==="free"&&(["x","y"] as const).map(axis=><label key={axis} className="v2-layout-field">Anchor {axis.toUpperCase()}<select value={n.anchors?.[axis]??"start"} onChange={e=>editLayout(n.id,{anchors:{x:"start",y:"start",...n.anchors,[axis]:e.target.value as "start"|"center"|"end"|"stretch"}})}><option value="start">Начало</option><option value="center">Центр</option><option value="end">Конец</option><option value="stretch">Растянуть</option></select></label>)}
            </>;
          })()}
          {inStack&&authoredNode&&parent?.type==="frame"&&<div className="v2-nudge">{[-1,1].map(offset=><button key={offset} disabled={parent.children.indexOf(authoredNode.id)+offset<0||parent.children.indexOf(authoredNode.id)+offset>=parent.children.length} onClick={()=>proAction(()=>({kind:"reorderNode",id:authoredNode.id,index:parent.children.indexOf(authoredNode.id)+offset}))} aria-label={offset<0?"Выше":"Ниже"}><StudioIcon name={offset<0?"top":"bottom"}/></button>)}</div>}
        </section></InspectorGroup>}
        {(authoredNode??(!activeNode&&selectedRoot?sourceDocument.nodes[selectedRoot.id]:null))&&(()=>{const n=(authoredNode??sourceDocument.nodes[selectedRoot!.id]),resolved=resolveStyleNode(sourceDocument,n);return <><InspectorGroup title="Связанные стили" icon="styles"><StyleBindings document={sourceDocument} node={n} disabled={!!editing} onCommand={command=>proAction(()=>command)}/></InspectorGroup><AdvancedProperties key={n.id} document={sourceDocument} node={resolved} palette={palette} authoredNode={n} mediaUrls={mediaUrls} disabled={!!editing||n.locked} onChange={visual=>changeVisual(n,resolved,visual)} onUnlink={slot=>proAction(()=>({kind:"bindStyle",id:n.id,slot,tokenId:null}))}/></>;})()}
        {authoredNode?.type==="image"&&<InspectorGroup title="Изображение" icon="image"><ImageControls node={authoredNode} onChange={patch=>libraryCommands({kind:"updateNode",id:authoredNode.id,changes:{...patch,...(authoredNode.visual?.imageCrop?{visual:{...authoredNode.visual,imageCrop:{...authoredNode.visual.imageCrop,x:patch.focalX??authoredNode.visual.imageCrop.x,y:patch.focalY??authoredNode.visual.imageCrop.y}}}:{})}})}/></InspectorGroup>}
        <InspectorGroup key={authoredNode?.type==="widget"?"widget":"other"} title="Блоки и данные приглашения" icon="component" defaultOpen={authoredNode?.type==="widget"}><InvitationControls remoteSettings={remoteSettings} document={{...sourceDocument,locale}} node={authoredNode} onInsert={insertWidget} onCommand={libraryCommands} disabled={!!editing||!canInsert}/></InspectorGroup>
        </InspectorPanel>
        <InspectorPanel active={inspectorTab==="animation"} label="Анимация"><MotionControls document={sourceDocument} node={authoredNode??(!nodeIds.length&&selectedRoot?sourceDocument.nodes[selectedRoot.id]:null)} ids={nodeIds} disabled={!!editing||!!session.transaction} onCommand={command=>proAction(()=>command)} onPreview={()=>{setTimelineTime(0);setTimelineOpen(true);setPreviewOpen(true);}}/></InspectorPanel>
        <InspectorPanel active={inspectorTab==="responsive"} label="Адаптив"><section className="v2-inspector-section">
          <h3>Адаптивность</h3>
          <button className="v2-inspector-button" disabled={!!editing||!!session.transaction} onClick={()=>setResponsiveOpen(true)}>Открыть Responsive Studio</button>
          <div className="v2-device-switch">{(["desktop","tablet","mobile"] as const).map(d=><button key={d} aria-pressed={device===d} onClick={()=>setDevice(d)}>{({desktop:"Desktop",tablet:"Tablet",mobile:"Mobile"})[d]}</button>)}</div>
          {selected&&currentProfile&&<>
            <label className="v2-layout-field">Режим<select disabled={!!editing} value={currentProfile.mode} onChange={e=>updateProfile({mode:e.target.value as "scale"|"reflow"})}><option value="scale">Масштаб</option><option value="reflow">Reflow</option></select></label>
            <div className="v2-inspector-grid">{(["width","height"] as const).map(axis=><label key={axis}>{axis==="width"?"W":"H"}<StudioNumberInput min={1} max={20000} disabled={!!editing||axis==="height"&&currentProfile.mode==="scale"} value={currentProfile[axis]} onChange={e=>{const v=Number(e.target.value);if(v>=1&&v<=20000)updateProfile({[axis]:v});}}/></label>)}</div>
            <button className="v2-inspector-button" disabled={!!editing} onClick={()=>libraryCommands({kind:"setPageProfile",id:selected.id,device,profile:null})}>Сбросить профиль</button>
          </>}
          {authoredNode&&<>
            <p className="v2-placeholder">Настройки слоя для {device}; основной холст не изменяется.</p>
            <div className="v2-inspector-grid">{(["x","y","width","height"] as const).map(key=><label key={key}>{({x:"X",y:"Y",width:"W",height:"H"})[key]}<StudioNumberInput disabled={!!editing} value={currentOverride[key]??""} placeholder={String(authoredNode[key])} onChange={e=>{const raw=e.target.value,v=Number(raw);if(raw===""){updateOverride({[key]:undefined});return;}if(Number.isFinite(v)&&(key==="width"||key==="height"?v>=1&&v<=20000:Math.abs(v)<=1000000))updateOverride({[key]:v});}}/></label>)}</div>
            <label className="v2-layout-field">Видимый<input type="checkbox" checked={currentOverride.visible??authoredNode.visible} disabled={!!editing} onChange={e=>updateOverride({visible:e.target.checked})}/></label>
            <button className="v2-inspector-button" disabled={!!editing} onClick={()=>libraryCommands({kind:"setResponsiveOverride",id:authoredNode.id,device,patch:null})}>Сбросить слой</button>
          </>}
          <button className="v2-inspector-button" onClick={()=>{if(editing)finishText();setPreviewOpen(true);}}>Открыть предпросмотр</button>
        </section></InspectorPanel>
        <InspectorPanel active={inspectorTab==="canvas"} label="Холст"><section className="v2-inspector-section">
          <h3>Рабочая область</h3>
          <details className="v2-widget-variables"><summary>Направляющие</summary><label className="v2-widget-field">Ось<select value={guideAxis} onChange={e=>setGuideAxis(e.target.value as "x"|"y")}><option value="x">X — вертикальная</option><option value="y">Y — горизонтальная</option></select></label><label className="v2-widget-field">Координата на холсте<StudioNumberInput value={guidePosition} min={-1000000} max={1000000} allowEmpty onChange={e=>setGuidePosition(e.target.value)}/></label><button className="v2-inspector-button" disabled={!!editing||(sourceDocument.guides?.length??0)>=100} onClick={addGuide}>+ Направляющая</button>{(sourceDocument.guides??[]).map(g=><div key={g.id} className="v2-pro-actions"><span>{g.axis.toUpperCase()}: {g.position}</span><button aria-label={"Удалить направляющую "+g.axis+" "+g.position} disabled={!!editing} onClick={()=>proAction(()=>({kind:"setGuides",guides:(sourceDocument.guides??[]).filter(x=>x.id!==g.id)}))}>Удалить</button></div>)}</details>
          <div className="v2-info-row"><span>Масштаб</span><strong>{zoomPercent}%</strong></div>
          <div className="v2-info-row"><span>Страниц</span><strong>{document.pages.length}</strong></div>
          <div className="v2-info-row"><span>Инструмент</span><strong>{activeTool==="hand"?"Рука":"Выделение"}</strong></div>
          <button className="v2-inspector-button" onClick={fitAll}><StudioIcon name="fit" size={15}/> Показать весь проект</button>
        </section></InspectorPanel>
      </aside>
    </div>
    {templateManagerOpen&&<TemplateManager document={sourceDocument} onOpen={openTemplateProject} onClose={()=>setTemplateManagerOpen(false)}/>}
    {printOpen&&<StudioV2PrintDialog document={sourceDocument} selectedPageId={selectedPage??sourceDocument.pages[0]?.id??""} onDownloadJson={()=>downloadDocument(sourceDocument)} onClose={()=>setPrintOpen(false)}/>}
    {publishPanelOpen&&(remoteSettings?<StudioPublishPanel document={sourceDocument} settings={remoteSettings} locale={locale} onClose={()=>setPublishPanelOpen(false)}/>:<StudioPublishUnavailable onClose={()=>setPublishPanelOpen(false)}/>)}
    {cloudPanelOpen&&(remoteSettings?<StudioCloudPanel document={sourceDocument} settings={remoteSettings} onOpenLocalCopy={openTemplateProject} onClose={()=>setCloudPanelOpen(false)}/>:<StudioCloudUnavailable onClose={()=>setCloudPanelOpen(false)}/>)}
    {responsiveOpen&&<ResponsiveEditor document={{...sourceDocument,locale}} initialPageId={selectedPage} initialNodeId={authoredNode?.id??null} initialDevice={device} mediaUrls={mediaUrls} onCommand={command=>proAction(()=>command)} onUndo={changeHistory} canUndo={session.undoStack.length>0} canRedo={session.redoStack.length>0} onClose={()=>setResponsiveOpen(false)}/>}
    {previewOpen&&<div className="v2-preview-overlay" role="dialog" aria-modal="true" aria-label="Предпросмотр приглашения"><header className="v2-preview-header"><strong>Предпросмотр</strong><div className="v2-device-switch">{(["desktop","tablet","mobile"] as const).map(d=><button key={d} aria-pressed={device===d} onClick={()=>setDevice(d)}>{({desktop:"Desktop",tablet:"Tablet",mobile:"Mobile"})[d]}</button>)}</div><div className="v2-motion-preview-actions"><button disabled={!motionTracks(sourceDocument).length} aria-pressed={timelineOpen} onClick={()=>{setTimelineOpen(v=>!v);setTimelineTime(0);}}>Timeline</button><button aria-label="Повторить анимации" disabled={timelineOpen} onClick={()=>setPreviewRun(x=>x+1)}>Повторить</button><button onClick={()=>{setPreviewOpen(false);setTimelineOpen(false);}} aria-label="Закрыть предпросмотр">Закрыть ×</button></div></header><div className="v2-preview-scroll"><div className="v2-preview-device" style={{width:DEVICE_WIDTH[device],maxWidth:"100%"}}><StudioV2ProjectRenderer key={previewRun} document={{...sourceDocument,locale}} mediaUrls={mediaUrls} device={device} motionPlayback={timelineOpen?{mode:"timeline",timeMs:timelineTime}:{mode:"live"}}/></div></div>{timelineOpen&&<MotionTimeline document={sourceDocument} time={timelineTime} onTime={setTimelineTime}/>}</div>}
    {!loaded&&<div className="v2-recovery-overlay" role="dialog" aria-modal="true" aria-label="Локальный проект"><div className="v2-recovery-card">
       <StudioIcon name="lock" size={26}/>
       <h2>{recovery?"Восстановление проекта":loadFailure?"Не удалось загрузить проект":"Открываем проект"}</h2>
       <p>{recovery?"Основная запись повреждена. Найдена предыдущая корректная версия от "+new Date(recovery.savedAt).toLocaleString(locale==="ky"?"ky-KG":"ru-RU")+". Восстановление заменит только повреждённую запись.":loadFailure??"Проверяем локальное хранилище."}</p>
       {recovery&&<button className="v2-inspector-button" disabled={restoring} onClick={()=>void restoreProject()}>Восстановить резервную копию</button>}
       {recovery&&loadFailure&&<p role="alert">{loadFailure}</p>}
       {(loadFailure||recovery)&&<button className="v2-inspector-button" disabled={restoring} onClick={()=>setLoadAttempt(n=>n+1)}>Повторить загрузку</button>}
       {loadFailure&&!recovery&&<p>Не очищайте данные браузера. Повторите загрузку или откройте проект в исходном профиле браузера.</p>}
    </div></div>}
    {(leftOpen||rightOpen)&&<button className="v2-backdrop" onClick={()=>{setLeftOpen(false);setRightOpen(false)}} aria-label="Закрыть панель"/>}
  </main>;
}
function rootSizeLabel(document: ProjectDocumentV2,page:StudioPageV2){
  const root=document.nodes[page.rootNodeId];
  return `${root.width} × ${root.height}`;
}
