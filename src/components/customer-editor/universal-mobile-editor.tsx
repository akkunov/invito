"use client";

import Link from "next/link";
import {ArrowLeft,ArrowRight,ChevronDown,Cloud,CloudOff,Image as ImageIcon,Layers,Music2,Palette,RotateCcw,RotateCw,Type} from "lucide-react";
import type {MouseEventHandler,ReactNode,Ref} from "react";
import type {Locale} from "@/i18n/locales";
import "./customer-mobile-editor.css";

export type MobileEditorTool="text"|"photo"|"style"|"sections"|"music";
export type MobileSaveState="saved"|"pending"|"error";
type Props={
 locale:Locale;backHref:string;sheetOpen:boolean;activeTool:MobileEditorTool|null;
 pageIndex:number;pageCount:number;pageName:string;
 onNavigate:(delta:-1|1)=>void;onTool:(tool:MobileEditorTool,trigger:HTMLButtonElement)=>void;
 canUndo:boolean;canRedo:boolean;onUndo:()=>void;onRedo:()=>void;
 saveState:MobileSaveState;saveLabel:string;onSave?:()=>void;
 onPublish?:(trigger:HTMLButtonElement)=>void;publishDisabledReason?:string;
 canvas:ReactNode;canvasRef?:Ref<HTMLDivElement>;onCanvasClick?:MouseEventHandler<HTMLDivElement>;
 settings?:ReactNode;desktopHeader?:ReactNode;desktopPreviewHeader?:ReactNode;
 overlay?:ReactNode;className?:string;previewClassName?:string;onClose?:()=>void;
};
const tools=[
 {id:"text",Icon:Type,ru:"Текст",ky:"Текст"},
 {id:"photo",Icon:ImageIcon,ru:"Фото",ky:"Сүрөт"},
 {id:"style",Icon:Palette,ru:"Стиль",ky:"Стиль"},
 {id:"sections",Icon:Layers,ru:"Секции",ky:"Бөлүмдөр"},
 {id:"music",Icon:Music2,ru:"Музыка",ky:"Музыка"},
] as const;

/** One customer-facing phone workspace. Document adapters own commands and permissions;
 * this component owns all mobile chrome, navigation and responsive layout. */
export function UniversalMobileEditor(p:Props){
 const ru=p.locale==="ru",t=(ruText:string,kyText:string)=>ru?ruText:kyText;
 const SaveIcon=p.saveState==="error"?CloudOff:Cloud;
 return <main className={["ce-shell","ue-mobile",p.className,p.sheetOpen?"ce-mobile-sheet-open":""].filter(Boolean).join(" ")} lang={p.locale}>
   <header className="ce-mobile-topbar">
     <Link className="ue-brand" href={p.backHref} aria-label={t("К шаблонам","Шаблондорго")}>Eventiq</Link>
     <div className="ce-mobile-top-actions">
       <button type="button" onClick={p.onUndo} disabled={!p.canUndo} aria-label={t("Отменить","Артка кайтаруу")}><RotateCcw size={19}/></button>
       <button type="button" onClick={p.onRedo} disabled={!p.canRedo} aria-label={t("Повторить","Кайталоо")}><RotateCw size={19}/></button>
       {p.onSave?<button type="button" className="ue-save-icon" data-state={p.saveState} onClick={p.onSave} aria-label={p.saveLabel} title={p.saveLabel}><SaveIcon size={20}/></button>:
         <span className="ue-save-icon" data-state={p.saveState} role="status" aria-label={p.saveLabel} title={p.saveLabel}><SaveIcon size={20}/></span>}
       <button type="button" className="ce-mobile-publish-top" disabled={!p.onPublish} title={p.publishDisabledReason} onClick={e=>p.onPublish?.(e.currentTarget)}>{t("Опубликовать","Жарыялоо")}</button>
     </div>
   </header>
   {p.desktopHeader}
   <div className="ce-layout">
     {p.settings}
     <aside className={p.previewClassName??"ce-preview"} aria-label={t("Предпросмотр","Алдын ала көрүү")}>
       {p.desktopPreviewHeader}
       <div className="ce-preview-screen" ref={p.canvasRef} onClickCapture={p.onCanvasClick}>{p.canvas}</div>
       <nav className="ce-mobile-page-nav" aria-label={t("Страницы","Барактар")}>
         <button type="button" disabled={p.pageIndex<=0} onClick={()=>p.onNavigate(-1)} aria-label={t("Предыдущая секция","Мурунку бөлүм")}><ArrowLeft size={19}/></button>
         <button type="button" onClick={e=>p.onTool("sections",e.currentTarget)}><span>{p.pageCount?p.pageIndex+1:0} / {p.pageCount}</span><strong>{p.pageName}</strong><ChevronDown size={16}/></button>
         <button type="button" disabled={p.pageIndex>=p.pageCount-1} onClick={()=>p.onNavigate(1)} aria-label={t("Следующая секция","Кийинки бөлүм")}><ArrowRight size={19}/></button>
       </nav>
       <nav className="ce-mobile-dock" aria-label={t("Инструменты","Куралдар")}>
         {tools.map(({id,Icon,...label})=><button key={id} type="button" aria-pressed={p.activeTool===id} onClick={e=>p.onTool(id,e.currentTarget)}><span className="ue-tool-icon"><Icon size={22} strokeWidth={1.8}/></span><span>{label[p.locale]}</span></button>)}
       </nav>
     </aside>
   </div>
   {p.sheetOpen&&p.onClose&&<button className="ce-mobile-backdrop" type="button" onClick={p.onClose} aria-label={t("Закрыть настройки","Жөндөөлөрдү жабуу")}/>}
   {p.overlay}
 </main>;
}
