"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {Check,Music2,Search,Upload} from "lucide-react";
import {musicCatalogSchema,type MusicTrack} from "@/features/invitations/music-catalog.schema";
import {CustomerCloudError,uploadCustomerAudio} from "@/features/invitations/customer-cloud";
import type {Locale} from "@/i18n/locales";

/** One picker for the legacy and versioned editor adapters.
 * The versioned adapter passes its exact immutable permitted sources. */
export function MusicLibraryPicker({locale,allowedSources,value,onChoose,onUploaded}:{
 locale:Locale;allowedSources?:readonly string[];value:string;onChoose:(source:string,track?:MusicTrack)=>void;
 onUploaded?:(result:{source:string;url:string})=>void;
}){
 const ru=locale==="ru",t=(a:string,b:string)=>ru?a:b;
 const [tracks,setTracks]=useState<MusicTrack[]>([]);
 const [state,setState]=useState<"loading"|"ready"|"error">("loading");
 const [query,setQuery]=useState("");
 const [preview,setPreview]=useState<string|null>(null);
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const base=process.env.NEXT_PUBLIC_API_URL;
  if(!base){setState("error");return;}
  const controller=new AbortController();
  setState("loading");
  fetch(base.replace(/\/$/,"")+"/catalog/music",{signal:controller.signal,cache:"no-store"})
   .then(async response=>{if(!response.ok)throw Error("MUSIC_CATALOG");return musicCatalogSchema.parse((await response.json()).tracks);})
   .then(next=>{if(!controller.signal.aborted){setTracks(next);setState("ready");}})
   .catch(()=>{if(!controller.signal.aborted)setState("error");});
  return()=>controller.abort();
 },[retry]);
 const items=useMemo(()=>{
  const bySource=new Map(tracks.map(track=>[track.source,track]));
  if(allowedSources)return allowedSources.map((source,index)=>({source,title:bySource.get(source)?.title??(ru?"Композиция ":"Музыка ")+(index+1),track:bySource.get(source)}));
  return tracks.map(track=>({source:track.source,title:track.title,track}));
 },[tracks,allowedSources,ru]);
 const filtered=items.filter(item=>(item.title+" "+(item.track?.artist??"")).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 return <div className="ue-music-library">
   <label className="ue-music-search"><Search size={17}/><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder={t("Поиск музыки","Музыка издөө")} aria-label={t("Поиск музыки","Музыка издөө")}/></label>
   <button type="button" className="ue-music-none" aria-pressed={!value} onClick={()=>{setPreview(null);onChoose("");}}>{t("Без музыки","Музыкасыз")}{!value&&<Check size={17}/>}</button>
   {state==="loading"&&<p role="status">{t("Загрузка библиотеки…","Китепкана жүктөлүүдө…")}</p>}
   {state==="error"&&<p role="status">{t("Каталог недоступен.","Каталог жеткиликсиз.")} <button type="button" onClick={()=>setRetry(x=>x+1)}>{t("Повторить","Кайталоо")}</button></p>}
   {state==="ready"&&!filtered.length&&<p>{t("Нет доступных композиций","Жеткиликтүү музыка жок")}</p>}
   {filtered.map(item=><div className="ue-music-track" key={item.source}>
    <Music2 size={21}/><div className="ue-music-meta"><strong>{item.title}</strong>{item.track&&<><small>{item.track.artist}</small><small>{item.track.license}</small></>}</div>
    <button type="button" onClick={()=>setPreview(preview===item.source?null:item.source)} aria-expanded={preview===item.source}>{preview===item.source?t("Закрыть","Жабуу"):t("Слушать","Угуу")}</button>
    <button type="button" aria-pressed={value===item.source} onClick={()=>onChoose(item.source,item.track)}>{value===item.source?<Check size={17}/>:t("Выбрать","Тандоо")}</button>
    {preview===item.source&&!item.source.startsWith("asset:")&&<audio controls preload="none" src={item.source.startsWith("/audio/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+item.source:item.source}/>}
    {preview===item.source&&item.source.startsWith("asset:")&&<small>{t("Прослушайте в приглашении после выбора.","Тандагандан кийин чакыруудан угуңуз.")}</small>}
   </div>)}
   {onUploaded&&<MusicUpload locale={locale} selected={!!value&&!(allowedSources??[]).includes(value)} onUploaded={onUploaded}/>}
   <p className="ue-music-hint">{t("Музыка у гостей запускается по нажатию. Используйте только файлы с правом публичного воспроизведения.","Коноктор баскычты басканда музыка ойнойт. Уруксат берилген файлдарды колдонуңуз.")}</p>
 </div>;
}

function MusicUpload({locale,selected,onUploaded}:{
 locale:Locale;selected:boolean;onUploaded:(result:{source:string;url:string})=>void;
}){
 const ru=locale==="ru";
 const input=useRef<HTMLInputElement>(null);
 const latest=useRef<typeof onUploaded|null>(null);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState<"idle"|"done"|"sign-in"|"format"|"error">("idle");
 useEffect(()=>{latest.current=onUploaded;return()=>{latest.current=null;};},[onUploaded]);
 async function upload(file:File){
  setBusy(true);setStatus("idle");
  try{
   const result=await uploadCustomerAudio(file);
   latest.current?.(result);
   setStatus("done");
  }catch(error){
   setStatus(error instanceof CustomerCloudError&&error.status===401?"sign-in":
    error instanceof Error&&error.message==="INVALID_AUDIO_FILE"?"format":"error");
  }finally{
   if(input.current)input.current.value="";
   setBusy(false);
  }
 }
 const messages={
  "sign-in":ru?"Войдите в аккаунт, чтобы загрузить трек.":"Трек жүктөө үчүн аккаунтка кириңиз.",
  format:ru?"Выберите файл MP3 размером до 15 МБ.":"15 МБга чейинки MP3 файлын тандаңыз.",
  error:ru?"Не удалось проверить загрузку. Повторите попытку.":"Жүктөөнү текшерүү мүмкүн болгон жок. Кайра аракет кылыңыз.",
  done:ru?"Трек добавлен в черновик.":"Трек черновикке кошулду.",
  idle:"",
 };
 return <div className="ue-music-upload">
   <input ref={input} type="file" accept="audio/mpeg,.mp3" hidden disabled={busy}
     onChange={event=>{const file=event.target.files?.[0];if(file&&!busy)void upload(file);}}/>
   <button type="button" className="ue-music-none" disabled={busy} aria-busy={busy} onClick={()=>input.current?.click()}>
    <Upload size={17} aria-hidden="true"/>
    {busy?(ru?"Загрузка и проверка…":"Жүктөлүүдө жана текшерилүүдө…"):
      selected?(ru?"Заменить MP3":"MP3 алмаштыруу"):(ru?"Загрузить MP3":"MP3 жүктөө")}
    {selected&&!busy&&<Check size={16} aria-hidden="true"/>}
   </button>
   <p className="ue-music-hint" role="status">{messages[status]||(ru?"MP3 · до 15 МБ":"MP3 · 15 МБга чейин")}</p>
 </div>;
}
