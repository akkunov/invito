"use client";
import {useEffect,useRef,useState} from "react";
import {StudioIcon,type StudioIconName} from "./studio-icon";
import type {ProjectDocumentV2,ProjectNodeV2} from "@/features/studio-v2/core/document.schema.ts";
import {motionPresets,motionTriggers,motionEasings,defaultMotion,type MotionSpec} from "@/features/studio-v2/core/motion.schema.ts";
import {motionForPreset,motionTracks,timelineLength,staggerCommands,trackProgress} from "@/features/studio-v2/core/motion-engine.ts";
import type {StudioCommand} from "@/features/studio-v2/core/command-engine.ts";
const names:Record<MotionSpec["preset"],string>={fade:"Появление", "slide-up":"Снизу вверх","slide-left":"Справа налево",scale:"Масштаб",reveal:"Раскрытие маски",parallax:"Параллакс"};
const triggers:Record<MotionSpec["trigger"],string>={load:"При открытии",viewport:"При появлении на экране",hover:"При наведении",click:"При нажатии",scroll:"При прокрутке"};
function NumberField({label,value,min,max,step=1,onChange}:{label:string;value:number;min:number;max:number;step?:number;onChange:(n:number)=>void}){
 return <label className="v2-widget-field">{label}<input type="number" value={value} min={min} max={max} step={step} onChange={e=>{const n=Number(e.target.value);if(e.target.value!==""&&Number.isFinite(n)&&n>=min&&n<=max)onChange(n);}}/></label>;
}
export function MotionControls({document,node,ids,disabled,onCommand,onPreview}:{document:ProjectDocumentV2;node:ProjectNodeV2|null;ids:readonly string[];disabled:boolean;onCommand:(c:StudioCommand|StudioCommand[])=>void;onPreview:()=>void}){
 const [interval,setInterval]=useState(160),[sequenceStart,setSequenceStart]=useState(0),[sequencePreset,setSequencePreset]=useState<MotionSpec["preset"]>("slide-up");
 const spec=node?.motion;
 function change(patch:Partial<MotionSpec>){if(node&&spec)onCommand({kind:"updateNode",id:node.id,changes:{motion:{...spec,...patch}}});}
 return <section className="v2-inspector-section v2-motion-inspector"><h3>Анимации</h3><fieldset disabled={disabled} className="v2-appearance-fieldset">
 {node&&<><div className="v2-motion-presets" role="group" aria-label="Пресеты движения">{motionPresets.map(p=><button key={p} type="button" aria-pressed={spec?.preset===p} disabled={node.locked} onClick={()=>onCommand({kind:"updateNode",id:node.id,changes:{motion:motionForPreset(p,spec??defaultMotion)}})}><StudioIcon size={22} name={({fade:"eye","slide-up":"top","slide-left":"left",scale:"corners",reveal:"shape",parallax:"animation"} as Record<MotionSpec["preset"],StudioIconName>)[p]}/><span>{names[p]}</span></button>)}</div><label className="v2-widget-field">Пресет анимации<select aria-label="Пресет анимации" value={spec?.preset??""} disabled={node.locked} onChange={e=>onCommand({kind:"updateNode",id:node.id,changes:{motion:e.target.value?motionForPreset(e.target.value as MotionSpec["preset"],spec??defaultMotion):undefined}})}><option value="">Без анимации</option>{motionPresets.map(p=><option key={p} value={p}>{names[p]}</option>)}</select></label>
 {spec&&<><label className="v2-widget-field">Триггер<select aria-label="Триггер анимации" value={spec.trigger} disabled={node.locked||spec.preset==="parallax"} onChange={e=>change({trigger:e.target.value as MotionSpec["trigger"]})}>{motionTriggers.filter(t=>spec.preset==="parallax"?t==="scroll":t!=="scroll").map(t=><option key={t} value={t}>{triggers[t]}</option>)}</select></label>
 <div className="v2-inspector-grid"><NumberField label="Длительность (мс)" min={100} max={10000} value={spec.duration} onChange={duration=>change({duration:Math.round(duration)})}/><NumberField label="Задержка (мс)" min={0} max={20000} value={spec.delay} onChange={delay=>change({delay:Math.round(delay)})}/></div>
 <label className="v2-widget-field">Easing<select value={spec.easing} disabled={node.locked} onChange={e=>change({easing:e.target.value as MotionSpec["easing"]})}>{motionEasings.map(t=><option key={t}>{t}</option>)}</select></label>
 {["slide-up","slide-left","parallax"].includes(spec.preset)&&<NumberField label="Расстояние (px)" min={0} max={400} value={spec.distance} onChange={distance=>change({distance})}/>}
 {spec.preset==="scale"&&<NumberField label="Начальный масштаб" min={.1} max={1} step={.05} value={spec.fromScale} onChange={fromScale=>change({fromScale})}/>}
 {spec.preset==="parallax"&&<p className="v2-placeholder">В приглашении положение зависит от прокрутки страницы. Длительность и задержка используются только для timeline.</p>}
 </>}</>}
 {ids.length>1&&<div className="v2-motion-sequence"><strong>Последовательность · {ids.length} слоёв</strong><label className="v2-widget-field">Пресет<select value={sequencePreset} onChange={e=>setSequencePreset(e.target.value as MotionSpec["preset"])}>{motionPresets.filter(p=>p!=="parallax").map(p=><option key={p} value={p}>{names[p]}</option>)}</select></label>
 <NumberField label="Интервал (мс)" min={0} max={3000} value={interval} onChange={n=>setInterval(Math.round(n))}/><NumberField label="Начальная задержка (мс)" min={0} max={20000} value={sequenceStart} onChange={n=>setSequenceStart(Math.round(n))}/>
 <button className="v2-inspector-button" disabled={sequenceStart+(ids.length-1)*interval>20000||ids.some(id=>document.nodes[id]?.locked)} onClick={()=>onCommand(staggerCommands(document,ids,interval,sequenceStart,sequencePreset))}>Применить Stagger</button><p className="v2-placeholder">Порядок определяется порядком выделения; триггер — появление на экране.</p></div>}
 <button className="v2-inspector-button" disabled={!motionTracks(document).length} onClick={onPreview}>Открыть Timeline</button>
 </fieldset></section>;
}
export function MotionTimeline({document,time,onTime}:{document:ProjectDocumentV2;time:number;onTime:(n:number)=>void}){
 const tracks=motionTracks(document),total=timelineLength(tracks);
 const [playing,setPlaying]=useState(false);
 const clock=useRef(time);clock.current=time;
 useEffect(()=>{
  if(!playing)return;
  const start=performance.now(),origin=clock.current>=total?0:clock.current;
  let frame=0;
  const tick=(now:number)=>{const value=Math.min(total,origin+now-start);onTime(value);if(value<total)frame=requestAnimationFrame(tick);else setPlaying(false);};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[playing,total,onTime]);
 return <section className="v2-motion-timeline" aria-label="Timeline анимаций">
 <div className="v2-timeline-top"><strong>Timeline</strong><button className="v2-inspector-button" onClick={()=>{if(playing)setPlaying(false);else{if(time>=total)onTime(0);setPlaying(true);}}}><StudioIcon name={playing?"pause":"play"}/>{playing?"Пауза":"Воспроизвести"}</button><button className="v2-inspector-button" onClick={()=>{setPlaying(false);onTime(0);}}>В начало</button><span className="v2-timeline-time">{(time/1000).toFixed(2)} / {(total/1000).toFixed(2)} s</span></div>
 <input aria-label="Позиция Timeline" type="range" min={0} max={total} step={1} value={Math.min(time,total)} onChange={e=>{setPlaying(false);onTime(Number(e.target.value));}}/>
 <div className="v2-timeline-tracks">{tracks.map(t=><div key={t.id} className="v2-timeline-row"><span title={t.name}>{t.name}</span><div className="v2-timeline-rail"><div title={names[t.spec.preset]+" · "+triggers[t.spec.trigger]} className="v2-timeline-bar" style={{left:(t.spec.delay/total*100)+"%",width:(t.spec.duration/total*100)+"%"}}><i style={{width:(trackProgress(t.spec,time)*100)+"%"}}/></div><b className="v2-timeline-playhead" style={{left:(Math.min(time,total)/total*100)+"%"}}/></div></div>)}</div>
 {!tracks.length&&<p className="v2-placeholder">Добавьте анимацию хотя бы одному слою.</p>}
 </section>;
}
