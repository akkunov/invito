"use client";
import {useEffect,useLayoutEffect,useId,useRef,useState,type CSSProperties,type FormEvent} from "react";
import {ArrowRight, AudioLines, Play, Cake, CalendarDays, ChevronDown, ConciergeBell, Link2, ExternalLink, LoaderCircle, Map as MapIcon, MapPin, Music2, Pause, Sparkles, Wine} from "lucide-react";
import Image from "next/image";
import {isHeritagePresentation} from "@/features/studio-v2/core/heritage-layout.ts";
import {weddingCalendar} from "@/features/studio-v2/core/calendar.ts";
import {StudioTurnstile} from "./studio-v2-turnstile";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema.ts";
import {countdownParts,countdownTarget,hasMusicCard,locationAddress,mapUrl,submitGuestResponse,type GuestMode,type WidgetNode} from "@/features/studio-v2/core/invitation-behavior.ts";
type Props={sectionLinks?:Partial<Record<"next"|"rsvp",string>>;node:WidgetNode;document:ProjectDocumentV2;guest:GuestMode;mediaUrls?:Readonly<Record<string,string>>;onMeasure?:(id:string,height:number)=>void};
const words={
 ru:{name:"Ваше имя",yes:"Буду",no:"Не смогу",guests:"Количество гостей",submit:"Подтвердить",sending:"Отправка…",preview:"Проверка формы успешна. Ответ не отправлен.",sent:"Спасибо! Ответ принят.",error:"Проверьте имя и количество гостей. Если данные верны, попробуйте позже.",closed:"Приём ответов завершён",unavailable:"Приём ответов пока недоступен",days:"дни",hours:"часы",minutes:"мин",seconds:"сек",map:"Открыть карту",noAddress:"Укажите адрес",noPhotos:"Добавьте фотографии",previous:"Предыдущее фото",next:"Следующее фото",play:"Включить музыку",pause:"Остановить музыку",noMusic:"Добавьте аудиофайл",audioError:"Не удалось воспроизвести музыку",noSchedule:"Добавьте события",previewOnly:"Предпросмотр — данные не отправляются"},
 ky:{name:"Атыңыз",yes:"Келем",no:"Келе албайм",guests:"Коноктордун саны",submit:"Ырастоо",sending:"Жөнөтүлүүдө…",preview:"Форма текшерилди. Жооп жөнөтүлгөн жок.",sent:"Рахмат! Жообуңуз кабыл алынды.",error:"Атыңызды жана коноктордун санын текшериңиз. Маалымат туура болсо, кийин кайра аракет кылыңыз.",closed:"Жооп кабыл алуу аяктады",unavailable:"Азыр жооп кабыл алынбайт",days:"күн",hours:"саат",minutes:"мүн",seconds:"сек",map:"Картаны ачуу",noAddress:"Даректи жазыңыз",noPhotos:"Сүрөттөрдү кошуңуз",previous:"Мурунку сүрөт",next:"Кийинки сүрөт",play:"Музыканы ойнотуу",pause:"Музыканы токтотуу",noMusic:"Аудиофайл кошуңуз",audioError:"Музыканы ойнотуу мүмкүн болгон жок",noSchedule:"Иш-чараларды кошуңуз",previewOnly:"Алдын ала көрүү — маалымат жөнөтүлбөйт"}
};
const stationeryScheduleIcons=[Cake,Link2,ConciergeBell,Music2];
const postcardScheduleIcons=[Wine,Link2,ConciergeBell,Sparkles];
const editorialWords={
 ru:{attendance:"Будете ли вы присутствовать?",submit:"Отправить ответ",days:"дня",hours:"часов",minutes:"минут",seconds:"секунды",map:"Показать на карте"},
 ky:{attendance:"Тойго келесизби?",submit:"Жооп жөнөтүү",days:"күн",hours:"саат",minutes:"мүнөт",seconds:"секунд",map:"Картадан көрүү"},
};
function Countdown({target,locale,editorial,heritage,gilded,daysOnly}:{target:string;daysOnly?:boolean;editorial:boolean;heritage:boolean;gilded:boolean;locale:ProjectDocumentV2["locale"]}){
 const [now,setNow]=useState<number|null>(null);
 useEffect(()=>{
  const deadline=Date.parse(target);
  const tick=()=>{const current=Date.now();setNow(current);if(current>=deadline)window.clearInterval(timer);};
  const timer=window.setInterval(tick,1000);
  tick();
  return()=>window.clearInterval(timer);
 },[target]);
 const p=now===null?null:countdownParts(target,now),w=heritage?{...editorialWords[locale],days:locale==="ru"?"дней":"күн",seconds:gilded&&locale==="ky"?"секунда":"секунд"}:editorial?editorialWords[locale]:words[locale];
 return <div className="v2-countdown-grid" data-days-only={daysOnly||undefined}>{(daysOnly?(["days"] as const):(["days","hours","minutes","seconds"] as const)).map(key=><div key={key}><strong>{p?String(p[key]).padStart(2,"0"):"–"}</strong><span>{w[key]}</span></div>)}</div>;
}
function Rsvp({node,document,guest}:Props){
 const b=node.block;if(b.kind!=="rsvp")return null;
 return <RsvpForm key={node.id} block={b} nodeId={node.id} locale={document.locale} guest={guest} editorial={document.presentation==="editorial"} heritage={isHeritagePresentation(document.presentation)||document.presentation==="collection"} gilded={document.presentation==="gilded"} alpine={document.presentation==="alpine"||document.presentation==="collection"} felt={document.presentation==="felt"} stationery={node.appearance.preset==="stationery"} postcard={node.appearance.preset==="postcard"}/>;
}
function RsvpForm({block,nodeId,locale,guest,editorial,heritage,gilded,alpine,felt,stationery,postcard}:{postcard:boolean;stationery:boolean;editorial:boolean;heritage:boolean;gilded:boolean;alpine:boolean;felt:boolean;block:Extract<WidgetNode["block"],{kind:"rsvp"}>;nodeId:string;locale:ProjectDocumentV2["locale"];guest:GuestMode}){
 const id=useId(),w=words[locale],copy=editorialWords[locale],nameRef=useRef<HTMLInputElement>(null);
 const hasNameLabel=alpine||felt;
 const cardControls=stationery||postcard;
 const heritageCopy=locale==="ru"
  ?{attendance:"Вы будете присутствовать?",yes:"Да, буду",no:"К сожалению, нет",submit:"Подтвердить участие",required:"Введите ваше имя"}
  :{attendance:"Тойго келесизби?",yes:gilded||hasNameLabel?"Ооба, келем":"Ооба, барам",no:hasNameLabel?"Тилекке каршы, келе албайм":gilded?"Тилекке каршы, келбейм":"Тилекке каршы, бара албайм",submit:"Катышууну ырастоо",required:"Атыңызды жазыңыз"};
 const showSubmitProgress=gilded||hasNameLabel;
 const submitLabel=stationery?copy.submit:heritage?heritageCopy.submit:editorial?copy.submit:w.submit;
 const responseCopy=felt?(locale==="ru"
  ?{sending:"Отправляем…",sent:"Ответ сохранён. Спасибо!",error:"Не удалось отправить ответ. Попробуйте ещё раз."}
  :{sending:w.sending,sent:"Жообуңуз сакталды. Рахмат!",error:"Жооп жөнөтүлгөн жок. Кайра аракет кылыңыз."}):w;
 const attendanceRef=useRef<HTMLSelectElement>(null);
 const [name,setName]=useState(""),[attendance,setAttendance]=useState<""|"yes"|"no">(editorial?"":"yes"),[guests,setGuests]=useState(1),[status,setStatus]=useState<"idle"|"sending"|"preview"|"sent"|"error">("idle");
 const [wish,setWish]=useState("");
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
     {name,attendance,guests:attendance==="yes"?guests:0,...(block.wish&&wish.trim()?{wish}: {})},block.maxGuests,block.deadline,
     Date.now(),challengeToken,honeypot.current?.value??""));
  }catch{
   setStatus("error");setChallengeToken("");setChallengeReset(v=>v+1);
  }finally{busy.current=false;}
 }
 return <form className="v2-guest-form" data-rsvp-layout={block.layout} noValidate onSubmit={submit}>
  <label className="v2-guest-name">{(hasNameLabel||!editorial&&!heritage)&&w.name}<input aria-label={!hasNameLabel&&(editorial||heritage)?w.name:undefined} placeholder={hasNameLabel?heritageCopy.required:editorial||heritage?w.name:undefined} ref={nameRef} autoComplete="name" disabled={inputDisabled} value={name} maxLength={120} required aria-invalid={status==="error"&&!name.trim()} aria-describedby={showSubmitProgress&&status==="error"&&!name.trim()?id+"-name-error":id} onChange={e=>{setName(e.target.value);setStatus("idle");}}/></label>
  {heritage&&status==="error"&&!name.trim()&&<p id={id+"-name-error"} className="v2-heritage-error" role="alert">{heritageCopy.required}</p>}
  {editorial?<select ref={attendanceRef} aria-label={copy.attendance} required aria-invalid={status==="error"&&!attendance} value={attendance} disabled={disabled} onChange={e=>{const value=e.target.value;setAttendance(value==="yes"||value==="no"?value:"");setStatus("idle");}}>
   <option value="" disabled>{copy.attendance}</option><option value="yes">{w.yes}</option><option value="no">{w.no}</option>
  </select>:<div className="v2-guest-options" role="group" aria-label={heritage?heritageCopy.attendance:block.title[locale]}>{heritage&&<strong>{heritageCopy.attendance}</strong>}{(["yes","no"] as const).map(v=><label key={v}><input type="radio" name={id} checked={attendance===v} disabled={inputDisabled} onChange={()=>{setAttendance(v);setStatus("idle");}}/>{heritage?heritageCopy[v]:w[v]}</label>)}</div>}
  {block.guestControl==="stepper"&&attendance==="yes"&&<div className="v2-guest-stepper">
   <span id={id+"-guests"}>{w.guests}</span>
   <div role="group" aria-labelledby={id+"-guests"}>
    <button type="button" aria-label={locale==="ru"?"Уменьшить количество гостей":"Коноктордун санын азайтуу"} disabled={inputDisabled||guests<=1} onClick={()=>setGuests(value=>Math.max(1,value-1))}>−</button>
    <output aria-live="polite">{Math.min(guests,block.maxGuests)}</output>
    <button type="button" aria-label={locale==="ru"?"Увеличить количество гостей":"Коноктордун санын көбөйтүү"} disabled={inputDisabled||guests>=block.maxGuests} onClick={()=>setGuests(value=>Math.min(block.maxGuests,value+1))}>+</button>
   </div>
  </div>}
  {!block.guestControl&&(editorial||attendance==="yes")&&<label>{!editorial&&w.guests}<select aria-label={editorial?w.guests:undefined} value={editorial&&attendance!=="yes"?0:Math.min(guests,block.maxGuests)} disabled={inputDisabled||attendance==="no"} onChange={e=>setGuests(Number(e.target.value))}>{editorial&&<option value={0} disabled>{w.guests}</option>}{Array.from({length:block.maxGuests},(_,i)=><option key={i+1} value={i+1}>{heritage?guestCount(i+1,locale):i+1}</option>)}</select>{heritage&&<ChevronDown size={felt?20:18} className="v2-heritage-select-icon" aria-hidden="true"/>}</label>}
  {alpine&&attendance==="no"&&<p className="v2-alpine-decline">{locale==="ru"?"При отказе число гостей не указывается.":"Келбесеңиз, коноктордун саны көрсөтүлбөйт."}</p>}
  {block.wish&&<label className="v2-guest-wish">{locale==="ru"?(cardControls?"Пожелание для нас":"Пожелание (необязательно)"):(cardControls?"Бизге каалоо-тилек":"Каалоо-тилек (милдеттүү эмес)")}
   <textarea disabled={inputDisabled} maxLength={500} value={wish} onChange={e=>setWish(e.target.value)} placeholder={locale==="ru"?(cardControls?"Напишите тёплые слова ♡":"Напишите тёплые слова"):"Жылуу сөздөрүңүздү жазыңыз"}/>
   <span>{wish.length} / 500</span>
  </label>}
  <label className="v2-guest-honeypot" aria-hidden="true">Website<input ref={honeypot}
     name="website" tabIndex={-1} autoComplete="off"/></label>
  {challengeSiteKey&&<StudioTurnstile siteKey={challengeSiteKey} onToken={setChallengeToken}
    resetKey={challengeReset}/>}
  <button type="submit" disabled={disabled} aria-busy={showSubmitProgress&&status==="sending"?true:undefined}>{showSubmitProgress&&status==="sending"&&<LoaderCircle size={18} className="v2-gilded-spinner" aria-hidden="true"/>}{status==="sending"?responseCopy.sending:submitLabel}{cardControls&&status!=="sending"&&<ArrowRight size={23} aria-hidden="true"/>}</button>
  <div id={id} className="v2-guest-status" data-error={hasNameLabel&&status==="error"&&!!name.trim()?true:undefined} role="status">{closed?w.closed:unavailable?w.unavailable:status==="preview"?w.preview:status==="sent"?responseCopy.sent:status==="error"&&(!heritage||name.trim())?responseCopy.error:guest.mode==="preview"&&!editorial&&!heritage?w.previewOnly:""}</div>
 </form>;
}
function guestCount(count:number,locale:ProjectDocumentV2["locale"]){
 if(locale==="ky")return `${count} конок`;
 return `${count} ${count===1?"гость":count<5?"гостя":"гостей"}`;
}
function MosaicGallery({node,document,guest,mediaUrls}:Props){
 const dialog=useRef<HTMLDialogElement>(null),touchStart=useRef<number|null>(null);
 const numbered=node.appearance.preset==="contact-sheet";
 const [index,setIndex]=useState(0);
 const b=node.block;if(b.kind!=="gallery")return null;
 const assets=b.assetIds.map(id=>document.assets[id]).filter(Boolean);
 const w=words[document.locale],ru=document.locale==="ru";
 const url=(asset:typeof assets[number])=>asset.storageKey.startsWith("/images/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+asset.storageKey:mediaUrls?.[asset.storageKey];
 const active=assets[index%Math.max(1,assets.length)];
 function move(delta:number){if(assets.length)setIndex(i=>(i+delta+assets.length)%assets.length);}
 if(!active)return <p>{w.noPhotos}</p>;
 return <>
   {b.layout==="exhibition"?<div className="v2-collection-exhibition">
    <button className="v2-exhibition-image" type="button" disabled={guest.mode==="studio"} aria-label={ru?"Открыть фото полностью":"Сүрөттү толук ачуу"} onClick={()=>dialog.current?.showModal()}>
     {url(active)?<Image unoptimized fill src={url(active)!} alt={active.name} sizes="(max-width: 600px) 100vw, 500px"/>:<span>{active.name}</span>}
    </button>
    <div className="v2-exhibition-caption"><strong>{active.name}</strong><span>{index%assets.length+1} / {assets.length}</span></div>
    <div className="v2-exhibition-arrows">
     <button type="button" aria-label={w.previous} disabled={assets.length<2||guest.mode==="studio"} onClick={()=>move(-1)}>←</button>
     <button type="button" aria-label={w.next} disabled={assets.length<2||guest.mode==="studio"} onClick={()=>move(1)}>→</button>
    </div>
    <div className="v2-exhibition-thumbs">
     {assets.map((asset,i)=><button type="button" key={asset.id} aria-label={asset.name} aria-pressed={i===index%assets.length} disabled={guest.mode==="studio"} onClick={()=>setIndex(i)}>
      {url(asset)?<Image unoptimized fill src={url(asset)!} alt="" sizes="100px"/>:<span>{asset.name}</span>}
     </button>)}
    </div>
    <button type="button" className="v2-guest-link" disabled={guest.mode==="studio"} onClick={()=>dialog.current?.showModal()}>{ru?"На весь экран":"Толук экран"}</button>
   </div>:<div className="v2-editorial-mosaic" data-layout={b.layout} data-count={assets.length}>
    {assets.map((asset,i)=><button type="button" key={asset.id} disabled={guest.mode==="studio"} aria-label={(ru?"Открыть фото ":"Сүрөттү ачуу ")+(i+1)}
      onClick={()=>{setIndex(i);dialog.current?.showModal();}}>
      {url(asset)?<Image unoptimized fill src={url(asset)!} alt={asset.name} sizes="(max-width: 600px) 50vw, 600px"/>:<span>{asset.name}</span>}
      {numbered&&<span className="v2-contact-sheet-index" aria-hidden="true">{String(i+1).padStart(2,"0")}</span>}
    </button>)}
   </div>}
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
function PlanSchedule({block,locale,disabled}:{block:Extract<WidgetNode["block"],{kind:"schedule"}>;locale:ProjectDocumentV2["locale"];disabled:boolean}) {
 const [selected,setSelected]=useState(0);
 if(!block.items.length)return <p>{words[locale].noSchedule}</p>;
 const index=Math.min(selected,block.items.length-1);
 const current=block.items[index];
 return <div className="v2-collection-plan">
  <div className="v2-plan-zones" role="group" aria-label={locale==="ru"?"Зоны программы":"Программанын зоналары"}>
   {block.items.map((item,i)=><button key={i} type="button" disabled={disabled} aria-pressed={i===index} onClick={()=>setSelected(i)}>
    <span>{String(i+1).padStart(2,"0")}</span><span>{item.time}</span><strong>{item.label[locale].split("\n")[0]}</strong>
   </button>)}
  </div>
  <div className="v2-plan-detail" aria-live="polite"><time>{current.time}</time><p>{current.label[locale]}</p></div>
 </div>;
}

function Calendar({block,doc,disabled,stationery,postcard}:{postcard:boolean;stationery:boolean;block:Extract<WidgetNode["block"],{kind:"calendar"}>;doc:ProjectDocumentV2;disabled:boolean}) {
 const instant=countdownTarget(doc,block);
 const months=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
 const weekdays=doc.locale==="ru"?["Пн","Вт","Ср","Чт","Пт","Сб","Вс"]:["Дш","Шш","Шр","Бш","Жм","Иш","Жк"];
 const event=new Date(Date.parse(instant)+6*3600_000);
 const eventMonth=event.getUTCFullYear()*12+event.getUTCMonth();
 const [offset,setOffset]=useState(0);
 const month=eventMonth+offset;
 const start=new Date(Date.UTC(Math.floor(month/12),month%12,1));
 const last=new Date(Date.UTC(Math.floor(month/12),month%12+1,0)).getUTCDate();
 const blank=(start.getUTCDay()+6)%7;
 const title=block.title[doc.locale]||(doc.locale==="ru"?"В календарь":"Жылнаамага кошуу");
 const monthLabel=months[start.getUTCMonth()]+" "+start.getUTCFullYear();
 const eventLabel=doc.locale==="ru"?"День свадьбы":"Той күнү";
 const names=doc.values?.coupleNames;
 const address=doc.values?.venueAddress;
 function download(){
  const data=weddingCalendar({id:doc.id+"-"+instant,title:names?.type==="text"?names.value[doc.locale].replace(/\n/g," "):title,instant,address:address?.type==="text"?address.value[doc.locale]:""});
  const url=URL.createObjectURL(new Blob([data],{type:"text/calendar;charset=utf-8"}));
  const link=window.document.createElement("a");
  link.href=url;link.download="eventiq.ics";link.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 if(block.layout==="button")return <button type="button" className="v2-guest-link" disabled={disabled} onClick={download}>{stationery&&<CalendarDays size={20} aria-hidden="true"/>}{title}</button>;
 return <div className="v2-collection-month">
  <div className="v2-month-header"><button type="button" disabled={disabled} aria-label={doc.locale==="ru"?"Предыдущий месяц":"Мурунку ай"} onClick={()=>setOffset(value=>value-1)}>‹</button>
   {postcard&&offset!==0?<button type="button" className="v2-month-return" disabled={disabled}
    aria-label={doc.locale==="ru"?"К месяцу свадьбы":"Той өтүүчү айга кайтуу"} onClick={()=>setOffset(0)}>{monthLabel}</button>:<strong>{monthLabel}</strong>}
   <button type="button" disabled={disabled} aria-label={doc.locale==="ru"?"Следующий месяц":"Кийинки ай"} onClick={()=>setOffset(value=>value+1)}>›</button></div>
  <div className="v2-month-days">
   {weekdays.map(day=><span className="v2-month-weekday" key={day}>{day}</span>)}
   {Array.from({length:blank},(_,i)=><span key={"empty"+i} aria-hidden="true"/>)}
   {Array.from({length:last},(_,i)=>{
    const selected=month===eventMonth&&i+1===event.getUTCDate();
    return <span key={i} data-event-day={selected||undefined} aria-current={postcard&&selected?"date":undefined}
     aria-label={postcard&&selected?eventLabel+" — "+(i+1):undefined}>{i+1}</span>;
   })}
  </div>
 </div>;
}
function Gallery({node,document,guest,mediaUrls}:Props){
 const [index,setIndex]=useState(0);const b=node.block;if(b.kind!=="gallery")return null;
 const assets=b.assetIds.map(id=>document.assets[id]).filter(Boolean),w=words[document.locale],active=assets[index%Math.max(1,assets.length)];
 if(!active)return <p>{w.noPhotos}</p>;
 const url=active.storageKey.startsWith("/images/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+active.storageKey:mediaUrls?.[active.storageKey];
 return <div className="v2-guest-gallery"><div className="v2-guest-photo">{url?<Image unoptimized fill src={url} alt={active.name} sizes="(max-width: 768px) 100vw, 768px"/>:<span>{active.name}</span>}</div>{assets.length>1&&<div className="v2-guest-options"><button type="button" disabled={guest.mode==="studio"} aria-label={w.previous} onClick={()=>setIndex(i=>(i+assets.length-1)%assets.length)}>←</button><span>{index%assets.length+1} / {assets.length}</span><button type="button" disabled={guest.mode==="studio"} aria-label={w.next} onClick={()=>setIndex(i=>(i+1)%assets.length)}>→</button></div>}</div>;
}
function Music({source,locale,guest,editorial,card}:{source:string;editorial:boolean;locale:ProjectDocumentV2["locale"];guest:GuestMode;card?:{cover?:string;title:string;caption?:string}}){
 const ref=useRef<HTMLAudioElement|null>(null),[playing,setPlaying]=useState(false),[error,setError]=useState(false);
 const w=words[locale];
 // Signed URL renewal does not interrupt playback. A different track remounts this widget.
 useEffect(()=>()=>{
  const audio=ref.current;
  if(audio){audio.onplay=null;audio.onpause=null;audio.onerror=null;audio.pause();}
  ref.current=null;
 },[]);
 async function toggle(){
  if(guest.mode==="studio"||!source)return;
  const url=source.startsWith("/audio/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+source:source;
  if(ref.current?.paused&&(ref.current.error||ref.current.src!==new URL(url,window.location.href).href)){
   ref.current.onplay=null;ref.current.onpause=null;ref.current.onerror=null;
   ref.current=null;
  }
  if(!ref.current){
   const audio=new Audio(url);
   audio.loop=true;
   audio.onplay=()=>setPlaying(true);
   audio.onpause=()=>setPlaying(false);
   audio.onerror=()=>{setError(true);setPlaying(false);};
   ref.current=audio;
  }
  const audio=ref.current;
  if(!audio.paused){audio.pause();return;}
  try{setError(false);await audio.play();}catch{if(ref.current===audio){setError(true);setPlaying(false);}}
 }
 if((editorial||card)&&!source)return null;
 const button=<button type="button" aria-label={playing?w.pause:w.play} disabled={!source||guest.mode==="studio"} aria-pressed={playing} onClick={()=>void toggle()}>
   {!(editorial||card)?(playing?w.pause:w.play):playing?<Pause size={17}/>:card?<Play size={17}/>:<Music2 size={17}/>}
 </button>;
 const notice=error?<p role="status">{w.audioError}</p>:null;
 if(card)return <div className="v2-stationery-music">
   <span className="v2-stationery-music-cover" aria-hidden="true">
    {card.cover?<Image src={card.cover} alt="" fill sizes="68px" unoptimized/>:<Music2 size={23}/>}
   </span>
   <div className="v2-stationery-music-copy"><strong>{card.title}</strong>{card.caption&&<small>{card.caption}</small>}</div>
   {button}
   <AudioLines className="v2-stationery-music-wave" size={51} strokeWidth={1.25} aria-hidden="true"/>
   {notice}
 </div>;
 return <>{button}{!source?<p>{w.noMusic}</p>:notice}</>;
}
export function InvitationBlockView(props:Props){
 const {node,document,guest}=props,b=node.block,w=words[document.locale],a=node.appearance;
 const editorial=document.presentation==="editorial";
 const gilded=document.presentation==="gilded";
 const alpine=document.presentation==="alpine";
 const felt=document.presentation==="felt";
 const collection=document.presentation==="collection";
 const heritage=isHeritagePresentation(document.presentation)||collection;
 const measureRef=useRef<HTMLDivElement>(null);
 const {onMeasure}=props;
 const postcard=a.preset==="postcard";
 const musicSource=b.kind==="music"&&hasMusicCard(a.preset)?b.source:undefined;
 useLayoutEffect(()=>{
  const content=measureRef.current?.querySelector<HTMLElement>("form, .v2-guest-schedule, .v2-heritage-location, .v2-collection-plan, .v2-stationery-music");
  if(!heritage||!content||!onMeasure)return;
  const report=()=>onMeasure(node.id,content.offsetHeight);
  const observer=new ResizeObserver(report);
  observer.observe(content);
  report();
  return ()=>observer.disconnect();
 },[heritage,node.id,onMeasure,musicSource]);
 const mapLabel=gilded||alpine||felt||collection?<><MapIcon size={alpine?22:24}/>{document.locale==="ru"?"Открыть карту":"Картаны ачуу"}{a.preset!=="contact-sheet"&&<ExternalLink size={18}/>}</>:heritage?<><MapIcon size={20}/>{editorialWords[document.locale].map}<ExternalLink size={16}/></>:editorial?<>{editorialWords[document.locale].map}<ExternalLink size={10}/></>:w.map;
 const style={fontFamily:editorial||heritage?"var(--font-ui), Arial, sans-serif":a.fontFamily==="serif"?"Georgia, serif":"Arial, sans-serif",fontSize:a.fontSize,color:a.color,background:a.background,"--v2-guest-accent":a.accent,"--v2-guest-button-ink":a.buttonColor} as CSSProperties;
 return <div className={"v2-guest-block"+(b.kind==="gallery"&&b.layout&&b.layout!=="carousel"?" v2-guest-block-mosaic":"")} ref={measureRef} data-heritage-widget={heritage?b.kind:undefined} data-editorial-widget={editorial?b.kind:undefined} data-widget-preset={a.preset} style={style} {...(guest.mode==="studio"?{inert:true}:{})}>
 {b.kind!=="calendar"&&b.kind!=="sectionLink"&&!(b.kind==="music"&&hasMusicCard(a.preset))&&b.title[document.locale]&&<h3>{b.title[document.locale]}</h3>}
 {b.kind==="rsvp"&&<Rsvp {...props}/>}
 {b.kind==="calendar"&&<Calendar block={b} doc={document} disabled={guest.mode==="studio"} stationery={a.preset==="stationery"} postcard={postcard}/>}
 {b.kind==="sectionLink"&&(props.sectionLinks?.[b.destination]
  ?<a className="v2-guest-link" data-style={b.style} href={props.sectionLinks[b.destination]} aria-label={b.title[document.locale]}>{b.style==="arrow"?<ChevronDown size={24}/>:b.title[document.locale]}</a>
  :<span className="v2-guest-link" data-style={b.style}>{b.style==="arrow"?<ChevronDown size={24}/>:b.title[document.locale]}</span>)}
 {b.kind==="countdown"&&<Countdown target={countdownTarget(document,b)} locale={document.locale} editorial={editorial} heritage={heritage} gilded={gilded||alpine||felt} daysOnly={b.layout==="days"}/>}
 {b.kind==="location"&&(()=>{
  const address=locationAddress(document,b);
  if(!address.trim())return <p>{postcard&&guest.mode==="live"?(document.locale==="ru"?"Адрес уточняется":"Дарек такталууда"):w.noAddress}</p>;
  const venue=b.nameKey?document.values?.[b.nameKey]:undefined;
  const label=postcard?<><MapPin className="v2-postcard-pin" size={26} aria-hidden="true"/>
   <span className="v2-location-card-copy">{venue?.type==="text"&&venue.value[document.locale]&&<strong>{venue.value[document.locale]}</strong>}<span>{address}</span></span>
   <ExternalLink size={24} aria-hidden="true"/></>:mapLabel;
  const location=<>
   {!postcard&&b.showAddress!==false&&(editorial||heritage)&&<MapPin size={felt?35:alpine?34:gilded?35:heritage?32:11} strokeWidth={gilded?1.7:undefined} aria-hidden="true"/>}
   {!postcard&&b.showAddress!==false&&<p>{address}</p>}
   {guest.mode==="studio"
    ?<span className="v2-guest-link">{label}</span>
    :<a className="v2-guest-link" href={mapUrl(address)} title={postcard?w.map:undefined} target="_blank" rel="noopener noreferrer">{label}</a>}
  </>;
  return heritage?<div className="v2-heritage-location">{location}</div>:location;
 })()}
 {b.kind==="gallery"&&(b.layout&&b.layout!=="carousel"?<MosaicGallery {...props}/>:<Gallery {...props}/>)}
 {b.kind==="music"&&(()=>{
  const cover=b.coverAssetId?document.assets[b.coverAssetId]:undefined;
  const coverUrl=cover?.storageKey.startsWith("/images/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+cover.storageKey:
   cover?props.mediaUrls?.[cover.storageKey]:undefined;
  const card=hasMusicCard(a.preset)?{cover:coverUrl,title:b.title[document.locale]||w.play,caption:b.caption?.[document.locale]}:undefined;
  return <Music key={b.source} source={b.source.startsWith("asset:")?(props.mediaUrls?.[b.source]??""):b.source}
    locale={document.locale} guest={guest} editorial={editorial||heritage} card={card}/>;
 })()}
 {b.kind==="schedule"&&(b.layout==="plan"?<PlanSchedule block={b} locale={document.locale} disabled={guest.mode==="studio"}/>:<div className="v2-guest-schedule" data-layout={b.layout==="spaced"?"rows":b.layout} data-spaced={b.layout==="spaced"||undefined}>
  {b.items.length?b.items.map((item,i)=>{
   const label=item.label[document.locale];
   if(!b.layout)return <div key={i}><time>{item.time}</time><span>{label}</span></div>;
   const [title,...description]=label.split("\n");
   const Mark=postcard?postcardScheduleIcons[i]:a.preset==="stationery"?stationeryScheduleIcons[i]:undefined;
   return <div key={i}>{(a.preset==="stationery"||postcard)&&<span className="v2-stationery-event-mark" aria-hidden="true">{Mark&&<Mark size={26} strokeWidth={1.5}/>}</span>}<time>{item.time}</time><span><strong>{title}</strong>{description.length>0&&<span>{description.join("\n")}</span>}</span></div>;
  }):<p>{w.noSchedule}</p>}
 </div>)}
 </div>;
}
