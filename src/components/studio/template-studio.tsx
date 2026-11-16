"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Download, FileUp, ImagePlus, Plus, Redo2, RotateCcw, Save, Trash2, Type, Undo2, Square, MousePointer2, Smartphone, Monitor, Move } from "lucide-react";
import { StudioCanvas } from "@/components/studio/studio-canvas";
import { StudioTextToolbar } from "@/components/studio/studio-text-toolbar";
import { createElement, starterTemplate, studioTemplateSchema, type StudioElement, type StudioElementType, type StudioTemplate } from "@/features/studio/studio.schema";
import type { Locale } from "@/i18n/locales";

const STORAGE="invito:studio:templates:v1";
const DRAFT="invito:studio:draft:v1";
const galleryImages=["/images/riviera/couple.webp","/images/riviera/villa.webp","/images/riviera/flowers.webp","/images/riviera/fabric-left.webp"];
function id(){return "element-"+Math.random().toString(36).slice(2,9)}
function downloadJson(data:unknown,name:string){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=name;a.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function TemplateStudio({locale}:{locale:Locale}){
  const [template,setTemplate]=useState<StudioTemplate>(starterTemplate);
  const [selectedId,setSelectedId]=useState<string|null>("name-one");
  const [editingId,setEditingId]=useState<string|null>(null);
  const [viewport,setViewport]=useState<320|375|440>(375);
  const [saved,setSaved]=useState<string[]>([]);
  const [message,setMessage]=useState("");
  const [ready,setReady]=useState(false);
  const [undo,setUndo]=useState<StudioTemplate[]>([]);
  const [redo,setRedo]=useState<StudioTemplate[]>([]);
  const fileRef=useRef<HTMLInputElement>(null);

  const ru=locale==="ru";
  useEffect(()=>{
    try{
      const draft=window.localStorage.getItem(DRAFT);
      if(draft){const parsed=studioTemplateSchema.safeParse(JSON.parse(draft));if(parsed.success)setTemplate(parsed.data)}
      const list=JSON.parse(window.localStorage.getItem(STORAGE)??"{}") as Record<string,unknown>;
      setSaved(Object.keys(list));
    }catch{/* Ignore invalid local browser data */}
    setReady(true);
  },[]);
  useEffect(()=>{
    if(!ready)return;
    try{window.localStorage.setItem(DRAFT,JSON.stringify(template));}catch{setMessage("Не удалось сохранить черновик: проверьте место в браузере")}
  },[template,ready]);
  function change(next:StudioTemplate){
    const result=studioTemplateSchema.safeParse(next);
    if(!result.success){setMessage(result.error.issues[0]?.message??"Недопустимое изменение");return}
    setUndo(history=>[...history.slice(-39),template]);
    setRedo([]);setTemplate(result.data);setMessage("");
  }
  function changeNode(patch:Partial<StudioElement>){
    if(!selectedId)return;
    change({...template,elements:template.elements.map(el=>el.id===selectedId?{...el,...patch}:el)});
  }
  function beginTextEdit(id:string){
    setSelectedId(id);
    const node=template.elements.find(el=>el.id===id);
    if(!node)return;
    if(node.binding!=="none"){setMessage("Текст привязан к переменной. Отключите привязку в панели свойств, чтобы изменить его на холсте.");return;}
    setEditingId(id);
  }
  function commitInlineText(id:string,text:string){
    setEditingId(null);
    if(template.elements.find(el=>el.id===id)?.text===text)return;
    change({...template,elements:template.elements.map(el=>el.id===id?{...el,text}:el)});
  }
  function moveNode(id:string,x:number,y:number){
    const current=template.elements.find(el=>el.id===id);
    if(!current||current.x===x&&current.y===y)return;
    setTemplate(previous=>({...previous,elements:previous.elements.map(el=>el.id===id?{...el,x,y}:el)}));
  }
  function add(type:StudioElementType){
    const element=createElement(type,id());
    const availableY=Math.max(0,template.canvasHeight-element.height);
    element.y=Math.min(availableY,Math.max(30,template.elements.reduce((max,node)=>Math.max(max,node.y+node.height),0)+24));
    element.x=Math.max(0,Math.min(element.x,440-element.width));
    change({...template,elements:[...template.elements,element]});setSelectedId(element.id);
  }
  function remove(){
    setEditingId(null);
    if(!selectedId)return;
    change({...template,elements:template.elements.filter(el=>el.id!==selectedId)});setSelectedId(null);
  }
  function reorder(direction:-1|1){
    const index=template.elements.findIndex(el=>el.id===selectedId);
    const nextIndex=index+direction;
    if(index<0||nextIndex<0||nextIndex>=template.elements.length)return;
    const elements=[...template.elements];
    [elements[index],elements[nextIndex]]=[elements[nextIndex],elements[index]];
    change({...template,elements});
  }
  function duplicate(){
    const selected=template.elements.find(el=>el.id===selectedId);
    if(!selected||template.elements.length>=80)return;
    const copy={...selected,id:id(),x:Math.min(440-selected.width,selected.x+16),y:Math.min(template.canvasHeight-selected.height,selected.y+16)};
    change({...template,elements:[...template.elements,copy]});setSelectedId(copy.id);
  }
  function save(){
    try{
      const stored=JSON.parse(window.localStorage.getItem(STORAGE)??"{}") as Record<string,StudioTemplate>;
      stored[template.id]=template;
      window.localStorage.setItem(STORAGE,JSON.stringify(stored));
      setSaved(Object.keys(stored));setMessage(ru?"Шаблон сохранён только в этом браузере":"Калып ушул браузерде гана сакталды");
    }catch{setMessage("Не удалось сохранить шаблон")}
  }
  function load(name:string){
    try{
      const list=JSON.parse(window.localStorage.getItem(STORAGE)??"{}") as Record<string,unknown>;
      const result=studioTemplateSchema.safeParse(list[name]);
      if(!result.success)throw Error("Некорректная схема");
      change(result.data);setSelectedId(null);
    }catch{setMessage("Не удалось открыть шаблон")}
  }
  async function importFile(file:File){
    if(file.size>200_000){setMessage("JSON слишком большой (максимум 200 КБ)");return}
    try{
      const parsed=studioTemplateSchema.safeParse(JSON.parse(await file.text()));
      if(!parsed.success)throw Error(parsed.error.issues[0]?.message||"Некорректная схема");
      change(parsed.data);setSelectedId(null);setMessage("Шаблон импортирован в локальный черновик");
    }catch(error){setMessage(error instanceof Error?error.message:"Ошибка импорта")}
  }
  function undoOnce(){
    if(!undo.length)return;
    const previous=undo[undo.length-1];
    setUndo(x=>x.slice(0,-1));setRedo(x=>[...x,template]);setTemplate(previous);
  }
  function redoOnce(){
    if(!redo.length)return;
    const next=redo[redo.length-1];
    setRedo(x=>x.slice(0,-1));setUndo(x=>[...x,template]);setTemplate(next);
  }
  const selected=template.elements.find(node=>node.id===selectedId);
  const number=(label:string,key:"x"|"y"|"width"|"height"|"fontSize"|"radius"|"opacity",min:number,max:number)=>
    <label className="studio-field">{label}<input type="number" min={min} max={max} step={key==="opacity"?.05:1}
      value={selected?.[key]??0} onChange={event=>{
        if(!selected)return;
        const value=Number(event.target.value);if(!Number.isFinite(value))return;
        const safe=Math.min(max,Math.max(min,value));
        const patch:Partial<StudioElement>={[key]:safe};
        if(key==="width")patch.x=Math.min(selected.x,440-safe);
        if(key==="height")patch.y=Math.min(selected.y,template.canvasHeight-safe);
        changeNode(patch);
      }}/></label>;
  return <main className="studio" lang={locale}>
    <header className="studio-toolbar">
      <div className="studio-top-left"><Link href={`/${locale}`} aria-label="На главную"><ArrowLeft size={20}/></Link><strong>INVITO <span>Studio</span></strong><span className="studio-beta">LOCAL MVP</span></div>
      <div className="studio-toolbar-actions">
        <button onClick={undoOnce} disabled={!undo.length} title="Отменить" aria-label="Отменить"><Undo2 size={18}/></button>
        <button onClick={redoOnce} disabled={!redo.length} title="Повторить" aria-label="Повторить"><Redo2 size={18}/></button>
        <button onClick={()=>fileRef.current?.click()}><FileUp size={16}/><span>Импорт</span></button>
        <button onClick={()=>downloadJson(template,template.id+".json")}><Download size={16}/><span>JSON</span></button>
        <button className="studio-save" onClick={save}><Save size={16}/><span>Сохранить</span></button>
      </div>
    </header>
    <div className="studio-notice"><strong>Визуальный конструктор — первая версия.</strong> Изменения сохраняются только в этом браузере. Шаблоны пока <strong>не публикуются</strong> в общем каталоге и не доступны другим пользователям. Управление доступом для администратора будет добавлено вместе с серверной публикацией.</div>
    <div className="studio-layout">
      <aside className="studio-sidebar" aria-label="Библиотека элементов и слои">
        <p className="studio-panel-title">ЭЛЕМЕНТЫ</p>
        <div className="studio-elements">
          {([{type:"text",icon:Type,label:"Текст"},{type:"image",icon:ImagePlus,label:"Фото"},{type:"shape",icon:Square,label:"Фигура"},{type:"button",icon:MousePointer2,label:"Кнопка"}] as const).map(item=><button key={item.type} onClick={()=>add(item.type)} disabled={template.elements.length>=80}><item.icon size={21}/><span>{item.label}</span><Plus size={13}/></button>)}
        </div>
        <p className="studio-panel-title">СЛОИ <span>{template.elements.length}/80</span></p>
        <div className="studio-layers">{[...template.elements].reverse().map(el=><button className={selectedId===el.id?"is-active":""} key={el.id} onClick={()=>setSelectedId(el.id)}><span className="studio-layer-kind">{el.type==="text"?"T":el.type==="image"?"▧":el.type==="button"?"◉":"▢"}</span><span>{el.text||el.type}</span></button>)}</div>
        <div className="studio-layer-actions"><button disabled={!selected} onClick={()=>reorder(1)} title="На слой выше"><ArrowUp size={17}/></button><button disabled={!selected} onClick={()=>reorder(-1)} title="На слой ниже"><ArrowDown size={17}/></button><button disabled={!selected} onClick={duplicate} title="Дублировать"><Copy size={17}/></button><button disabled={!selected} onClick={remove} title="Удалить"><Trash2 size={17}/></button></div>
        <p className="studio-panel-title">МОИ ШАБЛОНЫ</p>
        <div className="studio-saved">{saved.length===0?<p>Нет сохранённых шаблонов</p>:saved.map(key=><button key={key} onClick={()=>load(key)}>{key}</button>)}</div>
      </aside>
      <section className="studio-workspace" aria-label="Холст шаблона">
        <div className="studio-workspace-head"><div><span>ХОЛСТ / {template.name}</span><small>Дважды нажмите на текст или используйте быструю панель ниже</small></div><div className="studio-viewport-choices">{([320,375,440] as const).map(value=><button key={value} aria-pressed={viewport===value} onClick={()=>setViewport(value)}>{value}</button>)}</div></div>
        {selected&&<StudioTextToolbar element={selected} onChange={changeNode} onEdit={()=>beginTextEdit(selected.id)} onDuplicate={duplicate} onDelete={remove}/>}
        <div className="studio-canvas-scroll"><StudioCanvas template={template} selectedId={selectedId} onSelect={id=>{setSelectedId(id)}} onMove={moveNode} editingId={editingId} onBeginEdit={beginTextEdit} onCommitText={commitInlineText} onCancelEdit={()=>setEditingId(null)} viewport={viewport}/></div>
        <p className="studio-canvas-hint"><Move size={15}/> Холст рассчитан на 440 px. Кнопки 320/375/440 меняют масштаб превью.</p>
      </section>
      <aside className="studio-inspector" aria-label="Свойства">
        <p className="studio-panel-title">ШАБЛОН</p>
        <label className="studio-field">Название<input value={template.name} maxLength={80} onChange={e=>change({...template,name:e.target.value||"Без названия"})}/></label>
        <label className="studio-field">Slug<input value={template.id} onChange={e=>{const id=e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"");if(id.length>=3)change({...template,id})}}/></label>
        <label className="studio-field">Высота холста<input type="number" min={500} max={2400} value={template.canvasHeight} onChange={e=>{const height=Number(e.target.value);if(height>=500&&height<=2400&&!template.elements.some(el=>el.y+el.height>height))change({...template,canvasHeight:height})}}/></label>
        <label className="studio-field">Цвет фона<input type="color" value={template.background} onChange={e=>change({...template,background:e.target.value})}/></label>
        <p className="studio-panel-title">СВОЙСТВА {selected?.type.toUpperCase()??""}</p>
        {!selected?<p className="studio-empty-selection">Выберите элемент на холсте или в панели слоёв.</p>:<div className="studio-fields">
          {(selected.type==="text"||selected.type==="button")&&<>
            <label className="studio-field">Текст<textarea rows={3} maxLength={300} value={selected.text} onChange={e=>changeNode({text:e.target.value})}/></label>
            <label className="studio-field">Динамическое поле<select value={selected.binding} onChange={e=>changeNode({binding:e.target.value as StudioElement["binding"]})}>{["none","name1","name2","date","venue","message"].map(x=><option value={x} key={x}>{x}</option>)}</select></label>
          </>}
          {selected.type==="image"&&<label className="studio-field">Изображение<select value={selected.imageSrc} onChange={e=>changeNode({imageSrc:e.target.value})}><option value="">Без изображения</option>{galleryImages.map(x=><option value={x} key={x}>{x.split("/").pop()}</option>)}</select></label>}
          <div className="studio-field-grid">{number("X","x",0,440-selected.width)}{number("Y","y",0,template.canvasHeight-selected.height)}{number("Ширина","width",24,440)}{number("Высота","height",20,Math.min(1000,template.canvasHeight))}</div>
          {(selected.type==="text"||selected.type==="button")&&<>
            <div className="studio-field-grid">{number("Размер шрифта","fontSize",8,120)}<label className="studio-field">Шрифт<select value={selected.fontFamily} onChange={e=>changeNode({fontFamily:e.target.value as StudioElement["fontFamily"]})}><option value="serif">Serif</option><option value="sans">Sans</option></select></label></div>
            <label className="studio-field">Выравнивание<select value={selected.textAlign} onChange={e=>changeNode({textAlign:e.target.value as StudioElement["textAlign"]})}><option value="left">Слева</option><option value="center">По центру</option><option value="right">Справа</option></select></label>
            <label className="studio-field">Насыщенность<select value={selected.fontWeight} onChange={e=>changeNode({fontWeight:e.target.value as StudioElement["fontWeight"]})}>{["400","500","600","700"].map(x=><option value={x} key={x}>{x}</option>)}</select></label>
            <label className="studio-field">Цвет текста<input type="color" value={selected.color} onChange={e=>changeNode({color:e.target.value})}/></label>
          </>}
          {selected.type!=="image"&&<label className="studio-field">Фон<input type="color" value={selected.background} onChange={e=>changeNode({background:e.target.value})}/></label>}
          {number("Скругление","radius",0,200)}
          {number("Прозрачность","opacity",0,1)}
        </div>}
      </aside>
    </div>
    {message&&<div className="studio-status" role="status">{message}<button onClick={()=>setMessage("")} aria-label="Закрыть">×</button></div>}
    <input ref={fileRef} className="studio-file-input" type="file" accept="application/json,.json" onChange={e=>{const file=e.target.files?.[0];if(file)void importFile(file);e.currentTarget.value=""}}/>
  </main>;
}
