import type { ProjectNodeV2 } from "./document.schema.ts";
export type TextNode = Extract<ProjectNodeV2,{type:"text"}>;
export type TextRun = TextNode["runs"][number];
export type TextStyle = TextRun["style"];
export type TextRange = {start:number;end:number};
export const plainText=(runs:readonly TextRun[])=>runs.map(r=>r.text).join("");
const same=(a:TextStyle,b:TextStyle)=>Object.keys(a).length===Object.keys(b).length&&Object.entries(a).every(([k,v])=>b[k as keyof TextStyle]===v);
export function normalizeRuns(runs:readonly TextRun[],fallback:TextStyle):TextRun[]{
 const out:TextRun[]=[];
 for(const run of runs){
  let text=run.text;
  while(text.length){
   const prev=out.at(-1);
   if(prev&&same(prev.style,run.style)&&prev.text.length<10000){
    let take=Math.min(10000-prev.text.length,text.length);
    if(take<text.length&&/[\uD800-\uDBFF]/.test(text[take-1]))take--;
    if(take>0){prev.text+=text.slice(0,take);text=text.slice(take);continue;}
   }
   let take=Math.min(10000,text.length);
   if(take<text.length&&/[\uD800-\uDBFF]/.test(text[take-1]))take--;
   out.push({text:text.slice(0,take),style:{...run.style}});text=text.slice(take);
  }
 }
 if(out.length>1000)throw new Error("Too many text runs");
 return out.length?out:[{text:"",style:{...fallback}}];
}
function boundary(text:string,index:number,end=false){
 let i=Math.max(0,Math.min(text.length,Math.trunc(Number.isFinite(index)?index:0)));
 if(i>0&&i<text.length&&/[\uD800-\uDBFF]/.test(text[i-1])&&/[\uDC00-\uDFFF]/.test(text[i]))i+=end?1:-1;
 return i;
}
export function normalizeRange(text:string,range:TextRange):TextRange{
 const a=Math.min(range.start,range.end),b=Math.max(range.start,range.end);
 const start=boundary(text,a);return {start,end:a===b?start:boundary(text,b,true)};
}
function sliceRuns(runs:readonly TextRun[],start:number,end:number):TextRun[]{
 let cursor=0;const out:TextRun[]=[];
 for(const r of runs){const next=cursor+r.text.length;const a=Math.max(0,start-cursor),b=Math.min(r.text.length,end-cursor);if(b>a)out.push({text:r.text.slice(a,b),style:r.style});cursor=next;}
 return out;
}
export function styleAt(runs:readonly TextRun[],offset:number):TextStyle{
 let cursor=0;
 for(const r of runs){cursor+=r.text.length;if(offset<=cursor)return {...r.style};}
 return {...runs[runs.length-1].style};
}
export function formatRange(runs:readonly TextRun[],range:TextRange,patch:Partial<TextStyle>):TextRun[]{
 const text=plainText(runs),{start,end}=normalizeRange(text,range),fallback={...styleAt(runs,start),...patch};
 if(start===end)return text.length?normalizeRuns(runs,fallback):[{text:"",style:fallback}];
 return normalizeRuns([...sliceRuns(runs,0,start),...sliceRuns(runs,start,end).map(r=>({...r,style:{...r.style,...patch}})),...sliceRuns(runs,end,text.length)],fallback);
}
export function sanitizePlainText(text:string):string{return text.replace(/\r\n?/g,"\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,"");}
export function replaceRange(runs:readonly TextRun[],range:TextRange,insert:string,style?:TextStyle):TextRun[]{
 const text=plainText(runs),{start,end}=normalizeRange(text,range),fallback=style??styleAt(runs,start);
 return normalizeRuns([...sliceRuns(runs,0,start),{text:sanitizePlainText(insert),style:fallback},...sliceRuns(runs,end,text.length)],fallback);
}
/** Native textarea provides IME, clipboard and caret. Convert its new value to one contiguous splice. */
export function reconcileText(runs:readonly TextRun[],next:string,style?:TextStyle):TextRun[]{
 const before=plainText(runs),after=sanitizePlainText(next);
 if(before===after)return normalizeRuns(runs,runs[0].style);
 let start=0;while(start<before.length&&start<after.length&&before[start]===after[start])start++;
 start=boundary(before,start);
 let end=before.length,afterEnd=after.length;
 while(end>start&&afterEnd>start&&before[end-1]===after[afterEnd-1]){end--;afterEnd--;}
 if(end<before.length&&end>0&&/[\uD800-\uDBFF]/.test(before[end-1])){end++;afterEnd++;}
 return replaceRange(runs,{start,end},after.slice(start,afterEnd),style);
}
export function rangeStyle(runs:readonly TextRun[],range:TextRange):TextStyle{
 const {start,end}=normalizeRange(plainText(runs),range);
 return end>start?(sliceRuns(runs,start,end)[0]?.style??styleAt(runs,start)):styleAt(runs,start);
}
