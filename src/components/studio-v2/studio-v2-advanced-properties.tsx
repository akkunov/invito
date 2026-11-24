"use client";
import {StudioNumberInput} from "./studio-number-input";
import {useState,useRef,type PointerEvent} from "react";
import {ColorPicker,type PaletteColor} from "./studio-v2-color-picker";
import {InspectorGroup} from "./studio-v2-inspector-shell";
import {StudioIcon} from "./studio-icon";
import {effectiveToken} from "@/features/studio-v2/core/style-tokens.ts";
import type {TokenSlot} from "@/features/studio-v2/core/style-tokens.schema.ts";
import type {ProjectDocumentV2,ProjectNodeV2} from "@/features/studio-v2/core/document.schema.ts";
import type {VisualProperties} from "@/features/studio-v2/core/appearance.schema.ts";
import {uniformCorners,ZERO_CORNERS,appearanceCss,contentTransform} from "@/features/studio-v2/core/appearance.ts";
type Props={node:ProjectNodeV2;authoredNode?:ProjectNodeV2;palette?:PaletteColor[];onUnlink?:(slot:TokenSlot)=>void;document:ProjectDocumentV2;mediaUrls:Record<string,string>;onChange:(v:VisualProperties)=>void;disabled?:boolean};
function NumberField({label,value,min,max,step=1,onChange}:{label:string;value:number;min:number;max:number;step?:number;onChange:(n:number)=>void}){
 return <label className="v2-widget-field">{label}<StudioNumberInput  min={min} max={max} step={step} value={value} onChange={e=>{const n=Number(e.target.value);if(e.target.value!==""&&Number.isFinite(n)&&n>=min&&n<=max)onChange(n);}}/></label>;
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
export function AdvancedProperties({node,authoredNode=node,palette=[],document,mediaUrls,onChange,onUnlink,disabled}:Props){
 const v=node.visual??{},corners=v.corners??ZERO_CORNERS;
 const [separate,setSeparate]=useState(()=>new Set(Object.values(corners)).size>1);
 const update=(patch:Partial<VisualProperties>)=>onChange({...v,...patch});
 const fallback=node.type==="shape"?node.fill:node.type==="frame"&&node.background!=="transparent"?node.background:"#FFFFFF";
 const fill=v.fill??{kind:"solid" as const,color:fallback};
 const stroke=v.stroke===undefined?(node.type==="shape"&&node.stroke?{color:node.stroke,width:node.strokeWidth,style:"solid" as const}:null):v.stroke;
 const shadow=v.shadow??null;
 const roundable=node.type!=="shape"||node.shape==="rectangle";
 const linked=(slot:TokenSlot)=>{const ref=authoredNode.tokenRefs?.[slot];return ref?effectiveToken(document,ref)?.name:undefined;};
 const unlink=(slot:TokenSlot)=>onUnlink?()=>onUnlink(slot):undefined;
 const fillLinked=linked("fill"),strokeLinked=linked("stroke"),effectLinked=linked("effect"),radiusLinked=linked("corners");
 return <section className="v2-inspector-section v2-visual-controls"><h3>Внешний вид</h3><fieldset disabled={disabled} className="v2-appearance-fieldset">
 {roundable&&<><div className="v2-appearance-heading"><strong>Скругление углов</strong><button type="button" title={separate?"Один радиус":"4 угла"} aria-label={separate?"Один радиус":"4 угла"} aria-pressed={separate} onClick={()=>setSeparate(x=>!x)}><StudioIcon name={separate?"radius":"corners"}/></button></div>
 {radiusLinked?<div className="v2-linked-field"><StudioIcon name="styles"/>{radiusLinked}<button aria-label="Отсоединить стиль углов" onClick={unlink("corners")}><StudioIcon name="close"/></button></div>:separate?<div className="v2-inspector-grid">{(["topLeft","topRight","bottomRight","bottomLeft"] as const).map((c,i)=><NumberField key={c} label={["↖","↗","↘","↙"][i]} value={corners[c]} min={0} max={10000} onChange={n=>update({corners:{...corners,[c]:n}})}/>)}</div>:<NumberField label="Радиус" value={corners.topLeft} min={0} max={10000} onChange={n=>update({corners:uniformCorners(n)})}/>}</>}
 <InspectorGroup title="Заливка" defaultOpen={node.type==="shape"||node.type==="frame"} icon="shape">
 {fillLinked?<div className="v2-linked-field"><span className="v2-fill-chip" style={{background:appearanceCss(node).background}}/><span>{fillLinked}</span><button aria-label="Отсоединить стиль заливки" onClick={unlink("fill")}><StudioIcon name="close"/></button></div>:<>
 <label className="v2-widget-field">Тип<select value={v.fill?.kind??(node.type==="shape"||node.type==="frame"&&node.background!=="transparent"?"solid":"none")} onChange={e=>update({fill:e.target.value==="linear"?{kind:"linear",angle:90,stops:[{color:fallback,position:0},{color:"#707A5C",position:100}]}:e.target.value==="solid"?{kind:"solid",color:fallback}:{kind:"none"}})}><option value="none">Нет</option><option value="solid">Цвет</option><option value="linear">Линейный градиент</option></select></label>
 {fill.kind==="solid"&&(v.fill?.kind==="solid"||!v.fill&&(node.type==="shape"||node.type==="frame"&&node.background!=="transparent"))&&<ColorPicker label="Цвет заливки" value={fill.color} palette={palette} onChange={color=>update({fill:{kind:"solid",color}})}/>}
 {fill.kind==="linear"&&<><div className="v2-gradient-rail" style={{background:appearanceCss(node).background}}>{fill.stops.map((stop,i)=><i key={i} style={{left:stop.position+"%",background:stop.color}}/>)}</div><NumberField label="Угол" min={0} max={360} value={fill.angle} onChange={angle=>update({fill:{...fill,angle}})}/>{fill.stops.map((stop,i)=><div key={i} className="v2-gradient-stop"><ColorPicker label={"Цвет точки "+(i+1)} value={stop.color} palette={palette} onChange={color=>update({fill:{...fill,stops:fill.stops.map((s,j)=>i===j?{...s,color}:s)}})}/><NumberField label="%" min={fill.stops[i-1]?.position??0} max={fill.stops[i+1]?.position??100} value={stop.position} onChange={position=>update({fill:{...fill,stops:fill.stops.map((s,j)=>i===j?{...s,position}:s)}})}/><button aria-label={"Удалить точку "+(i+1)} disabled={fill.stops.length<=2} onClick={()=>update({fill:{...fill,stops:fill.stops.filter((_,j)=>i!==j)}})}><StudioIcon name="minus"/></button></div>)}<button className="v2-inspector-button" disabled={fill.stops.length>=8} onClick={()=>update({fill:{...fill,stops:[...fill.stops,{color:"#FFFFFF",position:100}]}})}><StudioIcon name="plus"/> Точка градиента</button></>}
 </>}
 </InspectorGroup>
 <InspectorGroup title="Обводка" icon="shape" defaultOpen={!!stroke}>
 {strokeLinked?<div className="v2-linked-field"><StudioIcon name="styles"/>{strokeLinked}<button aria-label="Отсоединить стиль обводки" onClick={unlink("stroke")}><StudioIcon name="close"/></button></div>:<>
 <label className="v2-layout-field">Обводка<input type="checkbox" checked={!!stroke} onChange={e=>update({stroke:e.target.checked?{color:"#20242B",width:1,style:"solid"}:null})}/></label>
 {stroke&&<><ColorPicker label="Цвет обводки" value={stroke.color} palette={palette} onChange={color=>update({stroke:{...stroke,color}})}/><NumberField label="Толщина" min={0} max={100} value={stroke.width} onChange={width=>update({stroke:{...stroke,width}})}/><label className="v2-widget-field">Линия<select value={stroke.style} onChange={e=>update({stroke:{...stroke,style:e.target.value as typeof stroke.style}})}><option value="solid">Сплошная</option><option value="dashed">Пунктир</option><option value="dotted">Точки</option></select></label></>}</>}
 </InspectorGroup>
 <InspectorGroup title="Эффекты" icon="styles" defaultOpen={!!shadow||!!v.blur}>
 {effectLinked?<div className="v2-linked-field"><StudioIcon name="styles"/>{effectLinked}<button aria-label="Отсоединить стиль эффектов" onClick={unlink("effect")}><StudioIcon name="close"/></button></div>:<>
 <label className="v2-layout-field">Тень<input type="checkbox" checked={!!shadow} onChange={e=>update({shadow:e.target.checked?{color:"#000000",x:0,y:8,blur:20,spread:0,opacity:.25}:null})}/></label>
 {shadow&&<><ColorPicker label="Цвет тени" value={shadow.color} palette={palette} alpha={shadow.opacity} onAlphaChange={opacity=>update({shadow:{...shadow,opacity}})} onChange={color=>update({shadow:{...shadow,color}})}/><div className="v2-inspector-grid">{(["x","y","blur","spread"] as const).map(k=><NumberField key={k} label={k} min={k==="blur"?0:-2000} max={k==="blur"?300:2000} value={shadow[k]} onChange={n=>update({shadow:{...shadow,[k]:n}})}/>)}</div></>}
 <NumberField label="Размытие" min={0} max={100} value={v.blur??0} onChange={blur=>update({blur})}/></>}
 </InspectorGroup>
 {(node.type==="shape"||node.type==="image")&&<InspectorGroup title="Маска и отражение" icon="flipX"><label className="v2-widget-field">Маска<select value={v.clipPolygon?"custom":v.mask??"rectangle"} onChange={e=>update({mask:e.target.value as VisualProperties["mask"],clipPolygon:undefined})}>{v.clipPolygon&&<option value="custom" disabled>Свободный контур</option>}<option value="rectangle">Обычная</option><option value="ellipse">Эллипс</option><option value="diamond">Ромб</option><option value="arch">Арка</option></select></label><div className="v2-icon-strip"><button title="Отразить по горизонтали" aria-label="Flip X" aria-pressed={!!v.flipX} onClick={()=>update({flipX:!v.flipX})}><StudioIcon name="flipX"/></button><button title="Отразить по вертикали" aria-label="Flip Y" aria-pressed={!!v.flipY} onClick={()=>update({flipY:!v.flipY})}><StudioIcon name="flipY"/></button></div></InspectorGroup>}
 {node.type==="image"&&<InspectorGroup title="Обрезка изображения" icon="image"><CropPreview node={node} document={document} mediaUrls={mediaUrls} onChange={imageCrop=>update({imageCrop})}/></InspectorGroup>}
 <button className="v2-inspector-button" disabled={!!fillLinked||!!strokeLinked||!!effectLinked||!!radiusLinked} onClick={()=>onChange({})}>Сбросить внешний вид</button>
 </fieldset></section>;
}
