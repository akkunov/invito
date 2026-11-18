"use client";
import {ColorPicker,type PaletteColor} from "./studio-v2-color-picker";
import {StudioIcon} from "./studio-icon";
import {resolveStyleNode} from "@/features/studio-v2/core/style-tokens.ts";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema.ts";
import {useLayoutEffect,useRef,type KeyboardEvent} from "react";
import {plainText,reconcileText,rangeStyle,replaceRange,sanitizePlainText,type TextNode,type TextRun,type TextRange,type TextStyle} from "@/features/studio-v2/core/rich-text-engine.ts";
import {textRunStyle} from "./studio-v2-artboard";
export type TextEditingSession={id:string;range:TextRange;typingStyle:TextStyle|null};
function selectionOffsets(el:HTMLElement):TextRange|null{
 const sel=window.getSelection();if(!sel?.rangeCount||!sel.anchorNode||!sel.focusNode||!el.contains(sel.anchorNode)||!el.contains(sel.focusNode))return null;
 const offset=(node:Node,index:number)=>{const range=document.createRange();range.selectNodeContents(el);range.setEnd(node,index);return range.toString().length;};
 const a=offset(sel.anchorNode,sel.anchorOffset),b=offset(sel.focusNode,sel.focusOffset);return {start:Math.min(a,b),end:Math.max(a,b)};
}
function restoreSelection(el:HTMLElement,range:TextRange){
 const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
 function locate(index:number):[Node,number]{walker.currentNode=el;let node:Node|null;while((node=walker.nextNode())){const length=node.textContent?.length??0;if(index<=length)return [node,index];index-=length;}return [el,el.childNodes.length];}
 const [a,ai]=locate(range.start),[b,bi]=locate(range.end);const r=document.createRange();r.setStart(a,ai);r.setEnd(b,bi);const sel=window.getSelection();sel?.removeAllRanges();sel?.addRange(r);
}
export function StudioV2TextEditor({node,editing,onRuns,onRange,onFinish}:{node:TextNode;editing:TextEditingSession;onRuns:(runs:TextRun[])=>void;onRange:(range:TextRange)=>void;onFinish:(cancel:boolean)=>void}){
 const ref=useRef<HTMLDivElement>(null);
 const composing=useRef(false);
 const initialized=useRef(false);
 const rendered=useRef<string|null>(null);
 const latestRange=useRef(editing.range);
 const lastNativeText=useRef<string|null>(null);
 useLayoutEffect(()=>{
  const el=ref.current;if(!el||composing.current)return;
  const signature=JSON.stringify(node.runs);
  if(rendered.current!==signature||lastNativeText.current!==null){
   const fragment=document.createDocumentFragment();
   for(const run of node.runs){
    const span=document.createElement("span");
    const style=textRunStyle(run.style);
    span.style.fontFamily=String(style.fontFamily);span.style.fontSize=style.fontSize+"px";span.style.fontWeight=String(style.fontWeight);
    span.style.fontStyle=String(style.fontStyle);span.style.textDecoration=String(style.textDecoration);span.style.color=String(style.color);
    span.textContent=run.text;fragment.append(span);
   }
   el.replaceChildren(fragment);rendered.current=signature;lastNativeText.current=null;
   if(!initialized.current){initialized.current=true;el.focus();}
   if(document.activeElement===el)restoreSelection(el,latestRange.current);
  }
 },[node.runs]);
 useLayoutEffect(()=>{
  const sync=()=>{const el=ref.current;if(!el||composing.current||document.activeElement!==el)return;const range=selectionOffsets(el);if(range&&(range.start!==latestRange.current.start||range.end!==latestRange.current.end)){latestRange.current=range;onRange(range);}};
  document.addEventListener("selectionchange",sync);return()=>document.removeEventListener("selectionchange",sync);
 },[onRange]);
 function publish(runs:TextRun[],range:TextRange){
  latestRange.current=range;lastNativeText.current=plainText(runs);onRuns(runs);onRange(range);
 }
 function insert(text:string){
  const el=ref.current;if(!el)return;
  const range=selectionOffsets(el)??latestRange.current;
  try{const clean=sanitizePlainText(text),next=replaceRange(node.runs,range,clean,editing.typingStyle??undefined);const end=range.start+clean.length;publish(next,{start:end,end});}catch{/* Preserve last valid document when run limit is exceeded. */}
 }
 function input(el:HTMLDivElement){
  if(composing.current)return;
  const range=selectionOffsets(el)??latestRange.current;
  try{publish(reconcileText(node.runs,el.textContent??"",editing.typingStyle??undefined),range);}catch{lastNativeText.current="";onRuns([...node.runs]);}
 }
 function key(e:KeyboardEvent<HTMLDivElement>){
  e.stopPropagation();if(e.nativeEvent.isComposing||composing.current)return;
  if(e.key==="Escape"){e.preventDefault();onFinish(true);}
  else if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();onFinish(false);}
  else if(e.key==="Enter"){e.preventDefault();insert("\n");}
 }
 return <div className="v2-text-edit" onPointerDown={e=>e.stopPropagation()} onDoubleClick={e=>e.stopPropagation()}>
  <div ref={ref} role="textbox" aria-label="Редактирование текста" aria-multiline="true" contentEditable="plaintext-only" spellCheck={false} suppressContentEditableWarning
    style={{textAlign:node.textAlign,lineHeight:node.lineHeight??1.14,letterSpacing:node.letterSpacing??0,whiteSpace:"pre-wrap",overflowWrap:"anywhere",minHeight:"1em",width:"100%",outline:0}}
    onBeforeInput={e=>{const event=e.nativeEvent as InputEvent;if(!composing.current&&(event.inputType==="insertParagraph"||event.inputType==="insertLineBreak")){e.preventDefault();insert("\n");}}}
    onInput={e=>input(e.currentTarget)} onPaste={e=>{e.preventDefault();insert(e.clipboardData.getData("text/plain"));}}
    onDrop={e=>e.preventDefault()} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={e=>{composing.current=false;input(e.currentTarget);}} onKeyDown={key}/>
 </div>;
}
export function TextControls({node,editing,onStyle,onNode,onFinish,palette=[],document,onUnlink}:{node:TextNode;palette?:PaletteColor[];document?:ProjectDocumentV2;onUnlink?:()=>void;editing:TextEditingSession|null;onStyle:(patch:Partial<TextStyle>)=>void;onNode:(patch:Partial<Pick<TextNode,"textAlign"|"lineHeight"|"letterSpacing"|"autoHeight">>)=>void;onFinish?:()=>void}){
 const resolved=document?resolveStyleNode(document,node) as TextNode:node;
 const style=editing?.typingStyle??rangeStyle(resolved.runs,editing?.range??{start:0,end:plainText(resolved.runs).length});
 const linked=node.tokenRefs?.textColor;const color=linked&&document?resolved.runs[0]?.style.color??style.color:style.color;
 return <section className="v2-inspector-section">
 <h3>Типографика</h3>
 <label className="v2-layout-field">Шрифт<select value={style.fontFamily} disabled={node.locked||!!node.tokenRefs?.typography} onChange={e=>onStyle({fontFamily:e.target.value as TextStyle["fontFamily"]})}><option value="sans">Arial</option><option value="serif">Georgia</option></select></label>
 <label className="v2-layout-field">Размер<input type="number" min={6} max={400} value={style.fontSize} disabled={node.locked||!!node.tokenRefs?.typography} onChange={e=>{const n=Number(e.target.value);if(n>=6&&n<=400)onStyle({fontSize:n});}}/></label>
 <label className="v2-layout-field">Насыщенность<select value={style.fontWeight} disabled={node.locked||!!node.tokenRefs?.typography} onChange={e=>onStyle({fontWeight:Number(e.target.value)})}>{[100,200,300,400,500,600,700,800,900].map(w=><option key={w} value={w}>{w}</option>)}</select></label>
 <div className="v2-nudge">{([{label:"B",key:"bold"},{label:"I",key:"italic"},{label:"U",key:"underline"},{label:"S",key:"strike"}] as const).map(({label,key})=><button key={key} aria-label={key} disabled={node.locked||key==="bold"&&!!node.tokenRefs?.typography} aria-pressed={key==="bold"?style.fontWeight>=700:style[key]} onMouseDown={e=>e.preventDefault()} onClick={()=>onStyle(key==="bold"?{fontWeight:style.fontWeight>=700?400:700}:{[key]:!style[key]})} title={label}><StudioIcon name={key}/></button>)}</div>
 <ColorPicker label="Цвет текста" value={color} palette={palette} disabled={node.locked||!!(linked&&editing)} linkedLabel={linked?document?.tokens?.[linked]?.name??linked:undefined} onUnlink={editing?undefined:onUnlink} onChange={color=>onStyle({color})}/>
 <div className="v2-nudge v2-text-align">{(["left","center","right"] as const).map((align,i)=><button key={align} title={["Слева","По центру","Справа"][i]} aria-label={["Слева","По центру","Справа"][i]} aria-pressed={node.textAlign===align} onMouseDown={e=>e.preventDefault()} onClick={()=>onNode({textAlign:align})}><StudioIcon name={align==="left"?"textLeft":align==="center"?"textCenter":"textRight"}/></button>)}</div>
 <label className="v2-layout-field">Высота строки<input type="number" min={0.8} max={4} step={0.05} value={resolved.lineHeight??1.14} disabled={node.locked||!!node.tokenRefs?.typography} onChange={e=>{const n=Number(e.target.value);if(n>=0.8&&n<=4)onNode({lineHeight:n});}}/></label>
 <label className="v2-layout-field">Интервал букв<input type="number" min={-10} max={60} value={resolved.letterSpacing??0} disabled={node.locked||!!node.tokenRefs?.typography} onChange={e=>{const n=Number(e.target.value);if(n>=-10&&n<=60)onNode({letterSpacing:n});}}/></label>
 <label className="v2-layout-field">Автовысота<input type="checkbox" checked={!!node.autoHeight} onChange={e=>onNode({autoHeight:e.target.checked})}/></label>
 {editing&&<><p className="v2-placeholder">Выделено: {editing.range.end-editing.range.start} · Esc — отмена, Ctrl/⌘+Enter — готово</p><button className="v2-inspector-button" onClick={onFinish}>Готово</button></>}
 </section>;
}
