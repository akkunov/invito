"use client";
import {useMemo,useRef,useState} from "react";
import {StudioIcon} from "./studio-icon";
import {templateDocument,createThemeVariant,type TemplateRecord} from "@/features/studio-v2/core/template-registry.ts";
import {layoutDocument} from "@/features/studio-v2/core/layout-engine.ts";
import {resolveStyleDocument} from "@/features/studio-v2/core/style-tokens.ts";
import {bindDocument} from "@/features/studio-v2/core/invitation-behavior.ts";
import {printImageWarnings,type PreflightIssue} from "@/features/studio-v2/core/template-preflight.ts";
import {PRINT_DPI,PRINT_PRESETS,printSize,type PrintDpi} from "@/features/studio-v2/core/print-output.ts";
import {validateTemplateResources,saveGeneratedCover} from "@/features/studio-v2/browser/template-output";
import {exportPrintPage,generateCover,downloadOutput} from "./studio-v2-print-renderer";
type Props={record:TemplateRecord;onVariant:(record:TemplateRecord)=>Promise<void>;onCover:()=>void;onBusy:(busy:boolean)=>void};
export function TemplateOutput({record,onVariant,onCover,onBusy}:Props){
 const source=templateDocument(record),doc=useMemo(()=>layoutDocument(resolveStyleDocument(bindDocument(source))),[source]);
 const [pageId,setPageId]=useState(record.meta.coverPageId),[width,setWidth]=useState("105"),[preset,setPreset]=useState("a6"),[dpi,setDpi]=useState<PrintDpi>(300),[theme,setTheme]=useState("");
 const controller=useRef<AbortController|null>(null);
 const [progress,setProgress]=useState<{done:number;total:number}|null>(null);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState(""),[issues,setIssues]=useState<PreflightIssue[]|null>(null);
 const page=doc.pages.find(p=>p.id===pageId)??doc.pages[0],root=doc.nodes[page.rootNodeId];
 let size:ReturnType<typeof printSize>|null=null;try{size=printSize(root.width,root.height,Number(width),dpi);}catch{/* inline feedback */}
 const warnings=size?printImageWarnings(source,page.id,Number(width),dpi):[];
 async function run(task:()=>Promise<void>){if(busy)return;setBusy(true);onBusy(true);setMessage("");setError("");setProgress(null);try{await task();}catch(e){if(e instanceof DOMException&&e.name==="AbortError")setMessage("Экспорт отменён.");else setError(e instanceof Error?e.message:"Не удалось подготовить файл.");}finally{controller.current=null;setProgress(null);setBusy(false);onBusy(false);}}
 return <div className="v2-template-output">
 <div className="v2-template-output-title"><StudioIcon name="check"/> <strong>Подготовка шаблона</strong></div>
 {error&&<p role="alert" className="v2-inspector-error">{error}</p>}{message&&<p role="status" className="v2-template-message">{message}</p>}
 {busy&&controller.current&&<div className="v2-print-progress" aria-live="polite"><span>{progress?"Рендеринг: "+progress.done+" / "+progress.total:"Подготовка страницы…"}</span><progress max={progress?.total??1} value={progress?.done??0}/><button type="button" className="v2-inspector-button" onClick={()=>controller.current?.abort()}>Отменить экспорт</button></div>}
 <fieldset disabled={busy} className="v2-appearance-fieldset">
 <button className="v2-inspector-button" onClick={()=>void run(async()=>{const result=await validateTemplateResources(record);setIssues(result);setMessage(result.some(i=>i.severity==="error")?"Есть ошибки подготовки.":"Структура и ресурсы проверены.");})}>Проверить готовность</button>
 {issues&&<div className="v2-preflight-report" aria-label="Результат проверки"><span>{issues.filter(i=>i.severity==="error").length} ошибок · {issues.filter(i=>i.severity==="warning").length} предупреждений</span>{issues.slice(0,40).map((i,index)=><p key={index} data-severity={i.severity}>{i.severity==="error"?"Ошибка":"Внимание"}: {i.message}{i.device?" · "+i.device:""}</p>)}{issues.length>40&&<p>Ещё {issues.length-40} замечаний</p>}</div>}
 <h3>Обложка каталога</h3>
 <button className="v2-inspector-button" onClick={()=>void run(async()=>{const blob=await generateCover(source,record.meta.coverPageId);await saveGeneratedCover(record,blob);onCover();setMessage("PNG-обложка обновлена.");})}>Сгенерировать обложку</button>
 <button className="v2-inspector-button" onClick={()=>void run(async()=>{downloadOutput(await generateCover(source,record.meta.coverPageId),record.meta.name+"-cover","png");})}>Скачать обложку PNG</button>
 <h3>Экспорт для печати</h3>
 <label className="v2-widget-field">Страница<select aria-label="Страница для печати" value={page.id} onChange={e=>setPageId(e.target.value)}>{doc.pages.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
 <label className="v2-widget-field">Размер<select aria-label="Размер печати" value={preset} onChange={e=>{setPreset(e.target.value);const p=PRINT_PRESETS.find(p=>p.id===e.target.value);if(p&&p.id!=="custom")setWidth(String(p.width));}}>{PRINT_PRESETS.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
 <div className="v2-type-grid"><label className="v2-widget-field">Ширина (мм)<input aria-label="Ширина печати" type="number" min={20} max={600} step=".1" value={width} onChange={e=>{setWidth(e.target.value);setPreset("custom");}}/></label><label className="v2-widget-field">DPI<select aria-label="DPI печати" value={dpi} onChange={e=>setDpi(Number(e.target.value) as PrintDpi)}>{PRINT_DPI.map(d=><option key={d}>{d}</option>)}</select></label></div>
 {dpi>=1200&&<p className="v2-placeholder">Высокое разрешение: экспорт по полосам. Максимум 200 Мп, 16 384 px по ширине и 32 768 px по высоте. Лучше выполнять на компьютере.</p>}
 {size?<p className="v2-print-size">{size.widthMm.toFixed(1)} × {size.heightMm.toFixed(1)} мм · {size.pixelWidth} × {size.pixelHeight} px</p>:<p className="v2-inspector-error">Размер превышает допустимые пределы. Уменьшите ширину или DPI.</p>}
 <p className="v2-placeholder">Пропорции страницы сохраняются. A6/A5 задают только ширину; высота рассчитывается по дизайну. Высота Auto Layout уточняется при экспорте.</p>
 {warnings.slice(0,8).map((w,i)=><p key={i} className="v2-print-warning">{w.message}</p>)}
 <div className="v2-print-actions">{(["png","pdf"] as const).map(format=><button key={format} className="v2-inspector-button" disabled={!size} onClick={()=>void run(async()=>{const abort=new AbortController();controller.current=abort;setProgress({done:0,total:1});const blob=await exportPrintPage(source,page.id,Number(width),dpi,format,{signal:abort.signal,onProgress:(done,total)=>setProgress({done,total})});abort.signal.throwIfAborted();downloadOutput(blob,record.meta.name+"-"+page.name,format);setMessage(format.toUpperCase()+" подготовлен.");})}><StudioIcon name="download"/> {format.toUpperCase()}</button>)}</div>
 <p className="v2-placeholder">Статический RGB-экспорт. PDF содержит растровую страницу без CMYK, вылетов и редактируемого текста. Анимации и действия не выполняются.</p>
 <h3>Варианты оформления</h3>
 <label className="v2-widget-field">Тема<select aria-label="Тема нового варианта" value={theme} onChange={e=>setTheme(e.target.value)}><option value="">Базовая</option>{Object.values(source.themes??{}).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
 <button className="v2-inspector-button" onClick={()=>void run(async()=>{await onVariant(createThemeVariant(record,theme||null,"template-"+crypto.randomUUID(),new Date().toISOString()));setMessage("Вариант создан.");})}><StudioIcon name="copy"/> Создать вариант из темы</button>
 </fieldset>
 </div>;
}
