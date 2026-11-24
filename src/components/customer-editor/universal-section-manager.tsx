"use client";

import {useState} from "react";
import {ArrowLeft,ArrowDown,ArrowUp,Copy,Eye,EyeOff,GripVertical,Layers,MoreVertical,Plus,Trash2,X} from "lucide-react";
import type {Locale} from "@/i18n/locales";

export type EditorSection={
 id:string;name:string;thumbnail?:string;visible:boolean;canToggle:boolean;canMoveUp:boolean;canMoveDown:boolean;
 canRename?:boolean;canDuplicate?:boolean;canRemove?:boolean;
};
type Props={locale:Locale;sections:readonly EditorSection[];activeId?:string;onClose:()=>void;
 onOpen:(id:string)=>void;onToggle:(id:string)=>void;onMove:(id:string,direction:-1|1)=>void;
 onRename?:(id:string,name:string)=>void;onDuplicate?:(id:string)=>void;onRemove?:(id:string)=>void;onAdd?:()=>void;
};
/** Shared section list and contextual properties sheet. Actions are capability-driven. */
export function UniversalSectionManager(p:Props){
 const ru=p.locale==="ru",t=(a:string,b:string)=>ru?a:b;
 const [selected,setSelected]=useState<string|null>(null);
 const [draftName,setDraftName]=useState("");
 const section=p.sections.find(item=>item.id===selected);
 function edit(item:EditorSection){setSelected(item.id);setDraftName(item.name);}
 function close(){if(section){setSelected(null);return;}p.onClose();}
 return <section className="ce-mobile-sections-screen ue-section-manager" aria-label={t("Секции","Бөлүмдөр")}>
  <header><button type="button" aria-label={t("Назад","Артка")} onClick={close}><ArrowLeft size={21}/></button><h2>{t("Секции","Бөлүмдөр")}</h2><button type="button" disabled={!p.onAdd} aria-label={t("Добавить секцию","Бөлүм кошуу")} onClick={p.onAdd}><Plus size={21}/></button></header>
  <div className="ce-mobile-sections-list">
   {p.sections.map((item,index)=><div key={item.id} className={"ce-mobile-section-card"+((selected??p.activeId)===item.id?" active":"")+(!item.visible?" is-hidden":"")}>
    <span className="ue-section-grip" aria-hidden="true"><GripVertical size={16}/></span>
    <button className="ce-mobile-section-select" type="button" onClick={()=>item.visible?p.onOpen(item.id):edit(item)}>
     <span className="ce-mobile-section-thumbnail">{item.thumbnail?<img src={item.thumbnail} alt="" loading="lazy"/>:<Layers size={20}/>}</span>
     <span className="ce-mobile-section-title"><small>{String(index+1).padStart(2,"0")}</small>{item.name}</span>
    </button>
    <button className="ce-mobile-section-eye" type="button" disabled={!item.canToggle} aria-label={(item.visible?t("Скрыть","Жашыруу"):t("Показать","Көрсөтүү"))+": "+item.name} onClick={()=>p.onToggle(item.id)}>{item.visible?<Eye size={18}/>:<EyeOff size={18}/>}</button>
    <button className="ce-mobile-section-eye" type="button" aria-label={t("Настройки секции","Бөлүм жөндөөлөрү")+": "+item.name} onClick={()=>edit(item)}><MoreVertical size={19}/></button>
   </div>)}
  </div>
  {section&&<div className="ue-section-properties">
    <div className="ue-section-property-heading"><span className="ce-mobile-grabber" aria-hidden="true"/><h3>{t("Секция: ","Бөлүм: ")}{section.name}</h3><button type="button" aria-label={t("Закрыть","Жабуу")} onClick={()=>setSelected(null)}><X size={19}/></button></div>
    <div className="ue-section-property-body">
     <label className="ue-section-toggle"><span>{t("Показывать секцию","Бөлүмдү көрсөтүү")}</span><input type="checkbox" role="switch" checked={section.visible} disabled={!section.canToggle} onChange={()=>p.onToggle(section.id)}/></label>
     <label className="ue-section-name-input"><span>{t("Название (для навигации)","Аталышы (багыттоо үчүн)")}</span><input value={draftName} maxLength={80} disabled={!section.canRename||!p.onRename} onChange={e=>setDraftName(e.target.value)} onBlur={()=>{const value=draftName.trim();if(section.canRename&&value&&value!==section.name)p.onRename?.(section.id,value);else if(!value)setDraftName(section.name);}}/></label>
     <div className="ue-section-move"><button type="button" disabled={!section.canMoveUp} onClick={()=>p.onMove(section.id,-1)}><ArrowUp size={17}/>{t("Выше","Жогору")}</button><button type="button" disabled={!section.canMoveDown} onClick={()=>p.onMove(section.id,1)}><ArrowDown size={17}/>{t("Ниже","Төмөн")}</button></div>
     <button type="button" className="ue-section-action" disabled={!section.canDuplicate||!p.onDuplicate} onClick={()=>p.onDuplicate?.(section.id)}><Copy size={18}/>{t("Дублировать","Көчүрүү")}</button>
     <button type="button" className="ue-section-action danger" disabled={!section.canRemove||!p.onRemove} onClick={()=>{if(window.confirm(t("Удалить эту секцию?","Бул бөлүмдү өчүрөсүзбү?"))){p.onRemove?.(section.id);setSelected(null);}}}><Trash2 size={18}/>{t("Удалить","Өчүрүү")}</button>
     {(!section.canDuplicate||!section.canRemove)&&<small className="ue-section-hint">{t("Недоступные действия ограничены возможностями этого шаблона.","Жеткиликсиз аракеттер шаблондун мүмкүнчүлүктөрү менен чектелет.")}</small>}
    </div>
  </div>}
 </section>;
}
