"use client";
import {useState,useRef,type PointerEvent} from "react";
import type {ProjectDocumentV2,ProjectNodeV2} from "@/features/studio-v2/core/document.schema.ts";
import type {VisualProperties} from "@/features/studio-v2/core/appearance.schema.ts";
import {uniformCorners,ZERO_CORNERS,appearanceCss,contentTransform} from "@/features/studio-v2/core/appearance.ts";
type Props={node:ProjectNodeV2;document:ProjectDocumentV2;mediaUrls:Record<string,string>;onChange:(v:VisualProperties)=>void;disabled?:boolean};
function NumberField({label,value,min,max,step=1,onChange}:{label:string;value:number;min:number;max:number;step?:number;onChange:(n:number)=>void}){
 return <label className="v2-widget-field">{label}<input type="number" min={min} max={max} step={step} value={value} onChange={e=>{const n=Number(e.target.value);if(e.target.value!==""&&Number.isFinite(n)&&n>=min&&n<=max)onChange(n);}}/></label>;
}
function CropPreview({node,document,mediaUrls,onChange}:{node:Extract<ProjectNodeV2,{type:"image"}>;document:ProjectDocumentV2;mediaUrls:Record<string,string>;onChange:(crop:NonNullable<VisualProperties["imageCrop"]>)=>void}){
 const crop=node.visual?.imageCrop??{zoom:1,x:node.focalX,y:node.focalY};
 const [draft,setDraft]=useState<typeof crop|null>(null);
 const drag=useRef<{x:number;y:number;crop:typeof crop}|null>(null);
 const a=document.assets[node.assetId],url=a?.storageKey.startsWith("/images/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+a.storageKey:a?mediaUrls[a.storageKey]:undefined;
 const live=draft??crop;
 function move(e:PointerEvent<HTMLDivElement>){if(!drag.current)return;const r=e.currentTarget.getBoundingClientRect(),d=drag.current;setDraft({...d.crop,x:Math.max(0,Math.min(1,d.crop.x-(e.clientX-d.x)/r.width)),y:Math.max(0,Math.min(1,d.crop.y-(e.clientY-d.y)/r.height))});}
 return <><p className="v2-placeholder">Перетащите изображение внутри рамки или задайте координаты.</p><div className="v2-crop-preview" style={{aspectRatio:String(node.width/node.height)}} onPointerDown={e=>{if(e.button!==0)return;drag.current={x:e.clientX,y:e.clientY,crop};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={move} onPointerUp={()=>{if(drag.current&&draft)onChange(draft);drag.current=null;setDraft(null);}} onPointerCancel={()=>{drag.current=null;setDraft(null);}}>
 {url?<img alt={a?.name??""} src={url} draggable={false} style={{objectFit:node.fit,objectPosition:`${live.x*100}% ${live.y*100}%`,transform:contentTransform({...node,visual:{...node.visual,imageCrop:live}}),transformOrigin:`${live.x*100}% ${live.y*100}%`}}/>:<span>Нет изображения</span>}</div>
 <NumberField label="Масштаб" value={crop.zoom} min={1} max={5} step={.1} onChange={zoom=>onChange({...crop,zoom})}/>
 <NumberField label="Позиция X (%)" min={0} max={100} value={Math.round(crop.x*100)} onChange={x=>onChange({...crop,x:x/100})}/>
 <NumberField label="Позиция Y (%)" min={0} max={100} value={Math.round(crop.y*100)} onChange={y=>onChange({...crop,y:y/100})}/>
 <button className="v2-inspector-button" onClick={()=>onChange({zoom:1,x:.5,y:.5})}>Сбросить обрезку</button></>;
}
export function AdvancedProperties({node,document,mediaUrls,onChange,disabled}:Props){
 const v=node.visual??{},corners=v.corners??ZERO_CORNERS;
 const [separate,setSeparate]=useState(false);
 const update=(patch:Partial<VisualProperties>)=>onChange({...v,...patch});
 const fallback=node.type==="shape"?node.fill:node.type==="frame"&&node.background!=="transparent"?node.background:"#FFFFFF";
 const fill=v.fill??{kind:"solid" as const,color:fallback};
 const stroke=v.stroke===undefined?(node.type==="shape"&&node.stroke?{color:node.stroke,width:node.strokeWidth,style:"solid" as const}:null):v.stroke;
 const shadow=v.shadow??null;
 const roundable=node.type!=="shape"||node.shape==="rectangle";
 return <section className="v2-inspector-section"><h3>Внешний вид</h3><fieldset disabled={disabled} className="v2-appearance-fieldset">
 {roundable&&<><div className="v2-appearance-heading"><strong>Скругление углов</strong><button type="button" aria-pressed={separate} onClick={()=>setSeparate(x=>!x)}>{separate?"Один радиус":"4 угла"}</button></div>
 {separate?<div className="v2-inspector-grid">{(["topLeft","topRight","bottomRight","bottomLeft"] as const).map((c,i)=><NumberField key={c} label={["↖","↗","↘","↙"][i]} value={corners[c]} min={0} max={10000} onChange={n=>update({corners:{...corners,[c]:n}})}/>)}</div>:<NumberField label="Радиус" value={corners.topLeft} min={0} max={10000} onChange={n=>update({corners:uniformCorners(n)})}/>}</>}
 <div className="v2-appearance-heading"><strong>Заливка</strong><span className="v2-fill-chip" style={{background:appearanceCss(node).background}}/></div>
 <label className="v2-widget-field">Тип<select value={v.fill?.kind??(node.type==="shape"||node.type==="frame"&&node.background!=="transparent"?"solid":"none")} onChange={e=>update({fill:e.target.value==="linear"?{kind:"linear",angle:90,stops:[{color:fallback,position:0},{color:"#707A5C",position:100}]}:e.target.value==="solid"?{kind:"solid",color:fallback}:{kind:"none"}})}><option value="none">Нет</option><option value="solid">Цвет</option><option value="linear">Линейный градиент</option></select></label>
 {fill.kind==="solid"&&(v.fill?.kind==="solid"||!v.fill&&(node.type==="shape"||node.type==="frame"&&node.background!=="transparent"))&&<label className="v2-widget-field">Цвет<input type="color" value={fill.color} onChange={e=>update({fill:{kind:"solid",color:e.target.value}})}/></label>}
 {fill.kind==="linear"&&<><NumberField label="Угол" min={0} max={360} value={fill.angle} onChange={angle=>update({fill:{...fill,angle}})}/>{fill.stops.map((stop,i)=><div key={i} className="v2-pro-actions"><input aria-label={"Цвет точки "+(i+1)} type="color" value={stop.color} onChange={e=>update({fill:{...fill,stops:fill.stops.map((s,j)=>i===j?{...s,color:e.target.value}:s)}})}/><NumberField label="%" min={fill.stops[i-1]?.position??0} max={fill.stops[i+1]?.position??100} value={stop.position} onChange={position=>update({fill:{...fill,stops:fill.stops.map((s,j)=>i===j?{...s,position}:s)}})}/><button disabled={fill.stops.length<=2} onClick={()=>update({fill:{...fill,stops:fill.stops.filter((_,j)=>i!==j)}})}>−</button></div>)}<button className="v2-inspector-button" disabled={fill.stops.length>=8} onClick={()=>update({fill:{...fill,stops:[...fill.stops,{color:"#FFFFFF",position:100}]}})}>+ Точка градиента</button></>}
 <label className="v2-widget-field">Обводка<input type="checkbox" checked={!!stroke} onChange={e=>update({stroke:e.target.checked?{color:"#20242B",width:1,style:"solid"}:null})}/></label>
 {stroke&&<><label className="v2-widget-field">Цвет обводки<input type="color" value={stroke.color} onChange={e=>update({stroke:{...stroke,color:e.target.value}})}/></label><NumberField label="Толщина" min={0} max={100} value={stroke.width} onChange={width=>update({stroke:{...stroke,width}})}/><label className="v2-widget-field">Линия<select value={stroke.style} onChange={e=>update({stroke:{...stroke,style:e.target.value as typeof stroke.style}})}><option value="solid">Сплошная</option><option value="dashed">Пунктир</option><option value="dotted">Точки</option></select></label></>}
 <label className="v2-widget-field">Тень<input type="checkbox" checked={!!shadow} onChange={e=>update({shadow:e.target.checked?{color:"#000000",x:0,y:8,blur:20,spread:0,opacity:.25}:null})}/></label>
 {shadow&&<><label className="v2-widget-field">Цвет тени<input type="color" value={shadow.color} onChange={e=>update({shadow:{...shadow,color:e.target.value}})}/></label><div className="v2-inspector-grid">{(["x","y","blur","spread","opacity"] as const).map(k=><NumberField key={k} label={k} min={k==="blur"||k==="opacity"?0:-2000} max={k==="blur"?300:k==="opacity"?1:2000} step={k==="opacity"?.05:1} value={shadow[k]} onChange={n=>update({shadow:{...shadow,[k]:n}})}/>)}</div></>}
 <NumberField label="Размытие" min={0} max={100} value={v.blur??0} onChange={blur=>update({blur})}/>
 {(node.type==="shape"||node.type==="image")&&<><label className="v2-widget-field">Маска<select value={v.mask??"rectangle"} onChange={e=>update({mask:e.target.value as VisualProperties["mask"]})}><option value="rectangle">Обычная</option><option value="ellipse">Эллипс</option><option value="diamond">Ромб</option></select></label><div className="v2-pro-actions"><button aria-pressed={!!v.flipX} onClick={()=>update({flipX:!v.flipX})}>↔ Flip X</button><button aria-pressed={!!v.flipY} onClick={()=>update({flipY:!v.flipY})}>↕ Flip Y</button></div></>}
 {node.type==="image"&&<CropPreview node={node} document={document} mediaUrls={mediaUrls} onChange={imageCrop=>update({imageCrop})}/>}
 <button className="v2-inspector-button" onClick={()=>onChange({})}>Сбросить внешний вид</button>
 </fieldset></section>;
}
