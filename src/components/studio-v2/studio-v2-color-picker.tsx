"use client";
import {useEffect,useRef,useState,useId,type PointerEvent} from "react";
import {createPortal} from "react-dom";
import {StudioIcon} from "./studio-icon";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema.ts";
import {effectiveToken} from "@/features/studio-v2/core/style-tokens.ts";
const presets=["#FFFFFF","#FAF7EF","#C7AA78","#707A5C","#263329","#20242B","#000000","#AB665C","#8A9AAA","#E8B4BA","#4A86E8","#635BDB"];
const clamp=(v:number,max=1)=>Math.max(0,Math.min(max,v));
export function normalizeHex(value:string){const s=value.trim().replace(/^#/,"");return /^[\da-f]{6}$/i.test(s)?"#"+s.toUpperCase():/^[\da-f]{3}$/i.test(s)?"#"+s.split("").map(c=>c+c).join("").toUpperCase():null;}
export function hexToHsv(hex:string){
 const color=normalizeHex(hex)??"#000000",r=parseInt(color.slice(1,3),16)/255,g=parseInt(color.slice(3,5),16)/255,b=parseInt(color.slice(5,7),16)/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
 let h=0;if(d)h=max===r?((g-b)/d+6)%6:max===g?(b-r)/d+2:(r-g)/d+4;
 return {h:h*60,s:max?d/max:0,v:max};
}
export function hsvToHex(h:number,s:number,v:number){const hue=((h%360)+360)%360,c=clamp(v)*clamp(s),x=c*(1-Math.abs(hue/60%2-1)),m=clamp(v)-c;const rgb=hue<60?[c,x,0]:hue<120?[x,c,0]:hue<180?[0,c,x]:hue<240?[0,x,c]:hue<300?[x,0,c]:[c,0,x];return "#"+rgb.map(n=>Math.round((n+m)*255).toString(16).padStart(2,"0")).join("").toUpperCase();}
export type PaletteColor={name:string;color:string};
export function projectPalette(doc:ProjectDocumentV2):PaletteColor[]{
 const result:PaletteColor[]=[];const seen=new Set<string>();
 for(const token of Object.values(doc.tokens??{})){const t=effectiveToken(doc,token.id);if(t?.kind==="color"){const color=t.value.toUpperCase();if(!seen.has(color)){seen.add(color);result.push({name:t.name,color});}}}
 for(const n of Object.values(doc.nodes)){const colors=[n.visual?.fill?.kind==="solid"?n.visual.fill.color:undefined,n.type==="text"?n.runs[0]?.style.color:n.type==="shape"?n.fill:n.type==="frame"?n.background:undefined];for(const c of colors){const color=c&&normalizeHex(c);if(color&&!seen.has(color)){seen.add(color);result.push({name:color,color});}}}
 return result.slice(0,24);
}
const recentKey="invito-studio-recent-colors";
function readRecent():string[]{try{const value:unknown=JSON.parse(localStorage.getItem(recentKey)??"[]");return Array.isArray(value)?value.filter((x):x is string=>typeof x==="string"&&!!normalizeHex(x)).slice(0,12):[];}catch{return [];}}
export function ColorPicker({label,value,onChange,palette=[],disabled=false,alpha,onAlphaChange,linkedLabel,onUnlink}:{label:string;value:string;onChange:(color:string)=>void;palette?:PaletteColor[];disabled?:boolean;alpha?:number;onAlphaChange?:(value:number)=>void;linkedLabel?:string;onUnlink?:()=>void}){
 const anchor=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null);
 const id=useId(),[open,setOpen]=useState(false),[position,setPosition]=useState({left:0,top:0}),[draft,setDraft]=useState<string|null>(null),[recent,setRecent]=useState<string[]>([]),[gestureColor,setGestureColor]=useState<string|null>(null);
 const drag=useRef<{pointer:number;color:string}|null>(null),hue=useRef(hexToHsv(value).h);
 const current=gestureColor??normalizeHex(value)??"#000000",hsv=hexToHsv(current),h=hsv.s>.001?hsv.h:hue.current;
 function commit(raw:string){const valid=normalizeHex(raw);if(!valid||disabled||linkedLabel)return;onChange(valid);setDraft(null);const next=[valid,...readRecent().filter(c=>c!==valid)].slice(0,12);setRecent(next);try{localStorage.setItem(recentKey,JSON.stringify(next));}catch{/* optional UI history */}}
 function close(){setOpen(false);setGestureColor(null);drag.current=null;}
 useEffect(()=>{if(!open)return;const locate=()=>{const rect=anchor.current?.getBoundingClientRect();if(!rect)return;const width=Math.min(260,window.innerWidth-16),height=panel.current?.offsetHeight??390;setPosition({left:Math.max(8,Math.min(window.innerWidth-width-8,rect.left-width-8)),top:Math.max(8,Math.min(rect.top,window.innerHeight-height-8))});};locate();const frame=requestAnimationFrame(locate);const outside=(e:globalThis.PointerEvent)=>{if(!panel.current?.contains(e.target as Node)&&!anchor.current?.contains(e.target as Node))close();};const key=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.stopPropagation();close();anchor.current?.focus();}};document.addEventListener("pointerdown",outside);document.addEventListener("keydown",key,true);window.addEventListener("resize",locate);window.addEventListener("scroll",locate,true);return()=>{cancelAnimationFrame(frame);document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",key,true);window.removeEventListener("resize",locate);window.removeEventListener("scroll",locate,true);};},[open]);
 function selectSV(e:PointerEvent<HTMLDivElement>){const rect=e.currentTarget.getBoundingClientRect(),color=hsvToHex(h,clamp((e.clientX-rect.left)/rect.width),1-clamp((e.clientY-rect.top)/rect.height));setGestureColor(color);if(drag.current)drag.current.color=color;}
 const swatches=(colors:PaletteColor[])=> <div className="v2-color-swatches">{colors.map(c=><button type="button" key={c.color} title={c.name} aria-label={"Цвет "+c.name} style={{background:c.color}} onClick={()=>commit(c.color)}/>)}</div>;
 return <div className="v2-color-field"><span className="v2-color-label">{label}</span><div className="v2-color-row">
 <button type="button" ref={anchor} className="v2-color-swatch" aria-label={"Открыть палитру: "+label} aria-expanded={open} disabled={disabled||!!linkedLabel} onClick={()=>{setRecent(readRecent());setOpen(v=>!v);}}><i style={{background:current,opacity:alpha??1}}/></button>
 {linkedLabel?<span className="v2-color-linked"><StudioIcon name="styles"/>{linkedLabel}</span>:<input aria-label={label} id={id} type="text" spellCheck={false} maxLength={7} value={draft??value.toUpperCase()} disabled={disabled} onChange={e=>setDraft(e.target.value)} onBlur={()=>{if(draft!==null)commit(draft);setDraft(null);}} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();e.currentTarget.blur();}if(e.key==="Escape"){e.stopPropagation();setDraft(null);}}}/>}
 {linkedLabel&&onUnlink?<button type="button" className="v2-color-unlink" title="Отсоединить стиль" aria-label={"Отсоединить "+label} onClick={onUnlink}><StudioIcon name="close"/></button>:alpha!==undefined&&onAlphaChange?<input className="v2-alpha-value" aria-label={label+" — прозрачность"} type="number" min={0} max={100} value={Math.round(alpha*100)} disabled={disabled} onChange={e=>{if(e.target.value!==""){const n=Number(e.target.value);if(n>=0&&n<=100)onAlphaChange(n/100);}}}/>:null}
 </div>
 {open&&!linkedLabel&&!disabled&&createPortal(<div ref={panel} className="v2-color-popover" role="dialog" aria-label={"Палитра "+label} style={position}><header><strong>{label}</strong><button type="button" aria-label="Закрыть палитру" onClick={close}><StudioIcon name="close"/></button></header>
 <div className="v2-color-sv" style={{backgroundColor:`hsl(${h},100%,50%)`}} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);drag.current={pointer:e.pointerId,color:current};selectSV(e);}} onPointerMove={e=>{if(drag.current?.pointer===e.pointerId)selectSV(e);}} onPointerUp={e=>{if(drag.current?.pointer===e.pointerId){const color=drag.current.color;drag.current=null;setGestureColor(null);commit(color);}}} onPointerCancel={()=>{drag.current=null;setGestureColor(null);}}><i style={{left:hsv.s*100+"%",top:(1-hsv.v)*100+"%",background:current}}/></div>
 <label className="v2-color-slider-label">Оттенок<input aria-label="Оттенок" className="v2-hue-slider" type="range" min={0} max={359} value={Math.round(h)} onChange={e=>{hue.current=Number(e.target.value);commit(hsvToHex(hue.current,hsv.s||1,hsv.v||1));}}/></label>
 <div className="v2-color-hsv-grid">{(["s","v"] as const).map(k=><label key={k}>{k==="s"?"Насыщенность":"Яркость"}<input type="range" min={0} max={100} value={Math.round(hsv[k]*100)} onChange={e=>commit(hsvToHex(h,k==="s"?Number(e.target.value)/100:hsv.s,k==="v"?Number(e.target.value)/100:hsv.v))}/></label>)}</div>
 <div className="v2-color-popover-value"><span>HEX</span><input aria-label="HEX" value={draft??current} maxLength={7} onChange={e=>setDraft(e.target.value)} onBlur={()=>{if(draft!==null)commit(draft);setDraft(null);}} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();e.currentTarget.blur();}}}/><i style={{background:current}}/></div>
 {alpha!==undefined&&onAlphaChange&&<label className="v2-color-slider-label">Прозрачность<input type="range" min={0} max={100} value={Math.round(alpha*100)} onChange={e=>onAlphaChange(Number(e.target.value)/100)}/></label>}
 {!!palette.length&&<><h4>Цвета проекта</h4>{swatches(palette)}</>}
 {!!recent.length&&<><h4>Недавние</h4>{swatches(recent.map(color=>({name:color,color})))}</>}
 <h4>Палитра</h4>{swatches(presets.map(color=>({name:color,color})))}
 </div>,document.body)}
 </div>;
}
