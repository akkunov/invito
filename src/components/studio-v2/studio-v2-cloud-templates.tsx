"use client";

import {useEffect,useMemo,useState} from "react";
import {createStudioRemoteClient,type RemoteSyncSettings} from "@/features/studio-v2/browser/remote-sync";
import {forkTemplateDocument} from "@/features/studio-v2/core/template-registry";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema";

type Entry=Awaited<ReturnType<ReturnType<typeof createStudioRemoteClient>["listTemplates"]>>["items"][number];

/** Server templates are immutable here: opening creates a separate local design project. */
export function StudioCloudTemplates({settings,onOpen,disabled}:{
 settings:RemoteSyncSettings;onOpen:(document:ProjectDocumentV2)=>Promise<void>;disabled:boolean;
}){
 const api=useMemo(()=>createStudioRemoteClient(settings),[settings]);
 const [items,setItems]=useState<Entry[]>([]);
 const [next,setNext]=useState<number|null>(null);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState("");
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  let active=true;
  setBusy(true);setItems([]);setNext(null);setError("");
  void api.listTemplates().then(result=>{
   if(active){setItems(result.items);setNext(result.nextPage);}
  }).catch(()=>{if(active)setError("Не удалось загрузить шаблоны из аккаунта.");})
  .finally(()=>{if(active)setBusy(false);});
  return()=>{active=false;};
 },[api,retry]);
 async function loadMore(){
  if(!next||busy||disabled)return;
  setBusy(true);setError("");
  try{const result=await api.listTemplates(next);
   setItems(old=>[...old,...result.items.filter(item=>!old.some(x=>x.id===item.id))]);setNext(result.nextPage);
  }catch{setError("Не удалось загрузить следующую страницу.");}
  finally{setBusy(false);}
 }
 async function open(item:Entry){
  if(busy||disabled)return;
  setBusy(true);setError("");
  try{
   const version=await api.getTemplateVersion(item.id,item.latestVersion);
   const copy=forkTemplateDocument(version.document,"project-"+crypto.randomUUID());
   // Some web-first packages intentionally share the same artboard origin.
   // Arrange only the new working copy, never the published source version.
   const origin=copy.pages[0]?.placement;
   if(origin&&copy.pages.length>1&&copy.pages.every(page=>page.placement.x===origin.x&&page.placement.y===origin.y)){
    let x=origin.x;
    for(const page of copy.pages){
     page.placement={x,y:origin.y};x+=copy.nodes[page.rootNodeId].width+80;
    }
   }
   await onOpen(copy);
  }catch(e){setError(e instanceof Error?e.message:"Не удалось открыть шаблон.");}
  finally{setBusy(false);}
 }
 return <section className="v2-cloud-template-library" aria-label="Серверные шаблоны">
  <div className="v2-cloud-template-heading"><div><h3>Шаблоны из аккаунта</h3><p className="v2-placeholder">Актуальные версии из Supabase. Открытие создаёт локальную копию, не меняя опубликованный шаблон.</p></div><button className="v2-inspector-button" disabled={busy||disabled} onClick={()=>setRetry(n=>n+1)}>Обновить</button></div>
  {error&&<p role="alert" className="v2-inspector-error">{error}</p>}
  {busy&&!items.length&&<p role="status" className="v2-placeholder">Загрузка…</p>}
  {!busy&&!error&&!items.length&&<p className="v2-placeholder">В рабочем пространстве пока нет серверных шаблонов.</p>}
  <div className="v2-cloud-template-grid">
   {items.map(item=><button key={item.id} type="button" className="v2-cloud-template-item" disabled={busy||disabled} onClick={()=>void open(item)}><strong>{item.name}</strong><span>v{item.latestVersion} · {item.slug}</span><span>Открыть копию в Studio</span></button>)}
  </div>
  {next&&<button className="v2-inspector-button" disabled={busy||disabled} onClick={()=>void loadMore()}>Показать ещё</button>}
 </section>;
}
