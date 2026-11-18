"use client";
import {useMemo,useState} from "react";
import {editableCandidates,fieldTarget,personalizationIssues} from "@/features/studio-v2/core/personalization";
import {personalizationSchema,type EditableField,type PersonalizationContract} from "@/features/studio-v2/core/personalization.schema";
import {templateDocument,templatePersonalization,savePersonalization,type TemplateRecord} from "@/features/studio-v2/core/template-registry";
const sections:Record<EditableField["section"],string>={main:"Основное",date:"Дата и время",photos:"Фотографии",location:"Место проведения",schedule:"Программа",music:"Музыка",rsvp:"RSVP",appearance:"Оформление"};
export function PersonalizationConfig({record,onSave,disabled}:{record:TemplateRecord;onSave:(record:TemplateRecord)=>Promise<void>;disabled:boolean}){
 const doc=templateDocument(record),candidates=useMemo(()=>editableCandidates(doc),[doc]);
 const [draft,setDraft]=useState<PersonalizationContract>(()=>templatePersonalization(record));
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState(false);
 const selected=new Map(draft.fields.map(f=>[fieldTarget(f),f]));
 const toggle=(candidate:EditableField,enabled:boolean)=>{
  setSaved(false);setDraft(prev=>({...prev,fields:enabled?[...prev.fields,{...candidate,id:"field-"+crypto.randomUUID()}]:prev.fields.filter(f=>fieldTarget(f)!==fieldTarget(candidate))}));
 };
 function change(id:string,patch:Partial<EditableField>){setSaved(false);setDraft(prev=>({...prev,fields:prev.fields.map(f=>f.id===id?{...f,...patch} as EditableField:f)}));}
 function locale(l:"ru"|"ky",enabled:boolean){setSaved(false);setDraft(prev=>({...prev,locales:enabled?[...new Set([...prev.locales,l])]:prev.locales.filter(x=>x!==l)}));}
 const issues=personalizationIssues(doc,draft);
 async function save(){
  setBusy(true);setError("");setSaved(false);
  try{const valid=personalizationSchema.parse(draft);if(!valid.locales.includes(doc.locale))throw Error("Сохраните язык исходного шаблона в списке разрешённых.");await onSave(savePersonalization(record,valid,new Date().toISOString()));setSaved(true);}catch(e){setError(e instanceof Error?e.message:"Не удалось сохранить поля.");}finally{setBusy(false);}
 }
 return <details className="v2-personalization-config"><summary>Поля клиента · {draft.fields.length}</summary>
 <p className="v2-placeholder">Разрешите только нужные поля. Размеры, шрифты, расположение и эффекты клиента не меняются. Сохранение создаёт новую версию шаблона.</p>
 <fieldset disabled={disabled||busy||record.versions.length>=50} className="v2-appearance-fieldset">
 <h3>Языки приглашения</h3>
 {(["ru","ky"] as const).map(l=><label key={l} className="v2-layout-field">{l==="ru"?"Русский":"Кыргызский"}<input type="checkbox" checked={draft.locales.includes(l)} disabled={l===doc.locale} onChange={e=>locale(l,e.target.checked)}/></label>)}
 <h3>Доступные поля</h3>
 {!candidates.length&&<p className="v2-placeholder">Добавьте в Studio связанные переменные, изображения или блоки приглашения.</p>}
 {candidates.map(candidate=>{const f=selected.get(fieldTarget(candidate));return <div className="v2-client-field" key={fieldTarget(candidate)}><label className="v2-layout-field">{candidate.label.ru}<input aria-label={"Разрешить "+candidate.label.ru} type="checkbox" checked={!!f} onChange={e=>toggle(candidate,e.target.checked)}/></label>
 {f&&<div className="v2-client-field-options">
 <div className="v2-type-grid"><label className="v2-widget-field">Название RU<input value={f.label.ru} maxLength={100} onChange={e=>change(f.id,{label:{...f.label,ru:e.target.value}})}/></label><label className="v2-widget-field">Название KY<input value={f.label.ky} maxLength={100} onChange={e=>change(f.id,{label:{...f.label,ky:e.target.value}})}/></label></div>
 <label className="v2-widget-field">Раздел<select value={f.section} onChange={e=>change(f.id,{section:e.target.value as EditableField["section"]})}>{Object.entries(sections).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
 <label className="v2-layout-field">Обязательное поле<input type="checkbox" checked={f.required} onChange={e=>change(f.id,{required:e.target.checked})}/></label>
 {f.kind==="text"&&<><label className="v2-widget-field">Максимум символов<input type="number" min={1} max={500} value={f.maxLength} onChange={e=>change(f.id,{maxLength:Number(e.target.value)})}/></label><label className="v2-layout-field">Многострочный текст<input type="checkbox" checked={f.multiline} onChange={e=>change(f.id,{multiline:e.target.checked})}/></label></>}
 {f.kind==="number"&&<div className="v2-type-grid"><label className="v2-widget-field">Минимум<input type="number" value={f.min} onChange={e=>change(f.id,{min:Number(e.target.value)})}/></label><label className="v2-widget-field">Максимум<input type="number" value={f.max} onChange={e=>change(f.id,{max:Number(e.target.value)})}/></label></div>}
 {f.kind==="image"&&<div className="v2-type-grid"><label className="v2-widget-field">Мин. ширина px<input type="number" min={1} max={4096} value={f.minWidth} onChange={e=>change(f.id,{minWidth:Number(e.target.value)})}/></label><label className="v2-widget-field">Мин. высота px<input type="number" min={1} max={4096} value={f.minHeight} onChange={e=>change(f.id,{minHeight:Number(e.target.value)})}/></label></div>}
 {f.kind==="gallery"&&<label className="v2-widget-field">Максимум фото<input type="number" min={1} max={4} value={f.maxPhotos} onChange={e=>change(f.id,{maxPhotos:Number(e.target.value)})}/></label>}
 {f.kind==="schedule"&&<label className="v2-widget-field">Максимум событий<input type="number" min={1} max={20} value={f.maxItems} onChange={e=>change(f.id,{maxItems:Number(e.target.value)})}/></label>}
 {f.kind==="rsvp"&&<label className="v2-widget-field">Максимум гостей<input type="number" min={1} max={10} value={f.maxGuests} onChange={e=>change(f.id,{maxGuests:Number(e.target.value)})}/></label>}
 {f.kind==="music"&&<label className="v2-widget-field">Разрешённые композиции (по одной ссылке на строку)<textarea defaultValue={f.sources.join("\n")} rows={4} onBlur={e=>change(f.id,{sources:[...new Set(e.target.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean))]})}/></label>}
 {f.kind==="theme"&&<>{Object.values(doc.themes??{}).map(t=><label className="v2-layout-field" key={t.id}>{t.name}<input type="checkbox" checked={f.themeIds.includes(t.id)} onChange={e=>change(f.id,{themeIds:e.target.checked?[...f.themeIds,t.id]:f.themeIds.filter(id=>id!==t.id)})}/></label>)}<label className="v2-layout-field">Базовая тема<input type="checkbox" checked={f.allowBase} onChange={e=>change(f.id,{allowBase:e.target.checked})}/></label></>}
 </div>}</div>;})}
 {issues.length>0&&<p className="v2-placeholder">Проверьте стартовые значения: {issues.length} замечаний. Обязательные поля будут проверяться перед публикацией клиентского проекта.</p>}
 <button className="v2-inspector-button" onClick={()=>void save()}>Сохранить поля клиента</button>
 </fieldset>{error&&<p role="alert" className="v2-inspector-error">{error}</p>}{saved&&<p role="status">Поля сохранены.</p>}</details>;
}
