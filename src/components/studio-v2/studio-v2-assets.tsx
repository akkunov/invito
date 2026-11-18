"use client";
import {useEffect,useRef,useState} from "react";
import {readMedia,importImage} from "@/features/studio-v2/browser/media-store";
import type {ProjectDocumentV2,ProjectNodeV2} from "@/features/studio-v2/core/document.schema.ts";
import type {Asset,Component} from "@/features/studio-v2/core/component-engine.ts";
export function useMediaUrls(assets:ProjectDocumentV2["assets"]){
 const [urls,setUrls]=useState<Record<string,string>>({});
 const key=JSON.stringify(Object.values(assets).map(a=>a.storageKey).filter(k=>k.startsWith("local:")).sort());
 useEffect(()=>{
  let active=true;const allocated:string[]=[];
  setUrls({});
  void Promise.all((JSON.parse(key) as string[]).map(async k=>{
   try{const blob=await readMedia(k);if(!blob||!active)return null;const url=URL.createObjectURL(blob);allocated.push(url);return [k,url] as const;}catch{return null;}
  })).then(entries=>{if(active)setUrls(Object.fromEntries(entries.filter((e):e is readonly [string,string]=>e!==null)));});
  return()=>{active=false;allocated.forEach(URL.revokeObjectURL);};
 },[key]);return urls;
}
function assetUrl(a:Asset,urls:Record<string,string>){return a.storageKey.startsWith("/images/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+a.storageKey:urls[a.storageKey];}
export function AssetLibrary({document,urls,onUpload,onInsert,onReplace,onFolder,onDelete,onCreateComponent,onAddVariant,onInsertComponent,canCreate,canInsert,onError}:{document:ProjectDocumentV2;urls:Record<string,string>;onUpload:(asset:Asset)=>void;onInsert:(a:Asset)=>void;onReplace:(a:Asset)=>void;onFolder:(a:Asset,folder:string)=>void;onDelete:(a:Asset)=>void;onCreateComponent:(name:string)=>void;onAddVariant:(component:Component,name:string)=>void;onInsertComponent:(component:Component,variantId:string)=>void;canCreate:boolean;canInsert:boolean;onError:(message:string)=>void}){
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
    <div className="v2-asset-preview">{assetUrl(a,urls)?<img src={assetUrl(a,urls)} alt={a.name}/>:<span>Нет файла</span>}</div>
    <strong title={a.name}>{a.name}</strong>
    <input aria-label={"Папка "+a.name} className="v2-library-input" value={a.folder??""} maxLength={80} placeholder="Без папки" onChange={e=>onFolder(a,e.target.value)}/>
    <div className="v2-asset-actions"><button disabled={!canInsert} onClick={()=>onInsert(a)}>Добавить</button><button onClick={()=>onReplace(a)}>Заменить</button><button aria-label={"Удалить "+a.name} onClick={()=>onDelete(a)}>×</button></div>
  </article>)}</div>
  <div className="v2-sidebar-heading"><strong>Компоненты</strong></div>
  <input className="v2-library-input" placeholder="Название компонента / варианта" maxLength={100} value={name} onChange={e=>setName(e.target.value)}/>
  <button className="v2-inspector-button" disabled={!canCreate||!name.trim()} onClick={()=>onCreateComponent(name.trim())}>Создать из выделения</button>
  {Object.values(document.components??{}).map(c=><div key={c.id} className="v2-component-item"><strong>{c.name}</strong>
    {c.variants.map(v=><button key={v.id} className="v2-inspector-button" disabled={!canInsert} onClick={()=>onInsertComponent(c,v.id)}>+ {v.name}</button>)}
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
