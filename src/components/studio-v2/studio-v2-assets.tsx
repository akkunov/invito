"use client";
import {useEffect,useRef,useState} from "react";
import {createStudioRemoteClient, type RemoteSyncSettings} from "@/features/studio-v2/browser/remote-sync";
import {readMedia,importImage} from "@/features/studio-v2/browser/media-store";
import type {ProjectDocumentV2,ProjectNodeV2} from "@/features/studio-v2/core/document.schema.ts";
import type {Asset,Component} from "@/features/studio-v2/core/component-engine.ts";
type MediaPool={active:boolean;wanted:Set<string>;urls:Map<string,string>;pending:Set<string>;failed:Set<string>};
const MEDIA_CONCURRENCY=4;
export function useMediaUrls(assets:ProjectDocumentV2["assets"]){
 const [urls,setUrls]=useState<Record<string,string>>({});
 const pool=useRef<MediaPool|null>(null);
 const key=JSON.stringify([...new Set(Object.values(assets).map(a=>a.storageKey).filter(k=>k.startsWith("local:")))].sort());
 useEffect(()=>{
  const state:MediaPool={active:true,wanted:new Set(),urls:new Map(),pending:new Set(),failed:new Set()};
  pool.current=state;
  return()=>{state.active=false;for(const url of state.urls.values())URL.revokeObjectURL(url);state.urls.clear();if(pool.current===state)pool.current=null;};
 },[]);
 useEffect(()=>{
  const current=pool.current;if(!current)return;
  const state:MediaPool=current;
  state.wanted=new Set(JSON.parse(key) as string[]);
  for(const [k,url] of state.urls)if(!state.wanted.has(k)){URL.revokeObjectURL(url);state.urls.delete(k);}
  // Retain unchanged object URLs. Retry previously missing files only on a key-set change.
  state.failed.clear();
  const publish=()=>{if(!state.active)return;const next=Object.fromEntries(state.urls);setUrls(old=>Object.keys(old).length===Object.keys(next).length&&Object.keys(next).every(k=>old[k]===next[k])?old:next);};
  publish();
  function pump(){
   if(!state.active)return;
   while(state.pending.size<MEDIA_CONCURRENCY){
    const k=[...state.wanted].find(k=>!state.urls.has(k)&&!state.pending.has(k)&&!state.failed.has(k));
    if(!k)break;
    state.pending.add(k);
    void readMedia(k).then(blob=>{
     if(!state.active||!state.wanted.has(k))return;
     if(!blob){state.failed.add(k);return;}
     state.urls.set(k,URL.createObjectURL(blob));publish();
    }).catch(()=>{if(state.active&&state.wanted.has(k))state.failed.add(k);}).finally(()=>{state.pending.delete(k);pump();});
   }
  }
  pump();
 },[key]);
 return urls;
}
/** Refresh short-lived private R2 GET capabilities while a cloud project is open. */
export function useCloudAssetUrls(document: ProjectDocumentV2, settings?: RemoteSyncSettings) {
 const [urls,setUrls]=useState<Record<string,string>>({});
 const key=JSON.stringify([...new Set([
   ...Object.values(document.assets).map(a=>a.storageKey),
   ...Object.values(document.nodes).flatMap(node =>
     node.type==="widget"&&node.block.kind==="music" ? [node.block.source] : []),
 ].filter(key=>key.startsWith("asset:")))].sort());
 useEffect(()=>{
  if(!settings){setUrls({});return;}
  let active=true;
  const client=createStudioRemoteClient(settings);
  const ids=JSON.parse(key) as string[];
  const refresh=async()=>{
   const next:Record<string,string>={};
   let cursor=0;
   await Promise.all(Array.from({length:Math.min(4,ids.length)},async()=>{
    while(active&&cursor<ids.length){
     const storageKey=ids[cursor++]!;
     try {
      const result=await client.getMediaReadUrl(storageKey.slice(6));
      if(active)next[storageKey]=result.url;
     } catch { /* missing/forbidden asset stays unavailable */ }
    }
   }));
   if(active)setUrls(next);
  };
  void refresh();
  const timer=window.setInterval(()=>{void refresh();},45_000);
  return()=>{active=false;window.clearInterval(timer);};
 },[key,settings?.apiBaseUrl,settings?.workspaceId,settings?.accessToken,settings?.fetcher]);
 return urls;
}
function assetUrl(a:Asset,urls:Record<string,string>){return a.storageKey.startsWith("/images/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+a.storageKey:urls[a.storageKey];}
export function AssetLibrary({document,urls,onUpload,onInsert,onReplace,onFolder,onDelete,onCreateComponent,onAddVariant,onUpdateVariant,onInsertComponent,canCreate,canInsert,onError}:{document:ProjectDocumentV2;urls:Record<string,string>;onUpload:(asset:Asset)=>void;onInsert:(a:Asset)=>void;onReplace:(a:Asset)=>void;onFolder:(a:Asset,folder:string)=>void;onDelete:(a:Asset)=>void;onCreateComponent:(name:string)=>void;onAddVariant:(component:Component,name:string)=>void;onUpdateVariant:(component:Component,variantId:string)=>void;onInsertComponent:(component:Component,variantId:string)=>void;canCreate:boolean;canInsert:boolean;onError:(message:string)=>void}){
 const input=useRef<HTMLInputElement>(null);
 const [search,setSearch]=useState(""),[folder,setFolder]=useState(""),[filter,setFilter]=useState(""),[busy,setBusy]=useState(false),[name,setName]=useState("");
 const folders=[...new Set(Object.values(document.assets).map(a=>a.folder).filter(Boolean))] as string[];
 const assets=Object.values(document.assets).filter(a=>(!filter||a.folder===filter)&&a.name.toLowerCase().includes(search.toLowerCase()));
 async function upload(files:FileList|null){
  if(!files||busy)return;setBusy(true);
  try{for(const file of Array.from(files).slice(0,20)){try{onUpload(await importImage(file,folder));}catch(e){onError(e instanceof Error?e.message:"Не удалось загрузить изображение");}}}finally{setBusy(false);if(input.current)input.current.value="";}
 }
 return <div className="v2-sidebar-section">
  <div className="v2-sidebar-heading"><strong>Ресурсы</strong></div>
  <input className="v2-library-input" placeholder="Поиск изображений" value={search} onChange={e=>setSearch(e.target.value)}/>
  <input className="v2-library-input" placeholder="Папка для загрузки" maxLength={80} value={folder} onChange={e=>setFolder(e.target.value)}/>
  <select className="v2-library-input" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Все папки</option>{folders.map(f=><option key={f}>{f}</option>)}</select>
  <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={e=>void upload(e.target.files)}/>
  <button className="v2-inspector-button" disabled={busy} onClick={()=>input.current?.click()}>{busy?"Загрузка…":"+ Загрузить изображения"}</button>
  <div className="v2-assets-grid">{assets.map(a=><article key={a.id} className="v2-asset-card">
    <div className="v2-asset-preview">{assetUrl(a,urls)?<img loading="lazy" decoding="async" src={assetUrl(a,urls)} alt={a.name}/>:<span>Нет файла</span>}</div>
    <strong title={a.name}>{a.name}</strong>
    <input aria-label={"Папка "+a.name} className="v2-library-input" value={a.folder??""} maxLength={80} placeholder="Без папки" onChange={e=>onFolder(a,e.target.value)}/>
    <div className="v2-asset-actions"><button disabled={!canInsert} onClick={()=>onInsert(a)}>Добавить</button><button onClick={()=>onReplace(a)}>Заменить</button><button aria-label={"Удалить "+a.name} onClick={()=>onDelete(a)}>×</button></div>
  </article>)}</div>
  <div className="v2-sidebar-heading"><strong>Компоненты</strong></div>
  <input className="v2-library-input" placeholder="Название компонента / варианта" maxLength={100} value={name} onChange={e=>setName(e.target.value)}/>
  <button className="v2-inspector-button" disabled={!canCreate||!name.trim()} onClick={()=>onCreateComponent(name.trim())}>Создать из выделения</button>
  {Object.values(document.components??{}).map(c=><div key={c.id} className="v2-component-item"><strong>{c.name}</strong>
    {c.variants.map(v=><div key={v.id} className="v2-component-variant"><button className="v2-inspector-button" disabled={!canInsert} onClick={()=>onInsertComponent(c,v.id)}>+ {v.name}</button><button className="v2-inspector-button" disabled={!canCreate} aria-label={"Обновить мастер "+c.name+" / "+v.name} onClick={()=>onUpdateVariant(c,v.id)}>Обновить мастер из выделения</button></div>)}
    <button className="v2-inspector-button" disabled={!canCreate||!name.trim()} onClick={()=>onAddVariant(c,name.trim())}>Добавить вариант из выделения</button>
  </div>)}
 </div>;
}
export function ImageControls({node,onChange}:{node:Extract<ProjectNodeV2,{type:"image"}>;onChange:(patch:Partial<Pick<typeof node,"fit"|"focalX"|"focalY">>)=>void}){
 return <section className="v2-inspector-section"><h3>Изображение</h3>
 <label className="v2-layout-field">Режим<select value={node.fit} onChange={e=>onChange({fit:e.target.value as "cover"|"contain"})}><option value="cover">Заполнить / Crop</option><option value="contain">Вместить</option></select></label>
 <label className="v2-layout-field">Фокус X<input type="range" min={0} max={1} step={.01} value={node.focalX} onChange={e=>onChange({focalX:Number(e.target.value)})}/></label>
 <label className="v2-layout-field">Фокус Y<input type="range" min={0} max={1} step={.01} value={node.focalY} onChange={e=>onChange({focalY:Number(e.target.value)})}/></label>
 <button className="v2-inspector-button" onClick={()=>onChange({focalX:.5,focalY:.5})}>По центру</button>
 </section>;
}
