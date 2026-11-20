"use client";
import {StudioNumberInput} from "./studio-number-input";
import {useState} from "react";
import type {EditableField,PersonalizedValue} from "@/features/studio-v2/core/personalization.schema";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema";

type Locale="ru"|"ky";
type Props={field:EditableField;value:PersonalizedValue|undefined;document:ProjectDocumentV2;locale:Locale;locales:readonly Locale[];urls?:Readonly<Record<string,string>>;onChange:(value:PersonalizedValue)=>void};
const copy=(locale:Locale,ru:string,ky:string)=>locale==="ky"?ky:ru;
const localizedDate=(iso:string)=>{const ms=Date.parse(iso);return Number.isFinite(ms)?new Date(ms+6*3600000).toISOString().slice(0,16):"";};
const toInstant=(value:string)=>value?value+":00+06:00":null;
function DateInput({value,onChange,locale}:{value:string|null;onChange:(date:string|null)=>void;locale:Locale}){
 return <><input type="datetime-local" value={value?localizedDate(value):""} onChange={e=>onChange(toInstant(e.target.value))}/><small>{copy(locale,"Время Бишкека (UTC+6)","Бишкек убактысы (UTC+6)")}</small></>;
}
function NumberInput({value,min,max,onChange}:{value:number;min:number;max:number;onChange:(n:number)=>void}){
 return <StudioNumberInput min={min} max={max} value={value} onValueChange={value=>{if(value!==undefined)onChange(value);}}/>;
}
export function SimpleField({field:f,value:v,document:doc,locale,locales,urls={},onChange}:Props){
 const t=(ru:string,ky:string)=>copy(locale,ru,ky),title=f.label[locale];
 const binding=v?.kind==="binding"?v.value:undefined;
 const assets=Object.values(doc.assets);
 const langs=(label:string,ky:string)=>locales.length>1?(label==="ru"?t("Русский","Орусча"):t("Кыргызский","Кыргызча")):ky;
 const assetURL=(asset:ProjectDocumentV2["assets"][string])=>asset.storageKey.startsWith("/images/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+asset.storageKey:urls[asset.storageKey];
 const preview=(asset:ProjectDocumentV2["assets"][string])=><span className="se-media-thumb">{assetURL(asset)?<img loading="lazy" decoding="async" src={assetURL(asset)} alt=""/>:<span>{t("Нет превью","Сүрөт жок")}</span>}</span>;
 let control:React.ReactNode=null;
 switch(f.kind){
 case "text":{
  const value=binding?.type==="text"?binding.value:{ru:"",ky:""};
  control=locales.map(l=><label className="se-control" key={l}><span>{langs(l,title)}</span>{f.multiline?<textarea aria-label={title+" "+l} rows={3} maxLength={f.maxLength} value={value[l]} onChange={e=>onChange({kind:"binding",value:{type:"text",value:{...value,[l]:e.target.value}}})}/>:<input aria-label={title+" "+l} maxLength={f.maxLength} value={value[l]} onChange={e=>onChange({kind:"binding",value:{type:"text",value:{...value,[l]:e.target.value}}})}/>}<small className="se-count">{value[l].length}/{f.maxLength}</small></label>);break;
 }
 case "date":control=<label className="se-control"><span>{t("Дата и время","Күнү жана убактысы")}</span><DateInput locale={locale} value={binding?.type==="date"?binding.value:null} onChange={d=>{if(d)onChange({kind:"binding",value:{type:"date",value:d}});}}/></label>;break;
 case "number":control=<label className="se-control"><span>{title}</span><NumberInput min={f.min} max={f.max} value={binding?.type==="number"?binding.value:Math.max(f.min,Math.min(0,f.max))} onChange={n=>onChange({kind:"binding",value:{type:"number",value:n}})}/><small>{f.min} — {f.max}</small></label>;break;
 case "boolean":control=<label className="se-check"><input type="checkbox" checked={binding?.type==="boolean"?binding.value:false} onChange={e=>onChange({kind:"binding",value:{type:"boolean",value:e.target.checked}})}/>{title}</label>;break;
 case "image":{
  const selected=v?.kind==="image"?v.assetId:"";
  control=<><p className="se-media-hint">{t("Выберите фото — результат сразу появится в предпросмотре.","Сүрөттү тандаңыз — өзгөртүү дароо көрүнөт.")}</p><div className="se-media-grid" role="radiogroup" aria-label={title}>{assets.map(a=><label className="se-media-option" key={a.id} data-selected={selected===a.id}><input type="radio" name={f.id} aria-label={a.name} checked={selected===a.id} onChange={()=>onChange({kind:"image",assetId:a.id})}/>{preview(a)}<span className="se-media-name">{a.name}</span><span className="se-media-selected" aria-hidden="true">✓</span></label>)}</div><p className="se-media-hint">{t("Доступны фотографии, подготовленные автором шаблона.","Шаблондун автору тандаган сүрөттөр жеткиликтүү.")}</p></>;break;
 }
 case "gallery":{
  const ids=v?.kind==="gallery"?v.assetIds:[];
  control=<><p className="se-media-hint">{t("Выберите фотографии для галереи","Галерея үчүн сүрөттөрдү тандаңыз")} · {ids.length}/{f.maxPhotos}</p><div className="se-media-grid" role="group" aria-label={title}>{assets.map(a=><label className="se-media-option" key={a.id} data-selected={ids.includes(a.id)}><input type="checkbox" aria-label={a.name} checked={ids.includes(a.id)} disabled={!ids.includes(a.id)&&ids.length>=f.maxPhotos} onChange={e=>onChange({kind:"gallery",assetIds:e.target.checked?[...ids,a.id]:ids.filter(id=>id!==a.id)})}/>{preview(a)}<span className="se-media-name">{a.name}</span><span className="se-media-selected" aria-hidden="true">✓</span></label>)}</div></>;break;
 }
 case "music":control=<label className="se-control"><span>{t("Композиция","Музыка")}</span><select value={v?.kind==="music"?v.source:""} onChange={e=>onChange({kind:"music",source:e.target.value})}><option value="">{t("Без музыки","Музыкасыз")}</option>{f.sources.map((s,i)=><option value={s} key={s}>{t("Композиция","Музыка")} {i+1}</option>)}</select></label>;break;
 case "rsvp":{
  const deadline=v?.kind==="rsvp"?v.deadline:null,maxGuests=v?.kind==="rsvp"?v.maxGuests:1;
  control=<><label className="se-control"><span>{t("Подтвердить до","Ырастоо мөөнөтү")}</span><DateInput locale={locale} value={deadline} onChange={d=>onChange({kind:"rsvp",deadline:d,maxGuests})}/></label><label className="se-control"><span>{t("Количество гостей","Коноктордун саны")}</span><select value={maxGuests} onChange={e=>onChange({kind:"rsvp",deadline,maxGuests:Number(e.target.value)})}>{Array.from({length:f.maxGuests},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}</select></label></>;break;
 }
 case "schedule":{
  const items=v?.kind==="schedule"?v.items:[];
  const update=(i:number,item:typeof items[number])=>onChange({kind:"schedule",items:items.map((old,j)=>i===j?item:old)});
  control=<div className="se-options">{items.map((item,i)=><div className="se-event" key={i}><label className="se-control"><span>{t("Время","Убакыт")}</span><input type="time" value={item.time} onChange={e=>{if(e.target.value)update(i,{...item,time:e.target.value});}}/></label>{locales.map(l=><label className="se-control" key={l}><span>{langs(l,t("Событие","Окуя"))}</span><input maxLength={500} value={item.label[l]} onChange={e=>update(i,{...item,label:{...item.label,[l]:e.target.value}})}/></label>)}<button className="se-text-button" onClick={()=>onChange({kind:"schedule",items:items.filter((_,j)=>i!==j)})}>{t("Удалить событие","Окуяны өчүрүү")}</button></div>)}<button className="se-secondary" disabled={items.length>=f.maxItems} onClick={()=>onChange({kind:"schedule",items:[...items,{time:"17:00",label:{ru:"",ky:""}}]})}>{t("Добавить событие","Окуя кошуу")}</button></div>;break;
 }
 case "theme":control=<div className="se-theme-grid" role="radiogroup" aria-label={title}>{(f.allowBase?[null,...f.themeIds]:f.themeIds).map((id,i)=><label className="se-theme-option" data-selected={(v?.kind==="theme"?v.themeId:null)===id} key={id??"base"}><input type="radio" aria-label={id===null?t("Исходное оформление","Баштапкы жасалгалоо"):doc.themes?.[id]?.name??id} name={f.id} checked={(v?.kind==="theme"?v.themeId:null)===id} onChange={()=>onChange({kind:"theme",themeId:id})}/><span className="se-theme-sample" aria-hidden="true"><span className="se-theme-sample-heading"/><span className="se-theme-sample-sub"/><span className="se-theme-sample-line"/></span><strong>{id===null?t("Оригинал","Түп нуска"):doc.themes?.[id]?.name??t("Вариант ","Вариант ")+(i+1)}</strong><span className="se-media-selected" aria-hidden="true">✓</span></label>)}</div>;break;
 }
 return <div className="se-field" data-editor-field={f.id}><h3>{title}{f.required&&<span className="se-required"> *</span>}</h3>{control}</div>;
}
