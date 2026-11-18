"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Download, FileUp, ImagePlus, Plus, Redo2, Save, Trash2, Type, Undo2, Square, MousePointer2, Move, Grid2X2, Ruler, Magnet, Upload, Hand, ZoomIn, ZoomOut } from "lucide-react";
import { StudioCanvas } from "@/components/studio/studio-canvas";
import { StudioTextToolbar } from "@/components/studio/studio-text-toolbar";
import { processStudioAsset } from "@/features/studio/studio-media";
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
  const [selectedIds,setSelectedIds]=useState<string[]>([]);
  const selectedId=selectedIds.length===1?selectedIds[0]:null;
  function setSelectedId(id:string|null){setSelectedIds(id?[id]:[])}
  const [tool,setTool]=useState<"move"|"hand">("move");
  const [spaceHand,setSpaceHand]=useState(false);
  const activeTool=spaceHand?"hand":tool;
  const [zoom,setZoom]=useState(85);
  const canvasScrollRef=useRef<HTMLDivElement>(null);
  const handRef=useRef<{pointer:number;x:number;y:number;left:number;top:number}|null>(null);
  const gestureHistory=useRef<StudioTemplate|null>(null);
  const [showGrid,setShowGrid]=useState(true);
  const [showRulers,setShowRulers]=useState(true);
  const [snapToGrid,setSnapToGrid]=useState(true);
  const [editingId,setEditingId]=useState<string|null>(null);

  const [saved,setSaved]=useState<string[]>([]);
  const [message,setMessage]=useState("");
  const [ready,setReady]=useState(false);
  const [undo,setUndo]=useState<StudioTemplate[]>([]);
  const [redo,setRedo]=useState<StudioTemplate[]>([]);
  const fileRef=useRef<HTMLInputElement>(null);
  const assetRef=useRef<HTMLInputElement>(null);

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
  useEffect(()=>{
    function down(e:globalThis.KeyboardEvent){
      const target=e.target as HTMLElement|null;
      if(target?.closest("input,textarea,select,[contenteditable=true]"))return;
      if(e.code==="Space"){e.preventDefault();setSpaceHand(true);return;}
      if(e.key==="Escape"){setSelectedIds([]);setEditingId(null);return;}
      if(e.key.toLowerCase()==="v"&&!e.ctrlKey&&!e.metaKey){setTool("move");return;}
      if(e.key.toLowerCase()==="h"&&!e.ctrlKey&&!e.metaKey){setTool("hand");return;}
      if(e.key==="Delete"||e.key==="Backspace"){
        e.preventDefault();
        change({...template,elements:template.elements.filter(x=>!selectedIds.includes(x.id))});
        setSelectedIds([]);return;
      }
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="a"){
        e.preventDefault();setSelectedIds(template.elements.map(x=>x.id));return;
      }
      if((e.ctrlKey||e.metaKey)&&e.key==="0"){
        e.preventDefault();setZoom(85);return;
      }
    }
    const up=(e:globalThis.KeyboardEvent)=>{if(e.code==="Space")setSpaceHand(false)};
    const blur=()=>setSpaceHand(false);
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur)};
  },[selectedIds,template.elements]);
  function transformSelection(patches:Record<string,Partial<StudioElement>>){
    setTemplate(previous=>({...previous,elements:previous.elements.map(el=>patches[el.id]?{...el,...patches[el.id]}:el)}));
  }
  function beginGesture(){gestureHistory.current=template}
  function endGesture(){
    const original=gestureHistory.current;
    gestureHistory.current=null;
    if(original){setUndo(items=>[...items.slice(-39),original]);setRedo([])}
  }
  function startHand(e:React.PointerEvent<HTMLDivElement>){
    if(activeTool!=="hand"||!canvasScrollRef.current||e.button!==0)return;
    const el=canvasScrollRef.current;
    handRef.current={pointer:e.pointerId,x:e.clientX,y:e.clientY,left:el.scrollLeft,top:el.scrollTop};
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function moveHand(e:React.PointerEvent<HTMLDivElement>){
    const hand=handRef.current,el=canvasScrollRef.current;
    if(!hand||!el||hand.pointer!==e.pointerId)return;
    el.scrollLeft=hand.left-(e.clientX-hand.x);
    el.scrollTop=hand.top-(e.clientY-hand.y);
  }
  function endHand(e:React.PointerEvent<HTMLDivElement>){
    const el=canvasScrollRef.current;
    if(handRef.current?.pointer!==e.pointerId)return;
    handRef.current=null;
    if(el?.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);
  }
  function canvasWheel(e:React.WheelEvent<HTMLDivElement>){
    if(!e.ctrlKey&&!e.metaKey)return;
    e.preventDefault();setZoom(z=>Math.max(35,Math.min(175,Math.round(z-e.deltaY*.13))));
  }
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
    if(node.binding!=="none"){
      setMessage("Привязка к переменной отключена для ручного редактирования этого элемента.");
      change({...template,elements:template.elements.map(el=>el.id===id?{...el,binding:"none",text:el.text}:el)});
    }
    setEditingId(id);
  }
  function commitInlineText(id:string,text:string){
    setEditingId(null);
    if(template.elements.find(el=>el.id===id)?.text===text)return;
    change({...template,elements:template.elements.map(el=>el.id===id?{...el,text}:el)});
  }
  function resizeNode(id:string,width:number,height:number){
    setTemplate(previous=>({...previous,elements:previous.elements.map(el=>el.id===id?{...el,width,height}:el)}));
  }
  function moveNode(id:string,x:number,y:number){
    const current=template.elements.find(el=>el.id===id);
    if(!current||current.x===x&&current.y===y)return;
    setTemplate(previous=>({...previous,elements:previous.elements.map(el=>el.id===id?{...el,x,y}:el)}));
  }
  async function uploadAsset(file:File){
    try{
      const imageSrc=await processStudioAsset(file);
      if(template.elements.length>=80){setMessage("Лимит элементов — 80");return}
      const element=createElement("image",id());
      element.imageSrc=imageSrc;
      element.x=55;
      element.y=Math.min(template.canvasHeight-element.height,Math.max(10,template.elements.reduce((max,node)=>Math.max(max,node.y+node.height),0)+18));
      change({...template,elements:[...template.elements,element]});
      setSelectedId(null);
      setMessage("Элемент загружен. Нажмите на него для выбора, затем перетащите.");
    }catch(error){setMessage(error instanceof Error?error.message:"Не удалось загрузить файл")}
  }
  function add(type:StudioElementType){
    const element=createElement(type,id());
    const availableY=Math.max(0,template.canvasHeight-element.height);
    element.y=Math.min(availableY,Math.max(30,template.elements.reduce((max,node)=>Math.max(max,node.y+node.height),0)+24));
    element.x=Math.max(0,Math.min(element.x,440-element.width));
    change({...template,elements:[...template.elements,element]});setSelectedId(null);
  }
  function remove(){
    setEditingId(null);
    if(!selectedIds.length)return;
    change({...template,elements:template.elements.filter(el=>!selectedIds.includes(el.id))});setSelectedIds([]);
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
    if(file.size>4_500_000){setMessage("JSON слишком большой (максимум 4,5 МБ)");return}
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
  const selected=selectedId?template.elements.find(node=>node.id===selectedId):undefined;
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
        <button type="button" className="studio-upload-action" onClick={()=>assetRef.current?.click()}><Upload size={18}/> Загрузить PNG, JPG, WebP или SVG</button>
        <p className="studio-panel-title">СЛОИ <span>{template.elements.length}/80</span></p>
        <div className="studio-layers">{[...template.elements].reverse().map(el=><button className={selectedIds.includes(el.id)?"is-active":""} key={el.id} onClick={event=>setSelectedIds(previous=>event.shiftKey?(previous.includes(el.id)?previous.filter(x=>x!==el.id):[...previous,el.id]):[el.id])}><span className="studio-layer-kind">{el.type==="text"?"T":el.type==="image"?"▧":el.type==="button"?"◉":"▢"}</span><span>{el.text||el.type}</span></button>)}</div>
        <div className="studio-layer-actions"><button disabled={!selected} onClick={()=>reorder(1)} title="На слой выше"><ArrowUp size={17}/></button><button disabled={!selected} onClick={()=>reorder(-1)} title="На слой ниже"><ArrowDown size={17}/></button><button disabled={!selected} onClick={duplicate} title="Дублировать"><Copy size={17}/></button><button disabled={!selected} onClick={remove} title="Удалить"><Trash2 size={17}/></button></div>
        <p className="studio-panel-title">МОИ ШАБЛОНЫ</p>
        <div className="studio-saved">{saved.length===0?<p>Нет сохранённых шаблонов</p>:saved.map(key=><button key={key} onClick={()=>load(key)}>{key}</button>)}</div>
      </aside>
      <section className="studio-workspace" aria-label="Холст шаблона">
        <div className="studio-workspace-head"><div><span>ХОЛСТ / {template.name}</span><small>V — выбор, H или пробел — рука, Shift+клик — несколько элементов</small></div>
          <div className="studio-viewport-choices">
            <button title="Уменьшить" onClick={()=>setZoom(z=>Math.max(35,z-10))}><ZoomOut size={16}/></button>
            <button title="Масштаб 100%" aria-label="Масштаб" onClick={()=>setZoom(100)}>{zoom}%</button>
            <button title="Увеличить" onClick={()=>setZoom(z=>Math.min(175,z+10))}><ZoomIn size={16}/></button>
          </div>
        </div>
        <div className="studio-modebar" role="toolbar" aria-label="Инструменты холста">
          <button aria-pressed={activeTool==="move"} onClick={()=>setTool("move")}><MousePointer2 size={18}/> Выбор <kbd>V</kbd></button>
          <button aria-pressed={activeTool==="hand"} onClick={()=>setTool("hand")}><Hand size={18}/> Рука <kbd>H</kbd></button>
          <span className="studio-selection-count">{selectedIds.length?selectedIds.length+" выбрано":"Кликните объект или выделите область"}</span>
        </div>
        <div className="studio-canvas-options" role="toolbar" aria-label="Вид холста">
          <button aria-pressed={showGrid} onClick={()=>setShowGrid(x=>!x)}><Grid2X2 size={16}/> Сетка</button>
          <button aria-pressed={showRulers} onClick={()=>setShowRulers(x=>!x)}><Ruler size={16}/> Линейки</button>
          <button aria-pressed={snapToGrid} onClick={()=>setSnapToGrid(x=>!x)}><Magnet size={16}/> Привязка 10 px</button>
        </div>
        {selected&&<StudioTextToolbar element={selected} onChange={changeNode} onEdit={()=>beginTextEdit(selected.id)} onDuplicate={duplicate} onDelete={remove}/>}
        <div ref={canvasScrollRef} className={`studio-canvas-scroll ${activeTool==="hand"?"is-panning":""}`}
          onPointerDownCapture={startHand} onPointerMove={moveHand} onPointerUp={endHand} onPointerCancel={endHand} onWheel={canvasWheel}>
          <StudioCanvas template={template} selectedIds={selectedIds} onSelect={setSelectedIds}
            onTransform={transformSelection} onGestureStart={beginGesture} onGestureEnd={endGesture}
            editingId={editingId} onBeginEdit={beginTextEdit} onCommitText={commitInlineText}
            onCancelEdit={()=>setEditingId(null)} tool={activeTool} zoom={zoom}
            showGrid={showGrid} showRulers={showRulers} snapToGrid={snapToGrid}/>
        </div>
        <p className="studio-canvas-hint"><Move size={15}/> Масштаб холста: 35–175%. Shift+клик и рамка выделяют несколько объектов; перетаскивание начинается после движения мыши на 5 px.</p>
      </section>
      <aside className="studio-inspector" aria-label="Свойства">
        <p className="studio-panel-title">ШАБЛОН</p>
        <label className="studio-field">Название<input value={template.name} maxLength={80} onChange={e=>change({...template,name:e.target.value||"Без названия"})}/></label>
        <label className="studio-field">Slug<input value={template.id} onChange={e=>{const id=e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"");if(id.length>=3)change({...template,id})}}/></label>
        <label className="studio-field">Высота холста<input type="number" min={500} max={2400} value={template.canvasHeight} onChange={e=>{const height=Number(e.target.value);if(height>=500&&height<=2400&&!template.elements.some(el=>el.y+el.height>height))change({...template,canvasHeight:height})}}/></label>
        <label className="studio-field">Цвет фона<input type="color" value={template.background} onChange={e=>change({...template,background:e.target.value})}/></label>
        <p className="studio-panel-title">СВОЙСТВА {selected?.type.toUpperCase()??""}</p>
        {!selected?<p className="studio-empty-selection">Выберите объект на холсте или в панели слоёв. Для множественного выделения удерживайте Shift.</p>:<div className="studio-fields">
          {(selected.type==="text"||selected.type==="button")&&<>
            <label className="studio-field">Текст<textarea rows={3} maxLength={300} value={selected.text} onChange={e=>changeNode({text:e.target.value})}/></label>
            <label className="studio-field">Динамическое поле<select value={selected.binding} onChange={e=>changeNode({binding:e.target.value as StudioElement["binding"]})}>{["none","name1","name2","date","venue","message"].map(x=><option value={x} key={x}>{x}</option>)}</select></label>
          </>}
          {selected.type==="image"&&<><label className="studio-field">Изображение<select value={galleryImages.includes(selected.imageSrc)?selected.imageSrc:selected.imageSrc?"uploaded":""} onChange={e=>{if(e.target.value!=="uploaded")changeNode({imageSrc:e.target.value})}}><option value="">Без изображения</option>{selected.imageSrc.startsWith("data:")&&<option value="uploaded">Загруженный файл</option>}{galleryImages.map(x=><option value={x} key={x}>{x.split("/").pop()}</option>)}</select></label><button className="studio-upload-action" type="button" onClick={()=>assetRef.current?.click()}>Загрузить другое изображение</button></>}
          {selected.type==="shape"&&<label className="studio-field">Форма<select value={selected.shapeKind} onChange={e=>changeNode({shapeKind:e.target.value as StudioElement["shapeKind"]})}>{([{v:"rectangle",label:"Прямоугольник"},{v:"circle",label:"Круг"},{v:"ellipse",label:"Эллипс"},{v:"triangle",label:"Треугольник"},{v:"diamond",label:"Ромб"},{v:"star",label:"Звезда"},{v:"heart",label:"Сердце"}] as const).map(x=><option key={x.v} value={x.v}>{x.label}</option>)}</select></label>}
          <div className="studio-field-grid">{number("X","x",0,440-selected.width)}{number("Y","y",0,template.canvasHeight-selected.height)}{number("Ширина","width",24,440)}{number("Высота","height",20,Math.min(1000,template.canvasHeight))}</div>
          {(selected.type==="text"||selected.type==="button")&&<>
            <div className="studio-field-grid">{number("Размер шрифта","fontSize",8,120)}<label className="studio-field">Шрифт<select value={selected.fontFamily} onChange={e=>changeNode({fontFamily:e.target.value as StudioElement["fontFamily"]})}><option value="serif">Serif</option><option value="sans">Sans</option></select></label></div>
            <label className="studio-field">Выравнивание<select value={selected.textAlign} onChange={e=>changeNode({textAlign:e.target.value as StudioElement["textAlign"]})}><option value="left">Слева</option><option value="center">По центру</option><option value="right">Справа</option></select></label>
            <label className="studio-field">Насыщенность<select value={selected.fontWeight} onChange={e=>changeNode({fontWeight:e.target.value as StudioElement["fontWeight"]})}>{["400","500","600","700"].map(x=><option value={x} key={x}>{x}</option>)}</select></label>
            <label className="studio-field">Цвет текста<input type="color" value={selected.color} onChange={e=>changeNode({color:e.target.value})}/></label>
          </>}
          {(selected.type==="text"||selected.type==="button")&&<div className="studio-field-grid"><label className="studio-field"><input type="checkbox" checked={selected.italic} onChange={e=>changeNode({italic:e.target.checked})}/>Курсив</label><label className="studio-field"><input type="checkbox" checked={selected.underline} onChange={e=>changeNode({underline:e.target.checked})}/>Подчёркнутый</label><label className="studio-field"><input type="checkbox" checked={selected.strike} onChange={e=>changeNode({strike:e.target.checked})}/>Зачёркнутый</label></div>}
          {selected.type!=="image"&&<label className="studio-field">Фон<input type="color" value={selected.background} onChange={e=>changeNode({background:e.target.value})}/></label>}
          {number("Скругление","radius",0,200)}
          {number("Прозрачность","opacity",0,1)}
        </div>}
      </aside>
    </div>
    {message&&<div className="studio-status" role="status">{message}<button onClick={()=>setMessage("")} aria-label="Закрыть">×</button></div>}
    <input ref={assetRef} className="studio-file-input" type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>{const file=e.target.files?.[0];if(file)void uploadAsset(file);e.currentTarget.value=""}}/>
    <input ref={fileRef} className="studio-file-input" type="file" accept="application/json,.json" onChange={e=>{const file=e.target.files?.[0];if(file)void importFile(file);e.currentTarget.value=""}}/>
  </main>;
}
