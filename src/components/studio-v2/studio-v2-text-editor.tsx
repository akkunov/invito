"use client";
import {useLayoutEffect,useRef,useState,type KeyboardEvent} from "react";
import {plainText,reconcileText,rangeStyle,formatRange,type TextNode,type TextRun,type TextRange,type TextStyle} from "@/features/studio-v2/core/rich-text-engine.ts";
import {TextRuns,textRunStyle} from "./studio-v2-artboard";
export type TextEditingSession={id:string;range:TextRange;typingStyle:TextStyle|null};
export function StudioV2TextEditor({node,editing,onRuns,onRange,onFinish}:{node:TextNode;editing:TextEditingSession;onRuns:(runs:TextRun[])=>void;onRange:(range:TextRange)=>void;onFinish:(cancel:boolean)=>void}){
 const ref=useRef<HTMLTextAreaElement>(null);
 const composing=useRef(false);
 const [composition,setComposition]=useState<string|null>(null);
 const value=plainText(node.runs);
 const firstStyle=rangeStyle(node.runs,editing.range);
 useLayoutEffect(()=>{const el=ref.current;if(!el)return;el.focus();el.setSelectionRange(editing.range.start,editing.range.end);},[node.id]);
 useLayoutEffect(()=>{
  const el=ref.current;if(!el||composing.current||document.activeElement!==el)return;
  if(el.selectionStart!==editing.range.start||el.selectionEnd!==editing.range.end)el.setSelectionRange(editing.range.start,editing.range.end);
 },[editing.range.start,editing.range.end]);
 function update(value:string,el:HTMLTextAreaElement){
  try{onRuns(reconcileText(node.runs,value,editing.typingStyle??undefined));onRange({start:el.selectionStart,end:el.selectionEnd});}catch{/* Preserve last valid document when the run cap is exceeded. */}
 }
 function key(e:KeyboardEvent<HTMLTextAreaElement>){
  e.stopPropagation();
  if(e.nativeEvent.isComposing||composing.current)return;
  if(e.key==="Escape"){e.preventDefault();onFinish(true);}
  else if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();onFinish(false);}
 }
 return <div className="v2-text-edit" style={{background:"transparent"}} onPointerDown={e=>e.stopPropagation()} onDoubleClick={e=>e.stopPropagation()}>
  <textarea ref={ref} aria-label="Редактирование текста" spellCheck={false} value={composition??value} style={{
    ...textRunStyle(firstStyle),color:"transparent",caretColor:firstStyle.color,background:"transparent",resize:"none",border:0,outline:0,
    textAlign:node.textAlign,lineHeight:node.lineHeight??1.14,letterSpacing:node.letterSpacing??0,whiteSpace:"pre-wrap",overflowWrap:"anywhere",
    padding:0,margin:0,width:"100%",height:"100%",display:"block",overflow:"hidden",
  }} onChange={e=>{if(composing.current)setComposition(e.currentTarget.value);else update(e.currentTarget.value,e.currentTarget);}}
  onSelect={e=>{if(!composing.current)onRange({start:e.currentTarget.selectionStart,end:e.currentTarget.selectionEnd});}}
  onCompositionStart={e=>{composing.current=true;setComposition(e.currentTarget.value);}}
  onCompositionEnd={e=>{composing.current=false;setComposition(null);update(e.currentTarget.value,e.currentTarget);}}
  onKeyDown={key}/>
 </div>;
}
export function TextControls({node,editing,onStyle,onNode,onFinish}:{node:TextNode;editing:TextEditingSession|null;onStyle:(patch:Partial<TextStyle>)=>void;onNode:(patch:Partial<Pick<TextNode,"textAlign"|"lineHeight"|"letterSpacing"|"autoHeight">>)=>void;onFinish?:()=>void}){
 const style=editing?.typingStyle??rangeStyle(node.runs,editing?.range??{start:0,end:plainText(node.runs).length});
 return <section className="v2-inspector-section">
 <h3>Текст</h3>
 <label className="v2-layout-field">Шрифт<select value={style.fontFamily} onChange={e=>onStyle({fontFamily:e.target.value as TextStyle["fontFamily"]})}><option value="sans">Arial</option><option value="serif">Georgia</option></select></label>
 <label className="v2-layout-field">Размер<input type="number" min={6} max={400} value={style.fontSize} onChange={e=>{const n=Number(e.target.value);if(n>=6&&n<=400)onStyle({fontSize:n});}}/></label>
 <label className="v2-layout-field">Насыщенность<select value={style.fontWeight} onChange={e=>onStyle({fontWeight:Number(e.target.value)})}>{[100,200,300,400,500,600,700,800,900].map(w=><option key={w} value={w}>{w}</option>)}</select></label>
 <div className="v2-nudge">{([{label:"B",key:"bold"},{label:"I",key:"italic"},{label:"U",key:"underline"},{label:"S",key:"strike"}] as const).map(({label,key})=><button key={key} aria-label={key} aria-pressed={key==="bold"?style.fontWeight>=700:style[key]} onMouseDown={e=>e.preventDefault()} onClick={()=>onStyle(key==="bold"?{fontWeight:style.fontWeight>=700?400:700}:{[key]:!style[key]})}>{label}</button>)}</div>
 <label className="v2-layout-field">Цвет<input type="color" value={style.color} onChange={e=>onStyle({color:e.target.value})}/></label>
 <label className="v2-layout-field">Выравнивание<select value={node.textAlign} onChange={e=>onNode({textAlign:e.target.value as TextNode["textAlign"]})}><option value="left">Слева</option><option value="center">Центр</option><option value="right">Справа</option></select></label>
 <label className="v2-layout-field">Высота строки<input type="number" min={0.8} max={4} step={0.05} value={node.lineHeight??1.14} onChange={e=>{const n=Number(e.target.value);if(n>=0.8&&n<=4)onNode({lineHeight:n});}}/></label>
 <label className="v2-layout-field">Интервал букв<input type="number" min={-10} max={60} value={node.letterSpacing??0} onChange={e=>{const n=Number(e.target.value);if(n>=-10&&n<=60)onNode({letterSpacing:n});}}/></label>
 <label className="v2-layout-field">Автовысота<input type="checkbox" checked={!!node.autoHeight} onChange={e=>onNode({autoHeight:e.target.checked})}/></label>
 {editing&&<><p className="v2-placeholder">Выделено: {editing.range.end-editing.range.start} · Esc — отмена, Ctrl/⌘+Enter — готово</p><button className="v2-inspector-button" onClick={onFinish}>Готово</button></>}
 </section>;
}
