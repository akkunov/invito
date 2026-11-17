"use client";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline, Strikethrough, Copy, Minus, Plus, Trash2, Type } from "lucide-react";
import type { StudioElement } from "@/features/studio/studio.schema";
const swatches=["#20242B","#2549D9","#FFFFFF","#000000","#687A64","#A9755F","#C79C50","#D25269"];
export function StudioTextToolbar({element,onChange,onEdit,onDuplicate,onDelete}:{
 element:StudioElement;onChange:(patch:Partial<StudioElement>)=>void;onEdit:()=>void;onDuplicate:()=>void;onDelete:()=>void;
}){
 const isText=element.type==="text"||element.type==="button";
 const size=(n:number)=>Math.max(8,Math.min(120,element.fontSize+n));
 return <div className="studio-context-toolbar" role="toolbar" aria-label="Быстрое редактирование элемента">
  <div className="studio-context-name"><Type size={15}/><span>{isText?"Текст":"Элемент"}</span></div>
  {isText&&<>
   <button type="button" className="studio-context-edit" onClick={onEdit}>Редактировать текст</button>
   <label className="studio-context-select"><span className="sr-only">Шрифт</span><select aria-label="Шрифт" value={element.fontFamily} onChange={e=>onChange({fontFamily:e.target.value as StudioElement["fontFamily"]})}><option value="sans">Sans</option><option value="serif">Serif</option></select></label>
   <div className="studio-context-size"><button aria-label="Уменьшить шрифт" onClick={()=>onChange({fontSize:size(-2)})}><Minus size={16}/></button><input aria-label="Размер шрифта" type="number" min="8" max="120" value={element.fontSize} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n)&&n>=8&&n<=120)onChange({fontSize:n})}}/><button aria-label="Увеличить шрифт" onClick={()=>onChange({fontSize:size(2)})}><Plus size={16}/></button></div>
   <button className={element.fontWeight==="700"?"is-on":""} onClick={()=>onChange({fontWeight:element.fontWeight==="700"?"400":"700"})} aria-label="Полужирный" aria-pressed={element.fontWeight==="700"}><Bold size={17}/></button>
   <button className={element.italic?"is-on":""} onClick={()=>onChange({italic:!element.italic})} aria-label="Курсив" aria-pressed={element.italic}><Italic size={17}/></button>
   <button className={element.underline?"is-on":""} onClick={()=>onChange({underline:!element.underline})} aria-label="Подчёркнутый" aria-pressed={element.underline}><Underline size={17}/></button>
   <button className={element.strike?"is-on":""} onClick={()=>onChange({strike:!element.strike})} aria-label="Зачёркнутый" aria-pressed={element.strike}><Strikethrough size={17}/></button>
   <label className="studio-context-spacing" title="Межбуквенное расстояние">Aa <input aria-label="Межбуквенное расстояние" type="number" min="-4" max="20" step=".5" value={element.letterSpacing} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n)&&n>=-4&&n<=20)onChange({letterSpacing:n})}}/></label>
   <div className="studio-context-align" aria-label="Выравнивание">{([{v:"left",icon:AlignLeft,label:"Слева"},{v:"center",icon:AlignCenter,label:"По центру"},{v:"right",icon:AlignRight,label:"Справа"}] as const).map(item=><button key={item.v} aria-label={item.label} aria-pressed={element.textAlign===item.v} onClick={()=>onChange({textAlign:item.v})}><item.icon size={16}/></button>)}</div>
   <label className="studio-context-color"><span>Цвет</span><input aria-label="Выбрать цвет текста" type="color" value={element.color} onChange={e=>onChange({color:e.target.value})}/></label>
   <div className="studio-context-swatches" aria-label="Быстрые цвета">{swatches.map(c=><button key={c} title={c} aria-label={`Цвет ${c}`} onClick={()=>onChange({color:c})} style={{background:c}} aria-pressed={element.color.toLowerCase()===c.toLowerCase()}/>)}</div>
  </>}
  <div className="studio-context-actions"><button title="Копировать" aria-label="Дублировать элемент" onClick={onDuplicate}><Copy size={16}/></button><button title="Удалить" aria-label="Удалить элемент" onClick={onDelete}><Trash2 size={16}/></button></div>
 </div>;
}
