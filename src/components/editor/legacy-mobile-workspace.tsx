"use client";

import {useEffect,useRef,useState,type MouseEvent} from "react";
import {Eye,EyeOff,Layers3,X,ChevronUp,ChevronDown} from "lucide-react";
import type {BlockKind} from "@/features/invitations/invitation.schema";
import type {InvitationEditorController} from "@/features/invitations/use-invitation-editor";
import type {Locale} from "@/i18n/locales";
import {getDictionary} from "@/i18n/dictionaries";
import {InvitationCanvas} from "@/components/invitation/invitation-canvas";
import {EditorInspector} from "@/components/editor/editor-inspector";
import {UniversalMobileEditor} from "@/components/customer-editor/universal-mobile-editor";
import "./legacy-mobile-workspace.css";

type Panel="text"|"photo"|"style"|"sections"|"music"|null;
type Props={locale:Locale;editor:InvitationEditorController;selected:BlockKind;onSelect:(block:BlockKind)=>void};

export function LegacyMobileWorkspace({locale,editor,selected,onSelect}:Props){
  const dict=getDictionary(locale);
  const ru=locale==="ru";
  const [panel,setPanel]=useState<Panel>(null);
  const preview=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement|null>(null);
  const blocks=editor.document.blocks.filter(block=>block.enabled);
  const current=Math.max(0,blocks.findIndex(block=>block.id===selected));
  const name=(id:BlockKind)=>dict.editor.blocks[id];
  const navigate=(id:BlockKind)=>{
    onSelect(id);setPanel(null);
    window.requestAnimationFrame(()=>{
      const node=Array.from(preview.current?.querySelectorAll<HTMLElement>("[data-editor-block]")??[])
        .find(item=>item.dataset.editorBlock===id);
      if(node)node.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
    });
  };
  const open=(next:Exclude<Panel,null>,element?:HTMLButtonElement)=>{
    trigger.current=element??null;
    if(next==="photo"&&!["cover","gallery","location"].includes(selected))onSelect("cover");
    if(next==="music")onSelect("music");
    if(next==="text"&&["music","gallery"].includes(selected))onSelect("cover");
    setPanel(next);
  };
  const close=()=>{setPanel(null);window.requestAnimationFrame(()=>trigger.current?.focus());};
  useEffect(()=>{
    if(!panel)return;
    const key=(e:KeyboardEvent)=>{if(e.key==="Escape"){setPanel(null);trigger.current?.focus();}};
    window.addEventListener("keydown",key);
    return()=>window.removeEventListener("keydown",key);
  },[panel]);
  function selectByTap(event:MouseEvent<HTMLDivElement>){
    const target=event.target;
    if(!(target instanceof Element)||target.closest("a,button,input,textarea,select"))return;
    const el=target.closest<HTMLElement>("[data-editor-block]");
    const kind=el?.dataset.editorBlock as BlockKind|undefined;
    if(!kind||!editor.document.blocks.some(item=>item.id===kind))return;
    onSelect(kind);
    setPanel(target.closest("img,picture")||kind==="gallery"?"photo":"text");
  }
  const iconLabel=ru?{text:"Текст",photo:"Фото",style:"Стиль",sections:"Секции",music:"Музыка"}:{text:"Текст",photo:"Сүрөт",style:"Стиль",sections:"Бөлүмдөр",music:"Музыка"};
  const panelTitle=panel?iconLabel[panel]:"";
  const isText=panel==="text",isPhoto=panel==="photo";
  return <UniversalMobileEditor
    locale={locale} backHref={`/${locale}/templates`}
    className="ue-legacy" sheetOpen={panel!==null} activeTool={panel??"text"}
    pageIndex={current} pageCount={blocks.length} pageName={name(blocks[current]?.id??"cover")}
    onNavigate={delta=>{const block=blocks[current+delta];if(block)navigate(block.id);}}
    onTool={open} onClose={close}
    canUndo={editor.canUndo} canRedo={editor.canRedo} onUndo={editor.undo} onRedo={editor.redo}
    saveState={editor.saveError?"error":editor.isSaved?"saved":"pending"}
    saveLabel={editor.saveError?(ru?"Не удалось сохранить":"Сактоо мүмкүн болгон жок"):editor.isSaved?(ru?"Сохранено на устройстве":"Түзмөктө сакталды"):(ru?"Сохранение…":"Сакталууда…")}
    onSave={editor.saveNow}
    publishDisabledReason={ru?"Этот шаблон пока хранится только на устройстве. Для публикации выберите серверный шаблон.":"Бул шаблон азырынча түзмөктө гана сакталат."}
    canvas={<InvitationCanvas document={editor.document} musicSrc={editor.audioUrl} musicName={editor.audioName??undefined}/>}
    canvasRef={preview} onCanvasClick={selectByTap}
    settings={panel&&<section className="ce-controls" aria-label={panelTitle}>
      <div className="ce-mobile-sheet-handle"><span className="ce-mobile-grabber" aria-hidden="true"/><strong>{panelTitle}</strong><button type="button" onClick={close} aria-label={ru?"Закрыть":"Жабуу"}><X size={20}/></button></div>
      <div className="ce-form lm3-sheet-body">{panel==="sections"?<div className="lm3-sections">
          {editor.document.blocks.map((block,index)=><div className={"lm3-section-row"+(selected===block.id?" active":"")} key={block.id}>
            <button type="button" className="lm3-section-select" onClick={()=>navigate(block.id)} aria-current={selected===block.id?"true":undefined}>
              <span className="lm3-section-icon"><Layers3 size={18}/></span>
              <span className="lm3-section-name"><small>{String(index+1).padStart(2,"0")}</small>{name(block.id)}</span>
            </button>
            <button type="button" className="lm3-section-icon-button" onClick={()=>editor.toggleBlock(block.id)} aria-label={(block.enabled?(ru?"Скрыть ":"Жашыруу "):(ru?"Показать ":"Көрсөтүү "))+name(block.id)} aria-pressed={block.enabled}>{block.enabled?<Eye size={19}/>:<EyeOff size={19}/>}</button>
            <div className="lm3-reorder">
              <button type="button" disabled={index===0} onClick={()=>editor.moveBlock(block.id,-1)} aria-label={(ru?"Выше: ":"Жогору: ")+name(block.id)}><ChevronUp size={16}/></button>
              <button type="button" disabled={index===editor.document.blocks.length-1} onClick={()=>editor.moveBlock(block.id,1)} aria-label={(ru?"Ниже: ":"Төмөн: ")+name(block.id)}><ChevronDown size={16}/></button>
            </div>
          </div>)}
          <p className="lm3-hint">{ru?"Порядок и видимость секций сохраняются в вашем черновике.":"Бөлүмдөрдүн ирети жана көрүнүшү черновикте сакталат."}</p>
        </div>:panel==="style"?<div className="lm3-style">
          <h3>{ru?"Цвет оформления":"Жасалган түс"}</h3>
          <div className="lm3-palette">{["#556A40","#B69A70","#D6A09B","#30302D","#FF4A0A"].map(color=>
            <button type="button" key={color} style={{backgroundColor:color}} aria-label={color} aria-pressed={editor.document.accent.toLowerCase()===color.toLowerCase()} onClick={()=>editor.updateAccent(color)}/>)}
          </div>
          <label>{ru?"Свой цвет":"Өз түсүңүз"} <input type="color" value={editor.document.accent} onChange={event=>editor.updateAccent(event.target.value)}/></label>
          <p className="lm3-hint">{ru?"Шрифты и композиция сохраняют стиль выбранного автором приглашения.":"Ариптер жана жайгашуу автордун жасалгасында калат."}</p>
        </div>:<>
          {(isPhoto||isText)&&<div className="lm3-quick-sections">
            {(isPhoto?["cover","location","gallery"] as BlockKind[]:["cover","message","details","location","program"] as BlockKind[]).map(kind=>
              <button type="button" className={selected===kind?"selected":""} key={kind} onClick={()=>onSelect(kind)}>{name(kind)}</button>)}
          </div>}
          <EditorInspector locale={locale} editor={editor} selected={panel==="music"?"music":selected}/>
        </>}</div>
    </section>}
  />;
}
