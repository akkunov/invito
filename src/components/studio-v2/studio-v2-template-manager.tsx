"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {type ProjectDocumentV2,createEmptyProjectV2} from "@/features/studio-v2/core/document.schema.ts";
import {templateCategories,createTemplate,appendTemplateVersion,restoreTemplateVersion,duplicateTemplate,filterTemplates,updateTemplateMeta,templateDocument,forkTemplateDocument,type TemplateRecord,type TemplateMeta} from "@/features/studio-v2/core/template-registry.ts";
import {listLocalTemplates,saveLocalTemplate,deleteLocalTemplate,listLocalProjectIds,loadLocalProject} from "@/features/studio-v2/browser/media-store.ts";
import {exportTemplatePackage,importTemplatePackage,downloadTemplatePackage} from "@/features/studio-v2/browser/template-package.ts";
import {bindDocument} from "@/features/studio-v2/core/invitation-behavior.ts";
import {resolveStyleDocument} from "@/features/studio-v2/core/style-tokens.ts";
import {layoutDocument} from "@/features/studio-v2/core/layout-engine.ts";
import {useMediaUrls} from "./studio-v2-assets";
import {StudioV2Artboard} from "./studio-v2-artboard";
import {StudioIcon} from "./studio-icon";
import {PersonalizationConfig} from "./studio-v2-personalization-config";
import {TemplateOutput} from "./studio-v2-template-output";
import {coverStorageKey,validateTemplateResources} from "@/features/studio-v2/browser/template-output";
import {readMedia} from "@/features/studio-v2/browser/media-store";
const categories:Record<TemplateMeta["category"],string>={wedding:"Свадьба","kyz-uzatuu":"Кыз узатуу",birthday:"День рождения",anniversary:"Юбилей",corporate:"Корпоратив",other:"Другое"};
const now=()=>new Date().toISOString();
const newId=()=> "template-"+crypto.randomUUID();
function Cover({record,revision}:{record:TemplateRecord;revision:number}){
 const [cached,setCached]=useState<string|null>(null),coverKey=coverStorageKey(record);
 useEffect(()=>{let active=true,url:string|null=null;setCached(null);void readMedia(coverKey).then(blob=>{if(active&&blob){url=URL.createObjectURL(blob);setCached(url);}}).catch(()=>{});return()=>{active=false;if(url)URL.revokeObjectURL(url);};},[coverKey,revision]);
 const source=templateDocument(record);
 const doc=useMemo(()=>layoutDocument(resolveStyleDocument(bindDocument(source))),[source]);
 const page=doc.pages.find(p=>p.id===record.meta.coverPageId)??doc.pages[0],root=doc.nodes[page.rootNodeId],urls=useMediaUrls(source.assets);
 const scale=Math.min(132/root.width,184/root.height,1);
 if(cached)return <div className="v2-template-cover" aria-hidden="true"><img src={cached} alt="" className="v2-template-generated-cover"/></div>;
 return <div className="v2-template-cover" aria-hidden="true"><div style={{position:"relative",width:root.width*scale,height:root.height*scale,overflow:"hidden"}}><div style={{transform:"scale("+scale+")",transformOrigin:"top left",width:root.width,height:root.height}}><StudioV2Artboard document={doc} rootNodeId={page.rootNodeId} guest={{mode:"studio"}} mediaUrls={urls}/></div></div></div>;
}
type Props={document:ProjectDocumentV2;onOpen:(doc:ProjectDocumentV2)=>Promise<void>;onClose:()=>void};
export function TemplateManager({document,onOpen,onClose}:Props){
 const [projectIds,setProjectIds]=useState<string[]>([]),[projectId,setProjectId]=useState(""),[tagDraft,setTagDraft]=useState("");
 const [outputBusy,setOutputBusy]=useState(false),[coverRevision,setCoverRevision]=useState(0);
 const [records,setRecords]=useState<TemplateRecord[]>([]),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [query,setQuery]=useState(""),[category,setCategory]=useState(""),[status,setStatus]=useState(""),[limit,setLimit]=useState(12);
 const [selected,setSelected]=useState(""),[version,setVersion]=useState(1),[meta,setMeta]=useState<TemplateMeta|null>(null),[note,setNote]=useState(""),[newName,setNewName]=useState(""),[newCategory,setNewCategory]=useState<TemplateMeta["category"]>("wedding");
 const fileInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{let active=true;void Promise.all([listLocalTemplates(),listLocalProjectIds()]).then(([list,ids])=>{if(active){setRecords(list);setProjectIds(ids);}}).catch(e=>{if(active)setError(String(e));}).finally(()=>{if(active)setLoaded(true);});return()=>{active=false;};},[]);
 const record=records.find(t=>t.id===selected),filtered=filterTemplates(records,query,category,status);
 const selectedVersion=record?.versions.find(v=>v.number===version);
 function choose(t:TemplateRecord){setSelected(t.id);setMeta(structuredClone(t.meta));setTagDraft(t.meta.tags.join(", "));setVersion(t.versions.length);setNote("");}
 async function action(task:()=>Promise<void>){if(busy||outputBusy||!loaded)return;setBusy(true);setError("");setMessage("");try{await task();}catch(e){setError(e instanceof Error?e.message:"Не удалось выполнить операцию.");}finally{setBusy(false);}}
 async function persist(t:TemplateRecord){await saveLocalTemplate(t);setRecords(old=>[...old.filter(v=>v.id!==t.id),t]);choose(t);}
 async function create(blank=false){if(!newName.trim())return;const id=newId(),source=blank?createEmptyProjectV2(id,document.locale):document;
  await persist(createTemplate(id,{name:newName.trim(),category:newCategory,description:"",tags:[],coverPageId:source.pages[0].id,status:"draft"},source,now()));setNewName("");setMessage("Шаблон создан.");
 }
 return <div className="v2-preview-overlay v2-template-manager" role="dialog" aria-modal="true" aria-label="Менеджер шаблонов">
 <header className="v2-preview-header"><strong>Template Manager</strong><span className="v2-placeholder">Локальная библиотека · {records.length}</span><div className="v2-template-header-actions"><button disabled={busy||outputBusy||!loaded} onClick={()=>fileInput.current?.click()}><StudioIcon name="download"/> Импорт</button><button disabled={busy||outputBusy} onClick={onClose} aria-label="Закрыть менеджер шаблонов"><StudioIcon name="close"/></button></div><input type="file" accept=".json,application/json" ref={fileInput} hidden onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(file)void action(async()=>{const t=await importTemplatePackage(file);setRecords(old=>[...old,t]);choose(t);setMessage("Пакет импортирован.");});}}/></header>
 <div className="v2-template-body">
 <section className="v2-template-library">
 <div className="v2-template-filters"><input aria-label="Поиск шаблонов" placeholder="Поиск по названию или тегам" value={query} onChange={e=>{setQuery(e.target.value);setLimit(12);}}/><select aria-label="Категория шаблонов" value={category} onChange={e=>{setCategory(e.target.value);setLimit(12);}}><option value="">Все категории</option>{templateCategories.map(c=><option key={c} value={c}>{categories[c]}</option>)}</select><select aria-label="Статус шаблонов" value={status} onChange={e=>setStatus(e.target.value)}><option value="">Все статусы</option><option value="draft">Черновики</option><option value="ready">Готовые</option></select></div>
 <div className="v2-template-projects"><label>Локальные проекты<select aria-label="Сохранённый проект" value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">Выберите проект</option>{projectIds.filter(id=>id!==document.id).map(id=><option key={id} value={id}>{id==="studio-v2-demo"?"Исходный демо-проект":id}</option>)}</select></label><button disabled={!projectId||busy||outputBusy} onClick={()=>void action(async()=>{const doc=await loadLocalProject(projectId);if(!doc)throw Error("Проект не найден");await onOpen(doc);onClose();})}>Открыть проект</button></div><div className="v2-template-create"><input aria-label="Название нового шаблона" placeholder="Название нового шаблона" maxLength={100} value={newName} onChange={e=>setNewName(e.target.value)}/><select aria-label="Категория нового шаблона" value={newCategory} onChange={e=>setNewCategory(e.target.value as TemplateMeta["category"])}>{templateCategories.map(c=><option key={c} value={c}>{categories[c]}</option>)}</select><button disabled={busy||outputBusy||!loaded||!newName.trim()} onClick={()=>void action(()=>create())}><StudioIcon name="plus"/> Из текущего проекта</button><button disabled={busy||outputBusy||!loaded||!newName.trim()} onClick={()=>void action(()=>create(true))}>Пустой шаблон</button></div>
 {!loaded?<p className="v2-placeholder">Загрузка библиотеки…</p>:!filtered.length?<div className="v2-template-empty"><StudioIcon name="frame" size={32}/><strong>{records.length?"Ничего не найдено":"Создайте первый шаблон"}</strong><p>Сохраните текущий дизайн или импортируйте пакет INVITO.</p></div>:<div className="v2-template-grid">{filtered.slice(0,limit).map(t=><button key={t.id} className="v2-template-card" aria-pressed={t.id===selected} disabled={busy||outputBusy} onClick={()=>choose(t)}><Cover record={t} revision={coverRevision}/><div><strong>{t.meta.name}</strong><span>{categories[t.meta.category]} · v{t.versions.length} · {t.meta.status==="ready"?"Готов":"Черновик"}</span></div></button>)}</div>}
 {filtered.length>limit&&<button className="v2-inspector-button" onClick={()=>setLimit(n=>n+12)}>Показать ещё</button>}
 </section>
 <aside className="v2-template-details">
 {error&&<p role="alert" className="v2-inspector-error">{error}</p>}{message&&<p role="status" className="v2-template-message">{message}</p>}
 {record&&meta?<fieldset disabled={busy||outputBusy} className="v2-appearance-fieldset"><h3>Свойства шаблона</h3>
 <label className="v2-widget-field">Название<input maxLength={100} value={meta.name} onChange={e=>setMeta({...meta,name:e.target.value})}/></label>
 <label className="v2-widget-field">Категория<select value={meta.category} onChange={e=>setMeta({...meta,category:e.target.value as TemplateMeta["category"]})}>{templateCategories.map(c=><option key={c} value={c}>{categories[c]}</option>)}</select></label>
 <label className="v2-widget-field">Описание<textarea rows={3} maxLength={1000} value={meta.description} onChange={e=>setMeta({...meta,description:e.target.value})}/></label>
 <label className="v2-widget-field">Теги через запятую<input value={tagDraft} maxLength={500} onChange={e=>setTagDraft(e.target.value)}/></label>
 <label className="v2-widget-field">Обложка<select value={meta.coverPageId} onChange={e=>setMeta({...meta,coverPageId:e.target.value})}>{templateDocument(record).pages.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
 <label className="v2-widget-field">Статус<select value={meta.status} onChange={e=>setMeta({...meta,status:e.target.value as TemplateMeta["status"]})}><option value="draft">Черновик</option><option value="ready">Готов к публикации</option></select></label>
 <button className="v2-inspector-button" onClick={()=>void action(async()=>{const updated=updateTemplateMeta(record,{...meta,tags:[...new Set(tagDraft.split(",").map(t=>t.trim()).filter(Boolean))].slice(0,12)},now());if(updated.meta.status==="ready"){const issues=await validateTemplateResources(updated);if(issues.some(i=>i.severity==="error"))throw Error("Нельзя отметить готовым: "+issues.filter(i=>i.severity==="error").map(i=>i.message).join("; "));}await persist(updated);setMessage("Свойства сохранены.");})}>Сохранить свойства</button>
 <h3>Версии</h3><label className="v2-widget-field">Версия<select aria-label="Версия шаблона" value={version} onChange={e=>setVersion(Number(e.target.value))}>{[...record.versions].reverse().map(v=><option key={v.number} value={v.number}>v{v.number} · {v.note||"Снимок"}</option>)}</select></label>
 <button className="v2-inspector-button" onClick={()=>void action(async()=>{if(!selectedVersion)return;await onOpen(forkTemplateDocument(selectedVersion.document,"project-"+crypto.randomUUID()));onClose();})}>Открыть выбранную версию в Studio</button>
 <button className="v2-inspector-button" disabled={version===record.versions.length||record.versions.length>=50} onClick={()=>void action(async()=>{await persist(restoreTemplateVersion(record,version,now()));setMessage("Версия восстановлена новым снимком.");})}>Восстановить как новую версию</button>
 <label className="v2-widget-field">Комментарий к версии<input maxLength={300} value={note} onChange={e=>setNote(e.target.value)}/></label>
 <button className="v2-inspector-button" disabled={record.versions.length>=50} onClick={()=>void action(async()=>{await persist(appendTemplateVersion(record,document,note,now()));setMessage("Текущий проект сохранён новой версией.");})}>Сохранить текущий проект новой версией</button>
 <h3>Действия</h3>
 <button className="v2-inspector-button" onClick={()=>void action(async()=>{await persist(duplicateTemplate(record,newId(),now()));setMessage("Копия создана.");})}><StudioIcon name="copy"/> Дублировать</button>
 <button className="v2-inspector-button" onClick={()=>void action(async()=>{downloadTemplatePackage(await exportTemplatePackage(record),record.meta.name);setMessage("Пакет подготовлен.");})}><StudioIcon name="download"/> Экспорт последней версии</button>
 <button className="v2-inspector-button v2-danger" onClick={()=>{if(window.confirm("Удалить шаблон и его версии? Открытые проекты останутся."))void action(async()=>{await deleteLocalTemplate(record.id);setRecords(old=>old.filter(t=>t.id!==record.id));setSelected("");setMeta(null);});}}>Удалить шаблон</button>
 <p className="v2-placeholder">Статус «Готов» — локальная отметка, не публичная публикация. Экспорт содержит последнюю версию и все её изображения.</p>
 </fieldset>:<p className="v2-placeholder">Выберите шаблон для настройки и управления версиями.</p>}
 {record&&<PersonalizationConfig key={record.id+"-"+record.versions.length} record={record} disabled={busy||outputBusy} onSave={async t=>{await persist(t);setMessage("Поля клиента сохранены новой версией.");}}/>}
 {record&&<TemplateOutput key={record.id+"-"+record.versions.length+"-"+record.meta.coverPageId} record={record} onBusy={setOutputBusy} onCover={()=>setCoverRevision(v=>v+1)} onVariant={persist}/>}
 </aside></div></div>;
}
