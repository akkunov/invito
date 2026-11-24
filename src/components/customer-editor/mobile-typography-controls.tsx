"use client";

import {useState} from "react";
import {AlignLeft,AlignCenter,AlignRight,Bold,Italic,Underline,Minus,Plus} from "lucide-react";
import type {EditableField,PersonalizedValue} from "@/features/studio-v2/core/personalization.schema";
import type {Locale} from "@/i18n/locales";
type Field=Extract<EditableField,{kind:"textStyle"}>;
type Value=Extract<PersonalizedValue,{kind:"textStyle"}>;

export function MobileTypographyControls({field,value,locale,onChange}:{field:Field;value:Value;locale:Locale;onChange:(next:Value)=>void}){
 const [tab,setTab]=useState<"font"|"style"|"color"|"spacing">("font");
 const ru=locale==="ru",t=(a:string,b:string)=>ru?a:b;
 const update=(patch:Partial<Value>)=>onChange({...value,...patch});
 const bold=field.allowedWeights.filter(weight=>weight>=600).sort((a,b)=>b-a)[0];
 const regular=field.allowedWeights.filter(weight=>weight<600).sort((a,b)=>a-b)[0];
 const stepper=(label:string,n:number,min:number,max:number,step:number,change:(v:number)=>void)=>
  <div className="ue-typo-stepper" aria-label={label}>
   <button type="button" disabled={n<=min} aria-label={label+" −"} onClick={()=>change(Math.max(min,Number((n-step).toFixed(2))))}><Minus size={18}/></button>
   <output>{n}</output>
   <button type="button" disabled={n>=max} aria-label={label+" +"} onClick={()=>change(Math.min(max,Number((n+step).toFixed(2))))}><Plus size={18}/></button>
  </div>;
 return <div className="ue-typography">
   <div className="ue-typo-tabs" role="group" aria-label={t("Настройки текста","Текст жөндөөлөрү")}>
    {([{id:"font",label:t("Шрифт","Арип")},{id:"style",label:t("Стиль","Стиль")},{id:"color",label:t("Цвет","Түс")},{id:"spacing",label:t("Отступы","Аралык")}] as const).map(item=>
     <button key={item.id} type="button" aria-pressed={tab===item.id} onClick={()=>setTab(item.id)}>{item.label}</button>)}
   </div>
   {tab==="font"&&<div className="ue-typo-font-row">
    <select aria-label={t("Шрифт","Арип")} value={value.fontFamily} onChange={e=>update({fontFamily:e.target.value as "serif"|"sans"})}>
     {field.allowedFonts.map(font=><option key={font} value={font}>{font==="serif"?"Serif":"Sans"}</option>)}
    </select>
    {stepper(t("Размер","Өлчөм"),value.fontSize,field.minFontSize,field.maxFontSize,1,n=>update({fontSize:n}))}
   </div>}
   {(tab==="font"||tab==="style")&&<>
    <div className="ue-typo-group" role="group" aria-label={t("Выравнивание","Тегиздөө")}>
     {([{id:"left",Icon:AlignLeft},{id:"center",Icon:AlignCenter},{id:"right",Icon:AlignRight}] as const).map(({id,Icon})=>
       <button type="button" key={id} aria-pressed={value.textAlign===id} aria-label={id==="left"?t("Слева","Сол"):id==="center"?t("По центру","Борбор"):t("Справа","Оң")} onClick={()=>update({textAlign:id})}><Icon size={22}/></button>)}
    </div>
    <div className="ue-typo-group ue-typo-emphasis" role="group" aria-label={t("Начертание","Жазылышы")}>
     <button type="button" disabled={!bold||!regular} aria-pressed={value.fontWeight>=600} aria-label={t("Жирный","Калың")} onClick={()=>{const weight=value.fontWeight>=600?regular:bold;if(weight)update({fontWeight:weight});}}><Bold size={20}/></button>
     <button type="button" disabled={!field.allowItalic} aria-pressed={!!value.italic} aria-label={t("Курсив","Курсив")} onClick={()=>update({italic:!value.italic})}><Italic size={20}/></button>
     <button type="button" disabled={!field.allowUnderline} aria-pressed={!!value.underline} aria-label={t("Подчёркивание","Асты сызылган")} onClick={()=>update({underline:!value.underline})}><Underline size={20}/></button>
    </div>
   </>}
   {tab==="color"&&<div className="se-text-style-colors">{field.allowedColors.map(color=>
    <button type="button" key={color} aria-label={color} aria-pressed={value.color.toLowerCase()===color.toLowerCase()} style={{backgroundColor:color}} onClick={()=>update({color})}/>)}</div>}
   {tab==="spacing"&&<div className="ue-typo-spacing">
    {field.lineHeightRange&&<label><span>{t("Межстрочный интервал","Сап аралыгы")}</span>{stepper(t("Интервал","Аралык"),value.lineHeight??1.2,field.lineHeightRange.min,field.lineHeightRange.max,.05,n=>update({lineHeight:n}))}</label>}
    {field.letterSpacingRange&&<label><span>{t("Межбуквенный интервал","Тамга аралыгы")}</span>{stepper(t("Расстояние","Аралык"),value.letterSpacing??0,field.letterSpacingRange.min,field.letterSpacingRange.max,.1,n=>update({letterSpacing:n}))}</label>}
    {!field.lineHeightRange&&!field.letterSpacingRange&&<small>{t("Интервалы зафиксированы автором шаблона.","Аралыктар автор тарабынан бекитилген.")}</small>}
   </div>}
 </div>;
}
