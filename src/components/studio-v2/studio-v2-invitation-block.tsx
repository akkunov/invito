"use client";
import {useEffect,useLayoutEffect,useId,useRef,useState,type CSSProperties,type FormEvent} from "react";
import {ChevronDown, ExternalLink, LoaderCircle, Map as MapIcon, MapPin, Music2, Pause} from "lucide-react";
import Image from "next/image";
import {isHeritagePresentation} from "@/features/studio-v2/core/heritage-layout.ts";
import {StudioTurnstile} from "./studio-v2-turnstile";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema.ts";
import {countdownParts,countdownTarget,locationAddress,mapUrl,submitGuestResponse,type GuestMode,type WidgetNode} from "@/features/studio-v2/core/invitation-behavior.ts";
type Props={node:WidgetNode;document:ProjectDocumentV2;guest:GuestMode;mediaUrls?:Readonly<Record<string,string>>;onMeasure?:(id:string,height:number)=>void};
const words={
 ru:{name:"Ваше имя",yes:"Буду",no:"Не смогу",guests:"Количество гостей",submit:"Подтвердить",sending:"Отправка…",preview:"Проверка формы успешна. Ответ не отправлен.",sent:"Спасибо! Ответ принят.",error:"Проверьте имя и количество гостей. Если данные верны, попробуйте позже.",closed:"Приём ответов завершён",unavailable:"Приём ответов пока недоступен",days:"дни",hours:"часы",minutes:"мин",seconds:"сек",map:"Открыть карту",noAddress:"Укажите адрес",noPhotos:"Добавьте фотографии",previous:"Предыдущее фото",next:"Следующее фото",play:"Включить музыку",pause:"Остановить музыку",noMusic:"Добавьте аудиофайл",audioError:"Не удалось воспроизвести музыку",noSchedule:"Добавьте события",previewOnly:"Предпросмотр — данные не отправляются"},
 ky:{name:"Атыңыз",yes:"Келем",no:"Келе албайм",guests:"Коноктордун саны",submit:"Ырастоо",sending:"Жөнөтүлүүдө…",preview:"Форма текшерилди. Жооп жөнөтүлгөн жок.",sent:"Рахмат! Жообуңуз кабыл алынды.",error:"Атыңызды жана коноктордун санын текшериңиз. Маалымат туура болсо, кийин кайра аракет кылыңыз.",closed:"Жооп кабыл алуу аяктады",unavailable:"Азыр жооп кабыл алынбайт",days:"күн",hours:"саат",minutes:"мүн",seconds:"сек",map:"Картаны ачуу",noAddress:"Даректи жазыңыз",noPhotos:"Сүрөттөрдү кошуңуз",previous:"Мурунку сүрөт",next:"Кийинки сүрөт",play:"Музыканы ойнотуу",pause:"Музыканы токтотуу",noMusic:"Аудиофайл кошуңуз",audioError:"Музыканы ойнотуу мүмкүн болгон жок",noSchedule:"Иш-чараларды кошуңуз",previewOnly:"Алдын ала көрүү — маалымат жөнөтүлбөйт"}
};
const editorialWords={
 ru:{attendance:"Будете ли вы присутствовать?",submit:"Отправить ответ",days:"дня",hours:"часов",minutes:"минут",seconds:"секунды",map:"Показать на карте"},
 ky:{attendance:"Тойго келесизби?",submit:"Жооп жөнөтүү",days:"күн",hours:"саат",minutes:"мүнөт",seconds:"секунд",map:"Картадан көрүү"},
};
function Countdown({target,locale,editorial,heritage,gilded}:{target:string;editorial:boolean;heritage:boolean;gilded:boolean;locale:ProjectDocumentV2["locale"]}){
 const [now,setNow]=useState<number|null>(null);
 useEffect(()=>{
  const deadline=Date.parse(target);
  const tick=()=>{const current=Date.now();setNow(current);if(current>=deadline)window.clearInterval(timer);};
  const timer=window.setInterval(tick,1000);
  tick();
  return()=>window.clearInterval(timer);
 },[target]);
 const p=now===null?null:countdownParts(target,now),w=heritage?{...editorialWords[locale],days:locale==="ru"?"дней":"күн",seconds:gilded&&locale==="ky"?"секунда":"секунд"}:editorial?editorialWords[locale]:words[locale];
 return <div className="v2-countdown-grid">{(["days","hours","minutes","seconds"] as const).map(key=><div key={key}><strong>{p?String(p[key]).padStart(2,"0"):"–"}</strong><span>{w[key]}</span></div>)}</div>;
}
function Rsvp({node,document,guest}:Props){
 const b=node.block;if(b.kind!=="rsvp")return null;
 return <RsvpForm key={node.id} block={b} nodeId={node.id} locale={document.locale} guest={guest} editorial={document.presentation==="editorial"} heritage={isHeritagePresentation(document.presentation)} gilded={document.presentation==="gilded"} alpine={document.presentation==="alpine"} felt={document.presentation==="felt"}/>;
}
function RsvpForm({block,nodeId,locale,guest,editorial,heritage,gilded,alpine,felt}:{editorial:boolean;heritage:boolean;gilded:boolean;alpine:boolean;felt:boolean;block:Extract<WidgetNode["block"],{kind:"rsvp"}>;nodeId:string;locale:ProjectDocumentV2["locale"];guest:GuestMode}){
 const id=useId(),w=words[locale],copy=editorialWords[locale],nameRef=useRef<HTMLInputElement>(null);
 const hasNameLabel=alpine||felt;
 const heritageCopy=locale==="ru"
  ?{attendance:"Вы будете присутствовать?",yes:"Да, буду",no:"К сожалению, нет",submit:"Подтвердить участие",required:"Введите ваше имя"}
  :{attendance:"Тойго келесизби?",yes:gilded||hasNameLabel?"Ооба, келем":"Ооба, барам",no:hasNameLabel?"Тилекке каршы, келе албайм":gilded?"Тилекке каршы, келбейм":"Тилекке каршы, бара албайм",submit:"Катышууну ырастоо",required:"Атыңызды жазыңыз"};
 const showSubmitProgress=gilded||hasNameLabel;
 const responseCopy=felt?(locale==="ru"
  ?{sending:"Отправляем…",sent:"Ответ сохранён. Спасибо!",error:"Не удалось отправить ответ. Попробуйте ещё раз."}
  :{sending:w.sending,sent:"Жообуңуз сакталды. Рахмат!",error:"Жооп жөнөтүлгөн жок. Кайра аракет кылыңыз."}):w;
 const attendanceRef=useRef<HTMLSelectElement>(null);
 const [name,setName]=useState(""),[attendance,setAttendance]=useState<""|"yes"|"no">(editorial?"":"yes"),[guests,setGuests]=useState(1),[status,setStatus]=useState<"idle"|"sending"|"preview"|"sent"|"error">("idle");
 const [challengeToken,setChallengeToken]=useState(""),[challengeReset,setChallengeReset]=useState(0);
 const honeypot=useRef<HTMLInputElement>(null);
 const busy=useRef(false);const [now,setNow]=useState<number|null>(null);useEffect(()=>{const tick=()=>setNow(Date.now());tick();const timer=window.setInterval(tick,30000);return()=>window.clearInterval(timer);},[]);
 const closed=now!==null&&!!block.deadline&&now>=Date.parse(block.deadline);
 const unavailable=guest.mode==="live"&&(!guest.submitRsvp||guest.rsvpEnabled===false);
 const challengeSiteKey=guest.mode==="live"?guest.turnstileSiteKey:undefined;
 const fieldsDisabled=guest.mode==="studio"||closed||unavailable||status==="sending"||status==="sent";
 const disabled=fieldsDisabled||!!challengeSiteKey&&!challengeToken;
 const inputDisabled=heritage?fieldsDisabled:disabled;
 async function submit(e:FormEvent){
  e.preventDefault();if(disabled||busy.current)return;
  if(!name.trim()){setStatus("error");nameRef.current?.focus();return;}
  if(!attendance){setStatus("error");attendanceRef.current?.focus();return;}
  busy.current=true;setStatus("sending");
  try{
   setStatus(await submitGuestResponse(guest,nodeId,
     {name,attendance,guests:attendance==="yes"?guests:0},block.maxGuests,block.deadline,
     Date.now(),challengeToken,honeypot.current?.value??""));
  }catch{
   setStatus("error");setChallengeToken("");setChallengeReset(v=>v+1);
  }finally{busy.current=false;}
 }
 return <form className="v2-guest-form" noValidate onSubmit={submit}>
  <label className="v2-guest-name">{(hasNameLabel||!editorial&&!heritage)&&w.name}<input aria-label={!hasNameLabel&&(editorial||heritage)?w.name:undefined} placeholder={hasNameLabel?heritageCopy.required:editorial||heritage?w.name:undefined} ref={nameRef} autoComplete="name" disabled={inputDisabled} value={name} maxLength={120} required aria-invalid={status==="error"&&!name.trim()} aria-describedby={showSubmitProgress&&status==="error"&&!name.trim()?id+"-name-error":id} onChange={e=>{setName(e.target.value);setStatus("idle");}}/></label>
  {heritage&&status==="error"&&!name.trim()&&<p id={id+"-name-error"} className="v2-heritage-error" role="alert">{heritageCopy.required}</p>}
  {editorial?<select ref={attendanceRef} aria-label={copy.attendance} required aria-invalid={status==="error"&&!attendance} value={attendance} disabled={disabled} onChange={e=>{const value=e.target.value;setAttendance(value==="yes"||value==="no"?value:"");setStatus("idle");}}>
   <option value="" disabled>{copy.attendance}</option><option value="yes">{w.yes}</option><option value="no">{w.no}</option>
  </select>:<div className="v2-guest-options" role="group" aria-label={heritage?heritageCopy.attendance:block.title[locale]}>{heritage&&<strong>{heritageCopy.attendance}</strong>}{(["yes","no"] as const).map(v=><label key={v}><input type="radio" name={id} checked={attendance===v} disabled={inputDisabled} onChange={()=>{setAttendance(v);setStatus("idle");}}/>{heritage?heritageCopy[v]:w[v]}</label>)}</div>}
  {(editorial||attendance==="yes")&&<label>{!editorial&&w.guests}<select aria-label={editorial?w.guests:undefined} value={editorial&&attendance!=="yes"?0:Math.min(guests,block.maxGuests)} disabled={inputDisabled||attendance==="no"} onChange={e=>setGuests(Number(e.target.value))}>{editorial&&<option value={0} disabled>{w.guests}</option>}{Array.from({length:block.maxGuests},(_,i)=><option key={i+1} value={i+1}>{heritage?guestCount(i+1,locale):i+1}</option>)}</select>{heritage&&<ChevronDown size={felt?20:18} className="v2-heritage-select-icon" aria-hidden="true"/>}</label>}
  {alpine&&attendance==="no"&&<p className="v2-alpine-decline">{locale==="ru"?"При отказе число гостей не указывается.":"Келбесеңиз, коноктордун саны көрсөтүлбөйт."}</p>}
  <label className="v2-guest-honeypot" aria-hidden="true">Website<input ref={honeypot}
     name="website" tabIndex={-1} autoComplete="off"/></label>
  {challengeSiteKey&&<StudioTurnstile siteKey={challengeSiteKey} onToken={setChallengeToken}
    resetKey={challengeReset}/>}
  <button type="submit" disabled={disabled} aria-busy={showSubmitProgress&&status==="sending"?true:undefined}>{showSubmitProgress&&status==="sending"&&<LoaderCircle size={18} className="v2-gilded-spinner" aria-hidden="true"/>}{status==="sending"?responseCopy.sending:heritage?heritageCopy.submit:editorial?copy.submit:w.submit}</button>
  <div id={id} className="v2-guest-status" data-error={hasNameLabel&&status==="error"&&!!name.trim()?true:undefined} role="status">{closed?w.closed:unavailable?w.unavailable:status==="preview"?w.preview:status==="sent"?responseCopy.sent:status==="error"&&(!heritage||name.trim())?responseCopy.error:guest.mode==="preview"&&!editorial&&!heritage?w.previewOnly:""}</div>
 </form>;
}
function guestCount(count:number,locale:ProjectDocumentV2["locale"]){
 if(locale==="ky")return `${count} конок`;
 return `${count} ${count===1?"гость":count<5?"гостя":"гостей"}`;
}
function MosaicGallery({node,document,guest,mediaUrls}:Props){
 const dialog=useRef<HTMLDialogElement>(null),touchStart=useRef<number|null>(null);
 const [index,setIndex]=useState(0);
 const b=node.block;if(b.kind!=="gallery")return null;
 const assets=b.assetIds.map(id=>document.assets[id]).filter(Boolean);
 const w=words[document.locale],ru=document.locale==="ru";
 const url=(asset:typeof assets[number])=>asset.storageKey.startsWith("/images/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+asset.storageKey:mediaUrls?.[asset.storageKey];
 const active=assets[index%Math.max(1,assets.length)];
 function move(delta:number){if(assets.length)setIndex(i=>(i+delta+assets.length)%assets.length);}
 if(!active)return <p>{w.noPhotos}</p>;
 return <>
   <div className="v2-editorial-mosaic" data-layout={b.layout} data-count={assets.length}>
    {assets.map((asset,i)=><button type="button" key={asset.id} disabled={guest.mode==="studio"} aria-label={(ru?"Открыть фото ":"Сүрөттү ачуу ")+(i+1)}
      onClick={()=>{setIndex(i);dialog.current?.showModal();}}>
      {url(asset)?<Image unoptimized fill src={url(asset)!} alt={asset.name} sizes="(max-width: 600px) 50vw, 600px"/>:<span>{asset.name}</span>}
    </button>)}
   </div>
   <dialog ref={dialog} className="v2-editorial-lightbox" aria-label={ru?"Фотогалерея":"Сүрөт галереясы"}
     onKeyDown={e=>{if(e.key==="ArrowLeft"){e.preventDefault();move(-1);}if(e.key==="ArrowRight"){e.preventDefault();move(1);}}}
     onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}>
    <div className="v2-editorial-lightbox-inner">
     <div className="v2-editorial-lightbox-top"><span>{index%assets.length+1} / {assets.length}</span><button type="button" aria-label={ru?"Закрыть":"Жабуу"} onClick={()=>dialog.current?.close()}>×</button></div>
     <div className="v2-editorial-lightbox-photo" onTouchStart={e=>{touchStart.current=e.touches[0]?.clientX??null;}} onTouchEnd={e=>{const x=e.changedTouches[0]?.clientX,start=touchStart.current;touchStart.current=null;if(start!==null&&x!==undefined&&Math.abs(x-start)>45)move(x<start?1:-1);}}>
      {url(active)?<Image unoptimized fill src={url(active)!} alt={active.name} sizes="100vw"/>:<p>{active.name}</p>}
     </div>
     <div className="v2-editorial-lightbox-nav"><button type="button" aria-label={w.previous} disabled={assets.length<2} onClick={()=>move(-1)}>←</button><button type="button" aria-label={w.next} disabled={assets.length<2} onClick={()=>move(1)}>→</button></div>
    </div>
   </dialog>
 </>;
}
function Gallery({node,document,guest,mediaUrls}:Props){
 const [index,setIndex]=useState(0);const b=node.block;if(b.kind!=="gallery")return null;
 const assets=b.assetIds.map(id=>document.assets[id]).filter(Boolean),w=words[document.locale],active=assets[index%Math.max(1,assets.length)];
 if(!active)return <p>{w.noPhotos}</p>;
 const url=active.storageKey.startsWith("/images/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+active.storageKey:mediaUrls?.[active.storageKey];
 return <div className="v2-guest-gallery"><div className="v2-guest-photo">{url?<Image unoptimized fill src={url} alt={active.name} sizes="(max-width: 768px) 100vw, 768px"/>:<span>{active.name}</span>}</div>{assets.length>1&&<div className="v2-guest-options"><button type="button" disabled={guest.mode==="studio"} aria-label={w.previous} onClick={()=>setIndex(i=>(i+assets.length-1)%assets.length)}>←</button><span>{index%assets.length+1} / {assets.length}</span><button type="button" disabled={guest.mode==="studio"} aria-label={w.next} onClick={()=>setIndex(i=>(i+1)%assets.length)}>→</button></div>}</div>;
}
function Music({source,locale,guest,editorial}:{source:string;editorial:boolean;locale:ProjectDocumentV2["locale"];guest:GuestMode}){
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
 if(editorial&&!source)return null;
 return <><button type="button" aria-label={playing?w.pause:w.play} disabled={!source||guest.mode==="studio"} aria-pressed={playing} onClick={()=>void toggle()}>{editorial?(playing?<Pause size={17}/>:<Music2 size={17}/>):playing?w.pause:w.play}</button>{!source?<p>{w.noMusic}</p>:error?<p role="status">{w.audioError}</p>:null}</>;
}
export function InvitationBlockView(props:Props){
 const {node,document,guest}=props,b=node.block,w=words[document.locale],a=node.appearance;
 const editorial=document.presentation==="editorial";
 const gilded=document.presentation==="gilded";
 const alpine=document.presentation==="alpine";
 const felt=document.presentation==="felt";
 const heritage=isHeritagePresentation(document.presentation);
 const measureRef=useRef<HTMLDivElement>(null);
 const {onMeasure}=props;
 useLayoutEffect(()=>{
  const content=measureRef.current?.querySelector<HTMLElement>("form, .v2-guest-schedule, .v2-heritage-location");
  if(!heritage||!content||!onMeasure)return;
  const report=()=>onMeasure(node.id,content.offsetHeight);
  const observer=new ResizeObserver(report);
  observer.observe(content);
  report();
  return ()=>observer.disconnect();
 },[heritage,node.id,onMeasure]);
 const mapLabel=gilded||alpine||felt?<><MapIcon size={alpine?22:24}/>{document.locale==="ru"?"Открыть карту":"Картаны ачуу"}<ExternalLink size={18}/></>:heritage?<><MapIcon size={20}/>{editorialWords[document.locale].map}<ExternalLink size={16}/></>:editorial?<>{editorialWords[document.locale].map}<ExternalLink size={10}/></>:w.map;
 const style={fontFamily:editorial||heritage?"var(--font-ui), Arial, sans-serif":a.fontFamily==="serif"?"Georgia, serif":"Arial, sans-serif",fontSize:a.fontSize,color:a.color,background:a.background,"--v2-guest-accent":a.accent} as CSSProperties;
 return <div className={"v2-guest-block"+(b.kind==="gallery"&&b.layout&&b.layout!=="carousel"?" v2-guest-block-mosaic":"")} ref={measureRef} data-heritage-widget={heritage?b.kind:undefined} data-editorial-widget={editorial?b.kind:undefined} style={style} {...(guest.mode==="studio"?{inert:true}:{})}>
 {b.title[document.locale]&&<h3>{b.title[document.locale]}</h3>}
 {b.kind==="rsvp"&&<Rsvp {...props}/>}
 {b.kind==="countdown"&&<Countdown target={countdownTarget(document,b)} locale={document.locale} editorial={editorial} heritage={heritage} gilded={gilded||alpine||felt}/>}
 {b.kind==="location"&&(()=>{
  const address=locationAddress(document,b);
  if(!address.trim())return <p>{w.noAddress}</p>;
  const location=<>
   {(editorial||heritage)&&<MapPin size={felt?35:alpine?34:gilded?35:heritage?32:11} strokeWidth={gilded?1.7:undefined} aria-hidden="true"/>}
   <p>{address}</p>
   {guest.mode==="studio"
    ?<span className="v2-guest-link">{mapLabel}</span>
    :<a className="v2-guest-link" href={mapUrl(address)} target="_blank" rel="noopener noreferrer">{mapLabel}</a>}
  </>;
  return heritage?<div className="v2-heritage-location">{location}</div>:location;
 })()}
 {b.kind==="gallery"&&(b.layout&&b.layout!=="carousel"?<MosaicGallery {...props}/>:<Gallery {...props}/>)}
 {b.kind==="music"&&<Music key={b.source} source={b.source.startsWith("asset:")?(props.mediaUrls?.[b.source]??""):b.source} locale={document.locale} guest={guest} editorial={editorial||heritage}/>}
 {b.kind==="schedule"&&<div className="v2-guest-schedule" data-layout={b.layout}>
  {b.items.length?b.items.map((item,i)=>{
   const label=item.label[document.locale];
   if(b.layout!=="rows")return <div key={i}><time>{item.time}</time><span>{label}</span></div>;
   const [title,...description]=label.split("\n");
   return <div key={i}><time>{item.time}</time><span><strong>{title}</strong>{description.length>0&&<span>{description.join("\n")}</span>}</span></div>;
  }):<p>{w.noSchedule}</p>}
 </div>}
 </div>;
}
