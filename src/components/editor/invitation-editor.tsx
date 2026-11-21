"use client";

import {useRef,useState} from "react";
import {ArrowRight,RotateCcw} from "lucide-react";
import {EditorToolbar} from "@/components/editor/editor-toolbar";
import {EditorSidebar} from "@/components/editor/editor-sidebar";
import {EditorInspector} from "@/components/editor/editor-inspector";
import {InvitationCanvas} from "@/components/invitation/invitation-canvas";
import type {BlockKind,InvitationDocument} from "@/features/invitations/invitation.schema";
import {useInvitationEditor} from "@/features/invitations/use-invitation-editor";
import {useEditorSectionSync} from "@/features/invitations/use-editor-section-sync";
import {getDictionary} from "@/i18n/dictionaries";
import type {Locale} from "@/i18n/locales";

/** Public, saved customer editor; distinct from the Studio authoring workspace.
 * Both languages and all legacy content, media and history commands are preserved. */
export function InvitationEditor({locale,initialDocument}:{locale:Locale;initialDocument:InvitationDocument}){
 const editor=useInvitationEditor(initialDocument);
 const [selected,setSelected]=useState<BlockKind>("cover");
 const [mobileView,setMobileView]=useState<"edit"|"preview">("edit");
 const previewRef=useRef<HTMLDivElement>(null);
 const {scrollToBlock}=useEditorSectionSync({previewRef,blocks:editor.document.blocks,onActiveChange:setSelected});
 const dict=getDictionary(locale);
 const t=(ru:string,ky:string)=>locale==="ky"?ky:ru;
 function selectBlock(kind:BlockKind){setSelected(kind);scrollToBlock(kind);}
 function openPreview(){setMobileView("preview");window.requestAnimationFrame(()=>scrollToBlock(selected));}
 function reset(){
  if(window.confirm(t("Сбросить все локальные изменения этого приглашения?","Чакыруунун бардык жергиликтүү өзгөртүүлөрүн тазалайсызбы?")))editor.reset();
 }
 return <div className="editor-app editor-app-modern">
  <EditorToolbar locale={locale} editor={editor}/>
  <div className="editor-view-switch" role="group" aria-label={t("Режим редактора","Редактор режими")}>
   <button type="button" aria-pressed={mobileView==="edit"} onClick={()=>setMobileView("edit")}>{t("Редактирование","Өзгөртүү")}</button>
   <button type="button" aria-pressed={mobileView==="preview"} onClick={openPreview}>{t("Предпросмотр","Алдын ала көрүү")}</button>
  </div>
  <div className="editor-workspace" data-view={mobileView}>
   <section className="editor-control-pane" aria-label={t("Настройка приглашения","Чакырууну жөндөө")}>
    <EditorSidebar locale={locale} editor={editor} selected={selected} onSelect={selectBlock}/>
    <div className="editor-inspector-wrapper is-open"><EditorInspector locale={locale} editor={editor} selected={selected}/></div>
    <button type="button" className="editor-open-preview" onClick={openPreview}>{t("Посмотреть изменения","Өзгөртүүлөрдү көрүү")}<ArrowRight size={17}/></button>
   </section>
   <main className="editor-stage" aria-label={t("Живой предпросмотр","Жандуу алдын ала көрүү")}>
    <div className="editor-stage-header"><div><small>eventiq / LIVE</small><strong>{t("Ваше приглашение","Сиздин чакырууңуз")}</strong></div><span className="editor-stage-badge">{dict.editor.draft}</span></div>
    <div className="editor-preview-space"><div className="editor-phone" ref={previewRef} tabIndex={0} role="region" aria-label={t("Прокручиваемый предпросмотр приглашения","Чакыруу алдын ала көрүү аймагы")}>
     <InvitationCanvas document={editor.document} musicSrc={editor.audioUrl} musicName={editor.audioName??undefined}/>
    </div></div>
    <div className="editor-stage-footer"><span>{dict.editor.autosave}</span><button type="button" onClick={reset}><RotateCcw size={14}/>{dict.editor.reset}</button></div>
   </main>
  </div>
 </div>;
}
