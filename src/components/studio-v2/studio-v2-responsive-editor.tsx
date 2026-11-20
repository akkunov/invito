"use client";
import {StudioNumberInput} from "./studio-number-input";
import {useCallback,useMemo,useRef,useState,type PointerEvent} from "react";
import type {ProjectDocumentV2,ProjectNodeV2,StudioPageV2} from "@/features/studio-v2/core/document.schema.ts";
import {bindDocument} from "@/features/studio-v2/core/invitation-behavior.ts";
import {resolveStyleDocument} from "@/features/studio-v2/core/style-tokens.ts";
import {responsiveDocument,responsiveSource,presentationSize,pageProfile,type Device,type NodeOverride,type PageProfile} from "@/features/studio-v2/core/responsive-engine.ts";
import {canDragDeviceNode,canResizeDeviceNode,deviceGesture,devicePatch} from "@/features/studio-v2/core/responsive-editing.ts";
import {nodeCorners,canSelect} from "@/features/studio-v2/core/selection-transform.ts";
import {applyStudioCommand,type StudioCommand} from "@/features/studio-v2/core/command-engine.ts";
import {StudioV2Artboard} from "./studio-v2-artboard";

const devices=["desktop","tablet","mobile"] as const;
const labels={desktop:"Desktop",tablet:"Tablet",mobile:"Mobile"};
const widths={desktop:440,tablet:290,mobile:190};
function label(doc:ProjectDocumentV2,n:ProjectNodeV2){return n.layerName??(n.type==="frame"?n.name:n.type==="text"?n.runs.map(r=>r.text).join("").slice(0,45):n.type==="image"?doc.assets[n.assetId]?.name??"Фото":n.type==="widget"?"Блок":"Фигура");}
function pageNodes(doc:ProjectDocumentV2,root:string){
 const result:ProjectNodeV2[]=[];function visit(id:string){const n=doc.nodes[id];if(!n)return;result.push(n);if(n.type==="frame")n.children.forEach(visit);}visit(root);return result;
}
function NumberField({label,value,placeholder,min,max,step=1,onChange,disabled}:{label:string;value:number|undefined;placeholder?:number;min:number;max:number;step?:number;onChange:(n:number|undefined)=>void;disabled?:boolean}){
 return <label className="v2-widget-field">{label}<StudioNumberInput min={min} max={max} step={step} allowEmpty value={value??""} placeholder={placeholder===undefined?undefined:String(Math.round(placeholder*100)/100)} disabled={disabled} onChange={e=>{const v=e.target.value;if(v===""){onChange(undefined);return;}const n=Number(v);if(Number.isFinite(n)&&n>=min&&n<=max)onChange(n);}}/></label>;
}
type Props={document:ProjectDocumentV2;initialPageId:string|null;initialNodeId:string|null;initialDevice:Device;mediaUrls:Record<string,string>;onCommand:(command:StudioCommand)=>void;onUndo:(redo?:boolean)=>void;canUndo:boolean;canRedo:boolean;onClose:()=>void};
type Gesture={pointer:number;id:string;x:number;y:number;scale:number;resolved:ProjectDocumentV2;source:ProjectDocumentV2;resize:boolean;command:StudioCommand|null};

function DeviceArtboard({document,page,device,active,id,mediaUrls,onSelect,onCommand}:{document:ProjectDocumentV2;page:StudioPageV2;device:Device;active:boolean;id:string;mediaUrls:Record<string,string>;onSelect:(device:Device,id:string)=>void;onCommand:(c:StudioCommand)=>void}){
 const [measurements,setMeasurements]=useState<Record<string,number>>({});
 const [draft,setDraft]=useState<StudioCommand|null>(null);
 const gesture=useRef<Gesture|null>(null);
 const draftDoc=useMemo(()=>{if(!draft)return document;try{return applyStudioCommand(document,draft);}catch{return document;}},[document,draft]);
 const resolved=useMemo(()=>responsiveDocument(resolveStyleDocument(bindDocument(draftDoc)),device,measurements),[draftDoc,device,measurements]);
 const measure=useCallback((id:string,height:number)=>setMeasurements(old=>old[id]===height?old:{...old,[id]:height}),[]);
 const size=presentationSize(document,resolved,page,device),zoom=Math.min(1,widths[device]/size.width),scale=zoom*size.scale;
 const w=size.width*zoom,h=size.height*zoom;
 const n=resolved.nodes[id];
 const selectable=n&&n.parentId!==null&&canSelect(resolved,id)&&pageNodes(resolved,page.rootNodeId).some(n=>n.id===id);
 const corners=selectable?nodeCorners(resolved,id).map(p=>({x:(p.x-page.placement.x)*scale,y:(p.y-page.placement.y)*scale})):[];
 function down(e:PointerEvent<HTMLDivElement>){
  if(e.button!==0)return;
  const target=e.target as HTMLElement;
  const resize=!!target.closest("[data-device-resize]");
  const nodeId=resize?id:target.closest<HTMLElement>("[data-studio-node]")?.dataset.studioNode??page.rootNodeId;
  if(!resolved.nodes[nodeId])return;
  onSelect(device,nodeId);
  if(!(resize?canResizeDeviceNode(resolved,nodeId):canDragDeviceNode(resolved,nodeId)))return;
  e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
  gesture.current={pointer:e.pointerId,id:nodeId,x:e.clientX,y:e.clientY,scale,source:document,resolved,resize,command:null};
 }
 function move(e:PointerEvent<HTMLDivElement>){
  const g=gesture.current;if(!g||g.pointer!==e.pointerId)return;
  const dx=e.clientX-g.x,dy=e.clientY-g.y;
  if(Math.hypot(dx,dy)<2&&!g.command)return;
  try{const command=deviceGesture(g.source,g.resolved,g.id,device,{x:dx/g.scale,y:dy/g.scale},g.resize?"se":undefined,e.shiftKey);applyStudioCommand(g.source,command);g.command=command;setDraft(command);}catch{/* Keep last valid draft. */}
 }
 function finish(e:PointerEvent<HTMLDivElement>,cancel=false){
  const g=gesture.current;if(!g||g.pointer!==e.pointerId)return;
  gesture.current=null;setDraft(null);
  if(!cancel&&g.command)onCommand(g.command);
 }
 return <article className={"v2-device-artboard"+(active?" is-active":"")} data-responsive-device={device}>
 <button className="v2-device-title" aria-pressed={active} onClick={()=>onSelect(device,id)}><strong>{labels[device]}</strong><span>{Math.round(size.width)} × {Math.round(size.height)}</span></button>
 <div data-responsive-canvas={device} className="v2-responsive-canvas" style={{width:w,height:h}} onPointerDown={down} onPointerMove={move} onPointerUp={e=>finish(e)} onPointerCancel={e=>finish(e,true)} onLostPointerCapture={e=>finish(e,true)}>
  <div style={{position:"absolute",left:0,top:0,transformOrigin:"top left",transform:`scale(${scale})`}}><StudioV2Artboard document={resolved} rootNodeId={page.rootNodeId} guest={{mode:"studio"}} mediaUrls={mediaUrls} onMeasure={measure}/></div>
  {corners.length===4&&<><svg className="v2-responsive-outline" width={w} height={h} aria-hidden="true"><polygon points={corners.map(p=>p.x+","+p.y).join(" ")} fill="none" stroke={active?"#635BDB":"#a7a1da"} strokeWidth={active?2:1}/></svg>{active&&canResizeDeviceNode(resolved,id)&&<button type="button" data-device-resize aria-label={"Изменить размер "+labels[device]} className="v2-responsive-handle" style={{left:corners[2].x,top:corners[2].y}}/>}</>}
 </div></article>;
}
export function ResponsiveEditor({document,initialPageId,initialNodeId,initialDevice,mediaUrls,onCommand,onUndo,canUndo,canRedo,onClose}:Props){
 const [pageId,setPageId]=useState(initialPageId??document.pages[0].id);
 const [selected,setSelected]=useState(initialNodeId??"");
 const [device,setDevice]=useState<Device>(initialDevice);
 const page=document.pages.find(p=>p.id===pageId)??document.pages[0];
 const nodes=pageNodes(document,page.rootNodeId);
 const id=nodes.some(n=>n.id===selected)?selected:page.rootNodeId;
 const node=document.nodes[id];
 const styled=useMemo(()=>resolveStyleDocument(bindDocument(document)),[document]);
 const raw=responsiveSource(styled,device).nodes[id];
 const resolved=responsiveDocument(styled,device);
 const profile=pageProfile(document,page,device),patch=document.responsiveOverrides?.[device]?.[id]??{};
 const locked=node.locked||(()=>{let p=node.parentId;while(p){const n=document.nodes[p];if(n.locked)return true;p=n.parentId;}return false;})();
 const isRoot=node.parentId===null;
 const update=(p:NodeOverride)=>onCommand(devicePatch(document,id,device,p));
 const updateProfile=(p:Partial<PageProfile>)=>onCommand({kind:"setPageProfile",id:page.id,device,profile:{...profile,...p}});
 const reset=()=>onCommand({kind:"setResponsiveOverride",id,device,patch:null});
 function select(d:Device,id:string){setDevice(d);setSelected(id);}
 return <div className="v2-preview-overlay v2-responsive-editor" role="dialog" aria-modal="true" aria-label="Адаптивный редактор">
 <header className="v2-preview-header"><strong>Responsive Studio</strong><label className="v2-responsive-page">Страница<select aria-label="Страница адаптивного редактора" value={page.id} onChange={e=>{setPageId(e.target.value);setSelected("");}}>{document.pages.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="v2-responsive-actions"><button disabled={!canUndo} onClick={()=>onUndo()} aria-label="Отменить адаптивное изменение">↶</button><button disabled={!canRedo} onClick={()=>onUndo(true)} aria-label="Повторить адаптивное изменение">↷</button><button aria-label="Закрыть адаптивный редактор" onClick={onClose}>Закрыть ×</button></div></header>
 <div className="v2-responsive-body"><div className="v2-responsive-stage"><div className="v2-responsive-artboards">{devices.map(d=><DeviceArtboard key={page.id+"-"+d} document={document} page={page} device={d} id={id} active={device===d} mediaUrls={mediaUrls} onSelect={select} onCommand={onCommand}/>)}</div></div>
 <aside className="v2-responsive-inspector"><h3>{labels[device]} · Overrides</h3><p className="v2-placeholder">Изменения относятся только к выбранному устройству. Пустые поля наследуют базу.</p>
 <label className="v2-widget-field">Устройство<select aria-label="Устройство редактирования" value={device} onChange={e=>setDevice(e.target.value as Device)}>{devices.map(d=><option key={d} value={d}>{labels[d]}</option>)}</select></label>
 <label className="v2-widget-field">Слой<select aria-label="Адаптивный слой" value={id} onChange={e=>setSelected(e.target.value)}>{nodes.map(n=><option key={n.id} value={n.id}>{label(document,n)}</option>)}</select></label>
 <fieldset disabled={locked} className="v2-appearance-fieldset">
 <h3>Профиль страницы</h3><label className="v2-widget-field">Режим<select aria-label="Адаптивный режим" value={profile.mode} onChange={e=>updateProfile({mode:e.target.value as PageProfile["mode"]})}><option value="scale">Scale</option><option value="reflow">Reflow</option></select></label>
 <NumberField label="Ширина страницы" value={profile.width} min={1} max={20000} onChange={width=>width!==undefined&&updateProfile({width})}/>
 <NumberField label="Высота страницы" value={profile.height} min={1} max={20000} disabled={profile.mode==="scale"} onChange={height=>height!==undefined&&updateProfile({height})}/>
 <button className="v2-inspector-button" onClick={()=>onCommand({kind:"setPageProfile",id:page.id,device,profile:null})}>Сбросить профиль устройства</button>
 </fieldset>
 <fieldset disabled={locked} className="v2-appearance-fieldset"><h3>Слой · {label(document,node)}</h3>
 {!isRoot&&<><div className="v2-inspector-grid">{(["x","y","width","height","rotation","opacity"] as const).map(key=><NumberField key={key} label={{x:"X",y:"Y",width:"W",height:"H",rotation:"Угол",opacity:"Opacity"}[key]} value={patch[key]} placeholder={raw[key]} min={key==="width"||key==="height"?1:key==="opacity"?0:key==="rotation"?-360:-1e6} max={key==="width"||key==="height"?20000:key==="opacity"?1:key==="rotation"?360:1e6} step={key==="opacity"?.05:1} onChange={n=>update({[key]:n})}/>)}</div>
 <label className="v2-widget-field">Видимость<select aria-label="Видимость устройства" value={patch.visible===undefined?"inherit":patch.visible?"show":"hide"} onChange={e=>update({visible:e.target.value==="inherit"?undefined:e.target.value==="show"})}><option value="inherit">Наследовать</option><option value="show">Показать</option><option value="hide">Скрыть</option></select></label>
 {!canDragDeviceNode(resolved,id)&&<p className="v2-placeholder">Позиция управляется Auto Layout, видимостью или блокировкой. Используйте свойства контейнера.</p>}</>}
 {node.type==="text"&&raw.type==="text"&&<><h3>Типографика</h3>{(["fontSize","lineHeight","letterSpacing"] as const).map(key=><NumberField key={key} label={{fontSize:"Размер текста",lineHeight:"Интерлиньяж",letterSpacing:"Трекинг"}[key]} value={patch.textStyle?.[key]} placeholder={key==="fontSize"?raw.runs[0].style.fontSize:key==="lineHeight"?raw.lineHeight??1.14:raw.letterSpacing??0} min={key==="fontSize"?6:key==="lineHeight"?.8:-10} max={key==="fontSize"?400:key==="lineHeight"?4:60} step={key==="fontSize"?1:.1} onChange={n=>update({textStyle:{...patch.textStyle,[key]:n}})}/>)}
 <label className="v2-widget-field">Выравнивание текста<select value={patch.textStyle?.textAlign??""} onChange={e=>update({textStyle:{...patch.textStyle,textAlign:(e.target.value||undefined) as "left"|"center"|"right"|undefined}})}><option value="">Наследовать</option><option value="left">Слева</option><option value="center">Центр</option><option value="right">Справа</option></select></label></>}
 {node.type==="frame"&&raw.type==="frame"&&<><h3>Auto Layout</h3><label className="v2-widget-field">Layout<select aria-label="Layout устройства" value={patch.frameLayout?.layout??""} onChange={e=>update({frameLayout:{...patch.frameLayout,layout:(e.target.value||undefined) as "free"|"vertical"|"horizontal"|undefined}})}><option value="">Наследовать</option><option value="free">Free</option><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option></select></label>
 <NumberField label="Gap" value={patch.frameLayout?.gap} placeholder={raw.gap} min={0} max={2000} onChange={gap=>update({frameLayout:{...patch.frameLayout,gap}})}/>
 <label className="v2-widget-field">Alignment<select value={patch.frameLayout?.alignment??""} onChange={e=>update({frameLayout:{...patch.frameLayout,alignment:(e.target.value||undefined) as "start"|"center"|"end"|undefined}})}><option value="">Наследовать</option><option value="start">Start</option><option value="center">Center</option><option value="end">End</option></select></label>
 <label className="v2-widget-field">Distribution<select value={patch.frameLayout?.distribution??""} onChange={e=>update({frameLayout:{...patch.frameLayout,distribution:(e.target.value||undefined) as "start"|"center"|"end"|"space-between"|undefined}})}><option value="">Наследовать</option><option value="start">Start</option><option value="center">Center</option><option value="end">End</option><option value="space-between">Space between</option></select></label>
 <div className="v2-inspector-grid">{(["top","right","bottom","left"] as const).map(key=><NumberField key={key} label={key} value={patch.frameLayout?.padding?.[key]} placeholder={raw.padding[key]} min={0} max={2000} onChange={n=>update({frameLayout:{...patch.frameLayout,padding:n===undefined?undefined:{...raw.padding,[key]:n}}})}/>)}</div></>}
 <button className="v2-inspector-button" disabled={!Object.keys(patch).length} onClick={reset}>Сбросить адаптивный слой</button>
 </fieldset></aside></div></div>;
}
