"use client";

import {useEffect,useMemo,useState} from "react";
import {Check,Music2,Search} from "lucide-react";
import {musicCatalogSchema,type MusicTrack} from "@/features/invitations/music-catalog.schema";
import type {Locale} from "@/i18n/locales";

/** One picker for the legacy and versioned editor adapters.
 * The versioned adapter passes its exact immutable permitted sources. */
export function MusicLibraryPicker({locale,allowedSources,value,onChoose}:{
 locale:Locale;allowedSources?:readonly string[];value:string;onChoose:(source:string,track?:MusicTrack)=>void;
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
   <p className="ue-music-hint">{t("Музыка у гостей запускается по нажатию. Используйте только файлы с правом публичного воспроизведения.","Коноктор баскычты басканда музыка ойнойт. Уруксат берилген файлдарды колдонуңуз.")}</p>
 </div>;
}
