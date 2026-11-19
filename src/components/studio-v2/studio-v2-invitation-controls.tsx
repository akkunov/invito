"use client";
import {useRef,useState} from "react";
import {createStudioRemoteClient,type RemoteSyncSettings} from "@/features/studio-v2/browser/remote-sync";
import {ColorPicker,projectPalette} from "./studio-v2-color-picker";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema.ts";
import {bindingKeySchema,bindingValueSchema,instantSchema,invitationBlockSchema,musicSourceSchema,type BindingValue,type InvitationBlock} from "@/features/studio-v2/core/invitation.schema.ts";
import {BLOCK_NAMES,type BlockKind,type WidgetNode} from "@/features/studio-v2/core/invitation-behavior.ts";
import type {StudioCommand} from "@/features/studio-v2/core/command-engine.ts";
const kinds=Object.keys(BLOCK_NAMES) as BlockKind[];
type Locale=ProjectDocumentV2["locale"];
type Localized={ru:string;ky:string};
function LocalizedFields({label,value,onChange}:{label:string;value:Localized;onChange:(v:Localized)=>void}){
 return <>{(["ru","ky"] as const).map(lang=><label key={lang} className="v2-widget-field">{label} · {lang.toUpperCase()}<input lang={lang} maxLength={500} value={value[lang]} onChange={e=>onChange({...value,[lang]:e.target.value})}/></label>)}</>;
}
function DraftField({label,value,validate,onCommit,placeholder}:{label:string;value:string;validate:(s:string)=>boolean;onCommit:(s:string)=>void;placeholder?:string}){
 const [draft,setDraft]=useState<string|null>(null),[error,setError]=useState(false);
 function save(){if(draft===null)return;if(!validate(draft)){setError(true);return;}onCommit(draft);setDraft(null);setError(false);}
 return <label className="v2-widget-field">{label}<input value={draft??value} placeholder={placeholder} aria-invalid={error} onChange={e=>{setDraft(e.target.value);setError(false);}} onBlur={save} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();save();}if(e.key==="Escape"){e.stopPropagation();setDraft(null);setError(false);}}}/>{error&&<span role="alert">Проверьте формат значения.</span>}</label>;
}
export function InvitationControls({document,node,onInsert,onCommand,disabled,remoteSettings}:{document:ProjectDocumentV2;node:ProjectDocumentV2["nodes"][string]|null;onInsert:(kind:BlockKind)=>void;onCommand:(command:StudioCommand)=>void;disabled:boolean;remoteSettings?:RemoteSyncSettings}){
 const [kind,setKind]=useState<BlockKind>("rsvp");
 const locale=document.locale;
 const [key,setKey]=useState(""),[type,setType]=useState<BindingValue["type"]>("text"),[error,setError]=useState("");
 function createVariable(){
  if(!bindingKeySchema.safeParse(key).success||Object.hasOwn(document.variables,key)){setError("Введите уникальный ключ: буквы латиницы, цифры, точка или дефис.");return;}
  const values:Record<BindingValue["type"],BindingValue>={text:{type:"text",value:{ru:"",ky:""}},date:{type:"date",value:new Date().toISOString()},number:{type:"number",value:0},boolean:{type:"boolean",value:false}};
  onCommand({kind:"putVariable",key,variable:{type,label:{ru:key,ky:key}},value:values[type]});setKey("");setError("");
 }
 return <section className="v2-inspector-section">
 <h3>Блоки приглашения</h3>
 <label className="v2-widget-field">Тип блока<select value={kind} onChange={e=>setKind(e.target.value as BlockKind)}>{kinds.map(k=><option key={k} value={k}>{BLOCK_NAMES[k][locale]}</option>)}</select></label>
 <button className="v2-inspector-button" disabled={disabled} onClick={()=>onInsert(kind)}>+ Добавить блок</button>
 {node?.type==="widget"&&<WidgetSettings key={node.id} node={node} document={document} onCommand={onCommand} remoteSettings={remoteSettings} disabled={disabled}/>}
 {node?.type==="text"&&<label className="v2-widget-field">Привязка текста<select value={node.bindingKey??""} onChange={e=>onCommand({kind:"updateNode",id:node.id,changes:{bindingKey:e.target.value||null}})}><option value="">Обычный текст</option>{Object.keys(document.variables).map(k=><option key={k}>{k}</option>)}</select></label>}
 <details className="v2-widget-variables"><summary>Переменные проекта</summary>
 <label className="v2-widget-field">Ключ<input value={key} maxLength={100} placeholder="event.names" onChange={e=>setKey(e.target.value)}/></label>
 <label className="v2-widget-field">Тип<select value={type} onChange={e=>setType(e.target.value as BindingValue["type"])}>{(["text","date","number","boolean"] as const).map(t=><option key={t} value={t}>{({text:"Текст",date:"Дата",number:"Число",boolean:"Да / Нет"})[t]}</option>)}</select></label>
 <button className="v2-inspector-button" disabled={disabled} onClick={createVariable}>+ Переменная</button>
 {error&&<p role="alert" className="v2-placeholder">{error}</p>}
 {Object.entries(document.variables).map(([k,v])=><VariableFields key={k} name={k} type={v.type} value={document.values?.[k]} onChange={value=>onCommand({kind:"setVariableValue",key:k,value})}/>)}
 </details></section>;
}
function VariableFields({name,type,value,onChange}:{name:string;type:BindingValue["type"];value?:BindingValue;onChange:(v:BindingValue)=>void}){
 return <div className="v2-component-item"><strong>{name}</strong>{type==="text"?<LocalizedFields label="Значение" value={value?.type==="text"?value.value:{ru:"",ky:""}} onChange={v=>onChange({type:"text",value:v})}/>:type==="date"?<DraftField label="Дата и время ISO с часовым поясом" placeholder="2027-06-14T16:00:00+06:00" value={value?.type==="date"?value.value:""} validate={s=>instantSchema.safeParse(s).success} onCommit={v=>onChange({type:"date",value:v})}/>:type==="number"?<DraftField label="Число" value={value?.type==="number"?String(value.value):""} validate={s=>s.trim()!==""&&bindingValueSchema.safeParse({type:"number",value:Number(s)}).success} onCommit={s=>onChange({type:"number",value:Number(s)})}/>:<label className="v2-widget-field">Значение<input type="checkbox" checked={value?.type==="boolean"&&value.value} onChange={e=>onChange({type:"boolean",value:e.target.checked})}/></label>}</div>;
}
function MusicCloudUpload({settings,disabled,onUploaded}:{settings?:RemoteSyncSettings;disabled:boolean;onUploaded:(source:string)=>void}){
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const input=useRef<HTMLInputElement>(null);
 async function upload(file?:File){
  if(!file||!settings||disabled||busy)return;
  if(file.type!=="audio/mpeg"||file.size===0||file.size>15*1024*1024){
   setMessage("Поддерживается MP3 до 15 МБ.");return;
  }
  setBusy(true);setMessage("Загружаем и проверяем MP3 на сервере…");
  try{
   const verified=await createStudioRemoteClient(settings).uploadMedia(file.name,file);
   if(verified.mimeType!=="audio/mpeg"||verified.status!=="READY")throw Error("INVALID_AUDIO_UPLOAD");
   onUploaded(verified.storageKey);
   setMessage("Трек привязан к блоку. Сохраните проект в облаке.");
  }catch(error){
   setMessage(error instanceof Error&&error.message==="SIGN_IN_REQUIRED"
    ?"Нужно войти в аккаунт."
    :"Не удалось загрузить трек. Локальные данные не изменены.");
  }finally{setBusy(false);if(input.current)input.current.value="";}
 }
 if(!settings)return <p className="v2-placeholder">Облачная загрузка MP3 доступна после подключения аккаунта.</p>;
 return <div className="v2-widget-field">
  <input ref={input} type="file" accept="audio/mpeg,.mp3" hidden onChange={e=>void upload(e.target.files?.[0])}/>
  <button className="v2-inspector-button" disabled={disabled||busy} onClick={()=>input.current?.click()}>
   {busy?"Загрузка…":"Загрузить MP3 в облако"}
  </button>
  {message&&<p role="status" className="v2-placeholder">{message}</p>}
 </div>;
}
function WidgetSettings({node,document,onCommand,remoteSettings,disabled}:{node:WidgetNode;document:ProjectDocumentV2;onCommand:(c:StudioCommand)=>void;remoteSettings?:RemoteSyncSettings;disabled:boolean}){
 const b=node.block;
 function update(block:InvitationBlock){if(invitationBlockSchema.safeParse(block).success)onCommand({kind:"updateNode",id:node.id,changes:{block}});}
 function appearance(patch:Partial<WidgetNode["appearance"]>){onCommand({kind:"updateNode",id:node.id,changes:{appearance:{...node.appearance,...patch}}});}
 const keys=(type:BindingValue["type"])=>Object.keys(document.variables).filter(k=>document.variables[k].type===type);
 return <div className="v2-widget-settings">
 <strong>{BLOCK_NAMES[b.kind][document.locale]}</strong>
 <LocalizedFields label="Заголовок" value={b.title} onChange={title=>update({...b,title})}/>
 {b.kind==="rsvp"&&<><DraftField label="Срок ответа (ISO)" value={b.deadline??""} placeholder="2027-06-01T23:59:00+06:00" validate={s=>!s||instantSchema.safeParse(s).success} onCommit={s=>update({...b,deadline:s||null})}/><label className="v2-widget-field">Макс. гостей<input type="number" min={1} max={10} value={b.maxGuests} onChange={e=>update({...b,maxGuests:Number(e.target.value)})}/></label></>}
 {b.kind==="countdown"&&<><DraftField label="Дата события (ISO)" value={b.target} validate={s=>instantSchema.safeParse(s).success} onCommit={target=>update({...b,target})}/><label className="v2-widget-field">Дата из переменной<select value={b.targetKey??""} onChange={e=>update({...b,targetKey:e.target.value||null})}><option value="">Собственная дата</option>{keys("date").map(k=><option key={k}>{k}</option>)}</select></label></>}
 {b.kind==="location"&&<><LocalizedFields label="Адрес" value={b.address} onChange={address=>update({...b,address})}/><label className="v2-widget-field">Адрес из переменной<select value={b.addressKey??""} onChange={e=>update({...b,addressKey:e.target.value||null})}><option value="">Собственный адрес</option>{keys("text").map(k=><option key={k}>{k}</option>)}</select></label></>}
 {b.kind==="gallery"&&<div className="v2-widget-gallery-settings"><p className="v2-placeholder">Фото: {b.assetIds.length} / 4</p>{Object.values(document.assets).map(a=><label key={a.id}><input type="checkbox" checked={b.assetIds.includes(a.id)} disabled={!b.assetIds.includes(a.id)&&b.assetIds.length===4} onChange={e=>update({...b,assetIds:e.target.checked?[...b.assetIds,a.id]:b.assetIds.filter(id=>id!==a.id)})}/>{a.name}</label>)}</div>}
 {b.kind==="music"&&<><DraftField label="Прямая HTTPS-ссылка на аудиофайл" value={b.source} placeholder="https://example.com/music.mp3" validate={s=>musicSourceSchema.safeParse(s).success} onCommit={source=>update({...b,source})}/><MusicCloudUpload settings={remoteSettings} disabled={disabled} onUploaded={source=>update({...b,source})}/><p className="v2-placeholder">Музыка запускается по нажатию. Облачные треки доступны только участникам Workspace до публикации.</p></>}
 {b.kind==="schedule"&&<>{b.items.map((item,i)=><div className="v2-component-item" key={i}><DraftField label="Время (ЧЧ:ММ)" value={item.time} validate={s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s)} onCommit={time=>update({...b,items:b.items.map((x,j)=>i===j?{...x,time}:x)})}/><LocalizedFields label="Событие" value={item.label} onChange={label=>update({...b,items:b.items.map((x,j)=>i===j?{...x,label}:x)})}/><button className="v2-inspector-button" onClick={()=>update({...b,items:b.items.filter((_,j)=>i!==j)})}>Удалить событие</button></div>)}<button className="v2-inspector-button" disabled={b.items.length>=20} onClick={()=>update({...b,items:[...b.items,{time:"18:00",label:{ru:"Новое событие",ky:"Жаңы иш-чара"}}]})}>+ Событие</button></>}
 <label className="v2-widget-field">Шрифт<select value={node.appearance.fontFamily} onChange={e=>appearance({fontFamily:e.target.value as "sans"|"serif"})}><option value="sans">Arial</option><option value="serif">Georgia</option></select></label>
 <label className="v2-widget-field">Размер<input type="number" min={12} max={100} value={node.appearance.fontSize} onChange={e=>{const n=Number(e.target.value);if(n>=12&&n<=100)appearance({fontSize:n});}}/></label>
 <ColorPicker label="Текст" value={node.appearance.color} palette={projectPalette(document)} onChange={color=>appearance({color:color})}/>
 <ColorPicker label="Акцент" value={node.appearance.accent} palette={projectPalette(document)} onChange={color=>appearance({accent:color})}/>
 <ColorPicker label="Фон" value={node.appearance.background==="transparent"?"#FFFFFF":node.appearance.background} palette={projectPalette(document)} onChange={color=>appearance({background:color})}/>
 <button className="v2-inspector-button" onClick={()=>appearance({background:"transparent"})}>Прозрачный фон</button>
 </div>;
}
