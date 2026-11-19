"use client";
import {useEffect,useState} from "react";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema.ts";
import {StudioIcon} from "./studio-icon";
import {TemplateOutput} from "./studio-v2-template-output";

type Props={
 document:ProjectDocumentV2;
 selectedPageId:string;
 onDownloadJson:()=>void;
 onClose:()=>void;
};
export function StudioV2PrintDialog({document,selectedPageId,onDownloadJson,onClose}:Props){
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  function onKeyDown(event:KeyboardEvent){
   if(event.key!=="Escape")return;
   event.stopPropagation();
   if(!busy){event.preventDefault();onClose();}
  }
  window.addEventListener("keydown",onKeyDown,true);
  return()=>window.removeEventListener("keydown",onKeyDown,true);
 },[busy,onClose]);
 return <div className="v2-preview-overlay v2-studio-print-dialog" role="dialog" aria-modal="true" aria-label="Экспорт и печать">
  <header className="v2-preview-header">
   <div className="v2-studio-print-heading"><StudioIcon name="printer" size={20}/><strong>Экспорт и печать</strong><span>Текущий проект · {document.pages.length} стр.</span></div>
   <button type="button" className="v2-studio-print-close" disabled={busy} onClick={onClose} aria-label="Закрыть экспорт"><StudioIcon name="close"/> Закрыть</button>
  </header>
  <div className="v2-studio-print-scroll">
   <div className="v2-studio-print-layout">
    <div className="v2-studio-print-intro"><strong>Готовый файл для печати</strong><p>Выберите страницу и формат. Экспортируем текущий макет, создавать шаблон в библиотеке не нужно.</p></div>
    <TemplateOutput document={document} name={document.id} selectedPageId={selectedPageId} onBusy={setBusy}/>
    <section className="v2-studio-project-export">
     <strong>Исходный проект</strong>
     <p>Для резервной копии и переноса в Studio v2 используйте JSON. Это не файл для типографии.</p>
     <button className="v2-inspector-button" disabled={busy} onClick={onDownloadJson}><StudioIcon name="download" size={16}/> Скачать проект JSON</button>
    </section>
   </div>
  </div>
 </div>;
}
