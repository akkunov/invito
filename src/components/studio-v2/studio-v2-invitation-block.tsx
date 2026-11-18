"use client";
import {useEffect,useId,useRef,useState,type CSSProperties,type FormEvent} from "react";
import Image from "next/image";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema.ts";
import {countdownParts,countdownTarget,locationAddress,mapUrl,submitGuestResponse,type GuestMode,type WidgetNode} from "@/features/studio-v2/core/invitation-behavior.ts";
type Props={node:WidgetNode;document:ProjectDocumentV2;guest:GuestMode;mediaUrls?:Readonly<Record<string,string>>};
const words={
 ru:{name:"Ваше имя",yes:"Буду",no:"Не смогу",guests:"Количество гостей",submit:"Подтвердить",sending:"Отправка…",preview:"Проверка формы успешна. Ответ не отправлен.",sent:"Спасибо! Ответ принят.",error:"Проверьте имя и количество гостей. Если данные верны, попробуйте позже.",closed:"Приём ответов завершён",unavailable:"Приём ответов пока недоступен",days:"дни",hours:"часы",minutes:"мин",seconds:"сек",map:"Открыть карту",noAddress:"Укажите адрес",noPhotos:"Добавьте фотографии",previous:"Предыдущее фото",next:"Следующее фото",play:"Включить музыку",pause:"Остановить музыку",noMusic:"Добавьте аудиофайл",audioError:"Не удалось воспроизвести музыку",noSchedule:"Добавьте события",previewOnly:"Предпросмотр — данные не отправляются"},
 ky:{name:"Атыңыз",yes:"Келем",no:"Келе албайм",guests:"Коноктордун саны",submit:"Ырастоо",sending:"Жөнөтүлүүдө…",preview:"Форма текшерилди. Жооп жөнөтүлгөн жок.",sent:"Рахмат! Жообуңуз кабыл алынды.",error:"Атыңызды жана коноктордун санын текшериңиз. Маалымат туура болсо, кийин кайра аракет кылыңыз.",closed:"Жооп кабыл алуу аяктады",unavailable:"Азыр жооп кабыл алынбайт",days:"күн",hours:"саат",minutes:"мүн",seconds:"сек",map:"Картаны ачуу",noAddress:"Даректи жазыңыз",noPhotos:"Сүрөттөрдү кошуңуз",previous:"Мурунку сүрөт",next:"Кийинки сүрөт",play:"Музыканы ойнотуу",pause:"Музыканы токтотуу",noMusic:"Аудиофайл кошуңуз",audioError:"Музыканы ойнотуу мүмкүн болгон жок",noSchedule:"Иш-чараларды кошуңуз",previewOnly:"Алдын ала көрүү — маалымат жөнөтүлбөйт"}
};
function Countdown({target,locale}:{target:string;locale:ProjectDocumentV2["locale"]}){
 const [now,setNow]=useState<number|null>(null);useEffect(()=>{const tick=()=>setNow(Date.now());tick();const timer=window.setInterval(tick,1000);return()=>window.clearInterval(timer);},[]);
 const p=now===null?null:countdownParts(target,now),w=words[locale];
 return <div className="v2-countdown-grid">{(["days","hours","minutes","seconds"] as const).map(key=><div key={key}><strong>{p?String(p[key]).padStart(2,"0"):"–"}</strong><span>{w[key]}</span></div>)}</div>;
}
function Rsvp({node,document,guest}:Props){
 const b=node.block;if(b.kind!=="rsvp")return null;
 return <RsvpForm key={node.id} block={b} nodeId={node.id} locale={document.locale} guest={guest}/>;
}
function RsvpForm({block,nodeId,locale,guest}:{block:Extract<WidgetNode["block"],{kind:"rsvp"}>;nodeId:string;locale:ProjectDocumentV2["locale"];guest:GuestMode}){
 const id=useId(),w=words[locale],nameRef=useRef<HTMLInputElement>(null);
 const [name,setName]=useState(""),[attendance,setAttendance]=useState<"yes"|"no">("yes"),[guests,setGuests]=useState(1),[status,setStatus]=useState<"idle"|"sending"|"preview"|"sent"|"error">("idle");
 const busy=useRef(false);const [now,setNow]=useState<number|null>(null);useEffect(()=>{const tick=()=>setNow(Date.now());tick();const timer=window.setInterval(tick,30000);return()=>window.clearInterval(timer);},[]);
 const closed=now!==null&&!!block.deadline&&now>=Date.parse(block.deadline);
 const unavailable=guest.mode==="live"&&!guest.submitRsvp;
 const disabled=guest.mode==="studio"||closed||unavailable||status==="sending"||status==="sent";
 async function submit(e:FormEvent){
  e.preventDefault();if(disabled||busy.current)return;
  if(!name.trim()){setStatus("error");nameRef.current?.focus();return;}
  busy.current=true;setStatus("sending");
  try{setStatus(await submitGuestResponse(guest,nodeId,{name,attendance,guests:attendance==="yes"?guests:0},block.maxGuests,block.deadline));}catch{setStatus("error");}finally{busy.current=false;}
 }
 return <form className="v2-guest-form" noValidate onSubmit={submit}>
  <label>{w.name}<input ref={nameRef} autoComplete="name" disabled={disabled} value={name} maxLength={120} required aria-invalid={status==="error"&&!name.trim()} aria-describedby={id} onChange={e=>{setName(e.target.value);setStatus("idle");}}/></label>
  <div className="v2-guest-options" role="group" aria-label={block.title[locale]}>{(["yes","no"] as const).map(v=><label key={v}><input type="radio" name={id} checked={attendance===v} disabled={disabled} onChange={()=>{setAttendance(v);setStatus("idle");}}/>{w[v]}</label>)}</div>
  {attendance==="yes"&&<label>{w.guests}<select value={Math.min(guests,block.maxGuests)} disabled={disabled} onChange={e=>setGuests(Number(e.target.value))}>{Array.from({length:block.maxGuests},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label>}
  <button type="submit" disabled={disabled}>{status==="sending"?w.sending:w.submit}</button>
  <div id={id} className="v2-guest-status" role="status">{closed?w.closed:unavailable?w.unavailable:status==="preview"?w.preview:status==="sent"?w.sent:status==="error"?w.error:guest.mode==="preview"?w.previewOnly:""}</div>
 </form>;
}
function Gallery({node,document,guest,mediaUrls}:Props){
 const [index,setIndex]=useState(0);const b=node.block;if(b.kind!=="gallery")return null;
 const assets=b.assetIds.map(id=>document.assets[id]).filter(Boolean),w=words[document.locale],active=assets[index%Math.max(1,assets.length)];
 if(!active)return <p>{w.noPhotos}</p>;
 const url=active.storageKey.startsWith("/images/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+active.storageKey:mediaUrls?.[active.storageKey];
 return <div className="v2-guest-gallery"><div className="v2-guest-photo">{url?<Image unoptimized fill src={url} alt={active.name} sizes="(max-width: 768px) 100vw, 768px"/>:<span>{active.name}</span>}</div>{assets.length>1&&<div className="v2-guest-options"><button type="button" disabled={guest.mode==="studio"} aria-label={w.previous} onClick={()=>setIndex(i=>(i+assets.length-1)%assets.length)}>←</button><span>{index%assets.length+1} / {assets.length}</span><button type="button" disabled={guest.mode==="studio"} aria-label={w.next} onClick={()=>setIndex(i=>(i+1)%assets.length)}>→</button></div>}</div>;
}
function Music({source,locale,guest}:{source:string;locale:ProjectDocumentV2["locale"];guest:GuestMode}){
 const ref=useRef<HTMLAudioElement|null>(null),[playing,setPlaying]=useState(false),[error,setError]=useState(false);
 const w=words[locale];
 // Signed URL refresh must not pause an already playing track; a different authored source changes the Music key.
 useEffect(()=>()=>{ref.current?.pause();ref.current=null;},[]);
 async function toggle(){
  if(guest.mode==="studio"||!source)return;
  const url=source.startsWith("/audio/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+source:source;
  // Never change a playing stream; on resume use a newer signed URL if available.
  if(ref.current?.paused&&ref.current.src!==new URL(url,window.location.href).href){
   ref.current.pause();ref.current=null;
  }
  if(!ref.current){const audio=new Audio(url);audio.loop=true;ref.current=audio;}
  const audio=ref.current;
  if(!audio.paused){audio.pause();setPlaying(false);return;}
  try{setError(false);await audio.play();setPlaying(true);}catch{setError(true);setPlaying(false);}
 }
 return <><button type="button" disabled={!source||guest.mode==="studio"} aria-pressed={playing} onClick={()=>void toggle()}>{playing?w.pause:w.play}</button>{!source?<p>{w.noMusic}</p>:error?<p role="status">{w.audioError}</p>:null}</>;
}
export function InvitationBlockView(props:Props){
 const {node,document,guest}=props,b=node.block,w=words[document.locale],a=node.appearance;
 const style={fontFamily:a.fontFamily==="serif"?"Georgia, serif":"Arial, sans-serif",fontSize:a.fontSize,color:a.color,background:a.background,"--v2-guest-accent":a.accent} as CSSProperties;
 return <div className="v2-guest-block" style={style} {...(guest.mode==="studio"?{inert:true}:{})}>
 <h3>{b.title[document.locale]}</h3>
 {b.kind==="rsvp"?<Rsvp {...props}/>:b.kind==="countdown"?<Countdown target={countdownTarget(document,b)} locale={document.locale}/>:b.kind==="location"?(()=>{const address=locationAddress(document,b);return address.trim()?<><p>{address}</p>{guest.mode==="studio"?<span className="v2-guest-link">{w.map}</span>:<a className="v2-guest-link" href={mapUrl(address)} target="_blank" rel="noopener noreferrer">{w.map}</a>}</>:<p>{w.noAddress}</p>;})():b.kind==="gallery"?<Gallery {...props}/>:b.kind==="music"?<Music key={b.source} source={b.source.startsWith("asset:")?(props.mediaUrls?.[b.source]??""):b.source} locale={document.locale} guest={guest}/>:b.kind==="schedule"?<div className="v2-guest-schedule">{b.items.length?b.items.map((item,i)=><div key={i}><time>{item.time}</time><span>{item.label[document.locale]}</span></div>):<p>{w.noSchedule}</p>}</div>:null}
 </div>;
}
