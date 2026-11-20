"use client";
import {useLayoutEffect,useRef,useState,type ChangeEvent,type InputHTMLAttributes, type KeyboardEvent} from "react";

/**
 * Studio's native number input.
 *
 * The DOM owns the temporary edit buffer, including a blank field, a leading
 * minus and incomplete decimals. Persisted documents continue to own the
 * validated numeric value. This avoids rewriting a half-typed value to 0.
 *
 * Commit valid edits immediately; invalid drafts are restored on blur.
 * Focusing selects the entire value (Figma-style replace-in-one-keystroke).
 */
type Props=Omit<InputHTMLAttributes<HTMLInputElement>,"type"|"defaultValue"|"value"> & {
  value:number|string|undefined|null;
  allowEmpty?:boolean;
  steppers?:boolean;
  onValueChange?:(next:number|undefined)=>void;
};

export function StudioNumberInput({
 value,allowEmpty=false,steppers=false,onValueChange,
 onChange,onFocus,onBlur,onKeyDown,disabled,
 min,max,step,...rest
}:Props){
 const ref=useRef<HTMLInputElement>(null);
 const [invalid,setInvalid]=useState(false);
 const persisted=value===null||value===undefined?"":String(value);
 const lo=min===undefined?Number.NEGATIVE_INFINITY:Number(min);
 const hi=max===undefined?Number.POSITIVE_INFINITY:Number(max);
 const increment=step===undefined||step==="any"?1:Number(step);
 const bounded=(next:number)=>Math.min(hi,Math.max(lo,next));
 const usable=(raw:string)=>raw.trim()!==""&&Number.isFinite(Number(raw))&&
   Number(raw)>=lo&&Number(raw)<=hi;

 useLayoutEffect(()=>{
  const input=ref.current;
  if(input&&document.activeElement!==input&&input.value!==persisted)input.value=persisted;
 },[persisted,disabled]);

 function changed(event:ChangeEvent<HTMLInputElement>){
  setInvalid(false);
  const raw=event.currentTarget.value;
  if(raw===""){
   if(allowEmpty){
    onValueChange?.(undefined);
    onChange?.(event);
   }
   return;
  }
  if(event.currentTarget.validity.badInput||!usable(raw))return;
  if(onValueChange)onValueChange(Number(raw));
  else onChange?.(event);
 }
 function blur(event:React.FocusEvent<HTMLInputElement>){
  const input=event.currentTarget;
  // A transient empty value is never converted to zero by Number("").
  if(!allowEmpty&&input.value.trim()===""||input.value!==""&&!usable(input.value)){
    input.value=persisted;
    setInvalid(true);
  }else{
    input.value=persisted;
    setInvalid(false);
  }
  onBlur?.(event);
 }
 function keyboard(event:KeyboardEvent<HTMLInputElement>){
  if(event.key==="Escape"){
   event.preventDefault();event.stopPropagation();
   event.currentTarget.value=persisted;
   setInvalid(false);
   return;
  }
  if(event.key==="Enter"){
   event.preventDefault();
   event.currentTarget.blur();
   return;
  }
  if(event.shiftKey&&(event.key==="ArrowUp"||event.key==="ArrowDown")&&onValueChange){
   event.preventDefault();
   const base=usable(event.currentTarget.value)?Number(event.currentTarget.value):Number(persisted)||0;
   const next=bounded(base+(event.key==="ArrowUp"?1:-1)*increment*10);
   onValueChange(Number(next.toFixed(8)));
   event.currentTarget.value=String(next);
   setInvalid(false);
  }
  onKeyDown?.(event);
 }
 function spin(direction:1|-1){
  if(!onValueChange||disabled)return;
  const base=usable(ref.current?.value??"")?Number(ref.current?.value):Number(persisted)||0;
  const next=bounded(base+direction*increment);
  if(!Number.isFinite(next))return;
  const rounded=Number(next.toFixed(8));
  onValueChange(rounded);
  if(ref.current)ref.current.value=String(rounded);
  setInvalid(false);
 }
 const input=<input {...rest} ref={ref} type="number" inputMode="decimal"
  min={min} max={max} step={step??"any"} defaultValue={persisted}
  disabled={disabled} aria-invalid={invalid||rest["aria-invalid"]}
  onChange={changed} onFocus={event=>{setInvalid(false);event.currentTarget.select();onFocus?.(event);}}
  onBlur={blur} onKeyDown={keyboard}/>;
 if(!steppers)return input;
 return <span className="v2-number-shell">
  {input}
  <span className="v2-number-steppers">
   <button type="button" tabIndex={-1} disabled={disabled||!onValueChange} onMouseDown={e=>e.preventDefault()} onClick={()=>spin(1)} aria-label="Увеличить значение">+</button>
   <button type="button" tabIndex={-1} disabled={disabled||!onValueChange} onMouseDown={e=>e.preventDefault()} onClick={()=>spin(-1)} aria-label="Уменьшить значение">−</button>
  </span>
 </span>;
}
