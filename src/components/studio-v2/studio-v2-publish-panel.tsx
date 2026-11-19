"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createStudioRemoteClient,RemoteRequestError,type RemoteSyncSettings} from "@/features/studio-v2/browser/remote-sync";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema.ts";
import {StudioIcon} from "./studio-icon";

type Published={id:string;slug:string;status:"ACTIVE"|"UNPUBLISHED";latestRelease:number};
type Reply={id:string;guestName:string;attendance:"YES"|"NO"|"MAYBE";guestCount:number;createdAt:string};
const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function cloudProject(settings:RemoteSyncSettings,docId:string):string|null {
 try {
  const raw=window.localStorage.getItem("invito:cloud-link:v1:"+settings.workspaceId+":"+docId);
  if(!raw)return null;
  const link=JSON.parse(raw) as {remoteId?:unknown;revision?:unknown};
  return typeof link.remoteId==="string"&&/^[a-f0-9-]{36}$/i.test(link.remoteId)&&
   Number.isSafeInteger(link.revision)&&Number(link.revision)>0?link.remoteId:null;
 }catch{return null;}
}
export function StudioPublishPanel({document,settings,locale,onClose}:{
 document:ProjectDocumentV2;settings:RemoteSyncSettings;locale:"ru"|"ky";onClose:()=>void;
}){
 const client=useMemo(()=>createStudioRemoteClient(settings),[
  settings.apiBaseUrl,settings.workspaceId,settings.accessToken,settings.fetcher,
 ]);
 const [projectId,setProjectId]=useState<string|null>(null);
 const [publication,setPublication]=useState<Published|null>(null);
 const [slug,setSlug]=useState(document.id.toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-|-$/g,"").slice(0,64)||"invitation");
 const [latestRevision,setLatestRevision]=useState<number|null>(null);
 const [summary,setSummary]=useState<{responses:number;attending:number;declined:number}|null>(null);
 const [replies,setReplies]=useState<Reply[]>([]);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 const pending=useRef<{signature:string;key:string}|null>(null);
 useEffect(()=>setProjectId(cloudProject(settings,document.id)),[settings.workspaceId,document.id]);
 useEffect(()=>{
  if(!projectId)return;
  let active=true;
  void Promise.all([client.getProject(projectId),client.getPublication(projectId)]).then(async([project,pub])=>{
   if(!active)return;
   setLatestRevision(project.latestRevision);setPublication(pub);if(pub)setSlug(pub.slug);
   if(!pub)return;
   try{
    const [stats,results]=await Promise.all([client.rsvpSummary(projectId),client.listRsvp(projectId)]);
    if(active){setSummary(stats);setReplies(results.items);}
   }catch{if(active){setSummary(null);setReplies([]);}}
  }).catch(()=>{if(active)setError("Не удалось загрузить публикацию. Проверьте авторизацию и Workspace.");});
  return()=>{active=false;};
 },[client,projectId]);
 const base=(process.env.NEXT_PUBLIC_SITE_URL|| (typeof window==="undefined"?"":window.location.origin)).replace(/\/$/,"");
 const shareUrl=publication?.status==="ACTIVE"?base+"/"+locale+"/i/"+publication.slug:null;
 async function publish(){
  if(!projectId||busy)return;
  const clean=slug.trim().toLowerCase();
  if(clean.length<3||clean.length>80||!slugPattern.test(clean)){
   setError("Адрес: от 3 до 80 символов, латинские буквы, цифры и дефисы.");return;
  }
  setBusy(true);setError("");setMessage("");
  try{
   const remote=await client.getProject(projectId);
   const rev=await client.getProjectRevision(projectId,remote.latestRevision);
   const expectedRelease=publication?.latestRelease??0;
   const signature=[projectId,rev.id,clean,expectedRelease].join("|");
   if(pending.current?.signature!==signature)pending.current={signature,key:"publish-"+crypto.randomUUID()};
   const saved=await client.publishProject(projectId,{
    slug:clean,projectRevisionId:rev.id,expectedRelease,idempotencyKey:pending.current.key,
   });
   setPublication({id:saved.id,slug:saved.slug,status:"ACTIVE",latestRelease:saved.latestRelease});
   setLatestRevision(remote.latestRevision);pending.current=null;
   setMessage("Релиз "+saved.latestRelease+" опубликован.");
  }catch(e){
   setError(e instanceof RemoteRequestError&&e.status===403?
    "Для публикации требуется роль ADMIN или OWNER.":e instanceof RemoteRequestError&&e.status===409?
    "Адрес занят или релиз изменился. Закройте панель и откройте снова.":
    "Не удалось опубликовать. Изменения на сервере не подтверждены.");
  }finally{setBusy(false);}
 }
 async function unpublish(){
  if(!projectId||!publication||busy||
   !window.confirm("Снять приглашение с публикации? Гости потеряют доступ к RSVP."))return;
  setBusy(true);setError("");
  try{
   await client.unpublishProject(projectId,publication.latestRelease);
   setPublication({...publication,status:"UNPUBLISHED"});
   setMessage("Приглашение снято с публикации. История и ответы сохранены.");
  }catch{setError("Не удалось снять с публикации. Обновите состояние релиза.");}
  finally{setBusy(false);}
 }
 return <div className="v2-preview-overlay v2-publish-overlay" role="dialog" aria-modal="true" aria-label="Публикация приглашения">
  <header className="v2-preview-header"><strong><StudioIcon name="share" size={18}/> Публикация</strong>
   <button disabled={busy} onClick={onClose}><StudioIcon name="close"/> Закрыть</button></header>
  <div className="v2-publish-scroll"><section className="v2-publish-panel">
   <h2>Ссылка для гостей</h2>
   <p>Публикуется последняя <strong>облачная ревизия</strong>. Сначала сохраните все изменения через «Облако»; локальные несохранённые правки сюда не попадают.</p>
   {!projectId?<p className="v2-publish-error" role="status">Облачный проект ещё не создан. Закройте окно, нажмите «Облако» и сохраните проект.</p>:<>
    <div className="v2-publish-meta"><span>Ревизия {latestRevision??"…"}</span><span>Релиз {publication?.latestRelease??0}</span><span>{publication?.status==="ACTIVE"?"Опубликовано":"Не опубликовано"}</span></div>
    <label className="v2-widget-field">Уникальная ссылка<input maxLength={80} placeholder="my-wedding" disabled={busy||!!publication} value={slug} onChange={e=>setSlug(e.target.value.toLowerCase())}/></label>
    <p>После первого выпуска адрес остаётся постоянным. Можно публиковать новые версии.</p>
    <div className="v2-publish-actions">
     <button disabled={busy||latestRevision===null} onClick={()=>void publish()}><StudioIcon name="share"/>{busy?"Подготовка…":publication?.status==="ACTIVE"?"Выпустить новую версию":"Опубликовать"}</button>
     {publication?.status==="ACTIVE"&&<button disabled={busy} onClick={()=>void unpublish()}>Снять с публикации</button>}
    </div>
    {shareUrl&&<div className="v2-publish-link"><a href={shareUrl} target="_blank" rel="noopener noreferrer">{shareUrl}</a><button disabled={busy} onClick={()=>{void navigator.clipboard.writeText(shareUrl).then(()=>setMessage("Ссылка скопирована.")).catch(()=>setError("Не удалось скопировать ссылку."));}}>Копировать</button></div>}
    {message&&<p role="status" className="v2-publish-status">{message}</p>}
    {error&&<p role="alert" className="v2-publish-error">{error}</p>}
    <section className="v2-publish-responses"><h3>Ответы гостей</h3>
     <p>Ответы доступны только редакторам и администраторам Workspace.</p>
     {summary?<div className="v2-publish-stats"><span>Ответов <strong>{summary.responses}</strong></span><span>Будут <strong>{summary.attending}</strong></span><span>Не придут <strong>{summary.declined}</strong></span></div>:<p>Ответов пока нет или недостаточно прав для просмотра.</p>}
     {replies.length>0&&<div className="v2-publish-replies">{replies.slice(0,20).map(r=><div key={r.id}><span>{r.guestName}</span><span>{r.attendance==="YES"?"Будет · "+r.guestCount:r.attendance==="NO"?"Не придёт":"Возможно"}</span></div>)}</div>}
    </section>
   </>}
  </section></div>
 </div>;
}
