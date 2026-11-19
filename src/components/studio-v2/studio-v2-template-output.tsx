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
import {professionalGeometry} from "@/features/studio-v2/core/professional-print.ts";
import {exportPrintPage,generateCover,downloadOutput,prepareProfessionalPrint,openVectorPrint} from "./studio-v2-print-renderer";
type Props={
  onBusy:(busy:boolean)=>void;
  record?:TemplateRecord;
  document?:ProjectDocumentV2;
  name?:string;
  selectedPageId?:string;
  onVariant?:(record:TemplateRecord)=>Promise<void>;
  onCover?:()=>void;
};
export function TemplateOutput({record,document:currentDocument,name:overrideName,selectedPageId,onVariant,onCover,onBusy}:Props){
 if(!record&&!currentDocument)throw new Error("PRINT_SOURCE_REQUIRED");
 const source=currentDocument??templateDocument(record!),doc=useMemo(()=>layoutDocument(resolveStyleDocument(bindDocument(source))),[source]);
 const name=overrideName??record?.meta.name??source.id;
 const [pageId,setPageId]=useState(selectedPageId??record?.meta.coverPageId??source.pages[0]?.id??""),[width,setWidth]=useState("105"),[preset,setPreset]=useState("a6"),[dpi,setDpi]=useState<PrintDpi>(300),[theme,setTheme]=useState("");
 const [bleed,setBleed]=useState("0");
 const controller=useRef<AbortController|null>(null);
 const [progress,setProgress]=useState<{done:number;total:number}|null>(null);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState(""),[issues,setIssues]=useState<PreflightIssue[]|null>(null);
 const page=doc.pages.find(p=>p.id===pageId)??doc.pages[0],root=doc.nodes[page.rootNodeId];
 let size:ReturnType<typeof printSize>|null=null;try{size=printSize(root.width,root.height,Number(width),dpi);}catch{/* inline feedback */}
 let professional:ReturnType<typeof professionalGeometry>|null=null;try{professional=professionalGeometry(root.width,root.height,Number(width),Number(bleed));}catch{/* inline feedback */}
 const warnings=size?printImageWarnings(source,page.id,Number(width),dpi):[];
 async function run(task:()=>Promise<void>){if(busy)return;setBusy(true);onBusy(true);setMessage("");setError("");setProgress(null);try{await task();}catch(e){if(e instanceof DOMException&&e.name==="AbortError")setMessage("Экспорт отменён.");else setError(e instanceof Error?e.message:"Не удалось подготовить файл.");}finally{controller.current=null;setProgress(null);setBusy(false);onBusy(false);}}
 return <div className="v2-template-output">
 <div className="v2-template-output-title"><StudioIcon name="check"/> <strong>{record?"Подготовка шаблона":"Экспорт текущего проекта"}</strong></div>
 {error&&<p role="alert" className="v2-inspector-error">{error}</p>}{message&&<p role="status" className="v2-template-message">{message}</p>}
 {busy&&controller.current&&<div className="v2-print-progress" aria-live="polite"><span>{progress?"Рендеринг: "+progress.done+" / "+progress.total:"Подготовка страницы…"}</span><progress max={progress?.total??1} value={progress?.done??0}/><button type="button" className="v2-inspector-button" onClick={()=>controller.current?.abort()}>Отменить экспорт</button></div>}
 <fieldset disabled={busy} className="v2-appearance-fieldset">
 {record&&<><button className="v2-inspector-button" onClick={()=>void run(async()=>{const result=await validateTemplateResources(record);setIssues(result);setMessage(result.some(i=>i.severity==="error")?"Есть ошибки подготовки.":"Структура и ресурсы проверены.");})}>Проверить готовность</button>
 {issues&&<div className="v2-preflight-report" aria-label="Результат проверки"><span>{issues.filter(i=>i.severity==="error").length} ошибок · {issues.filter(i=>i.severity==="warning").length} предупреждений</span>{issues.slice(0,40).map((i,index)=><p key={index} data-severity={i.severity}>{i.severity==="error"?"Ошибка":"Внимание"}: {i.message}{i.device?" · "+i.device:""}</p>)}{issues.length>40&&<p>Ещё {issues.length-40} замечаний</p>}</div>}
 <h3>Обложка каталога</h3>
 <button className="v2-inspector-button" onClick={()=>void run(async()=>{const blob=await generateCover(source,record.meta.coverPageId);await saveGeneratedCover(record,blob);onCover?.();setMessage("PNG-обложка обновлена.");})}>Сгенерировать обложку</button>
 <button className="v2-inspector-button" onClick={()=>void run(async()=>{downloadOutput(await generateCover(source,record.meta.coverPageId),name+"-cover","png");})}>Скачать обложку PNG</button>
 </>}
 <h3>Экспорт для печати</h3>
 <label className="v2-widget-field">Страница<select aria-label="Страница для печати" value={page.id} onChange={e=>setPageId(e.target.value)}>{doc.pages.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
 <label className="v2-widget-field">Размер<select aria-label="Размер печати" value={preset} onChange={e=>{setPreset(e.target.value);const p=PRINT_PRESETS.find(p=>p.id===e.target.value);if(p&&p.id!=="custom")setWidth(String(p.width));}}>{PRINT_PRESETS.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
 <div className="v2-type-grid"><label className="v2-widget-field">Ширина (мм)<input aria-label="Ширина печати" type="number" min={20} max={600} step=".1" value={width} onChange={e=>{setWidth(e.target.value);setPreset("custom");}}/></label><label className="v2-widget-field">DPI<select aria-label="DPI печати" value={dpi} onChange={e=>setDpi(Number(e.target.value) as PrintDpi)}>{PRINT_DPI.map(d=><option key={d}>{d}</option>)}</select></label></div>
 {dpi>=1200&&<p className="v2-placeholder">Высокое разрешение: экспорт по полосам. Максимум 200 Мп, 16 384 px по ширине и 32 768 px по высоте. Лучше выполнять на компьютере.</p>}
 {size?<p className="v2-print-size">{size.widthMm.toFixed(1)} × {size.heightMm.toFixed(1)} мм · {size.pixelWidth} × {size.pixelHeight} px</p>:<p className="v2-inspector-error">Размер превышает допустимые пределы. Уменьшите ширину или DPI.</p>}
 <p className="v2-placeholder">Пропорции страницы сохраняются. A6/A5 задают только ширину; высота рассчитывается по дизайну. Высота Auto Layout уточняется при экспорте.</p>
 {warnings.slice(0,8).map((w,i)=><p key={i} className="v2-print-warning">{w.message}</p>)}
 <div className="v2-print-actions">{(["png","pdf"] as const).map(format=><button key={format} className="v2-inspector-button" disabled={!size} onClick={()=>void run(async()=>{const abort=new AbortController();controller.current=abort;setProgress({done:0,total:1});const blob=await exportPrintPage(source,page.id,Number(width),dpi,format,{signal:abort.signal,onProgress:(done,total)=>setProgress({done,total})});abort.signal.throwIfAborted();downloadOutput(blob,name+"-"+page.name,format);setMessage(format.toUpperCase()+" подготовлен.");})}><StudioIcon name="download"/> {format.toUpperCase()}</button>)}</div>
 <p className="v2-placeholder">Статический RGB-экспорт. PDF содержит растровую страницу без CMYK, вылетов и редактируемого текста. Анимации и действия не выполняются.</p>
 <details className="v2-professional-print" open><summary><StudioIcon name="frame"/><strong>Professional Print</strong></summary>
 <p className="v2-placeholder">Векторный PDF использует печатный HTML, сохраняет текст и поддерживаемую графику без общей растеризации. Некоторые CSS-эффекты браузер может растрировать.</p>
 <label className="v2-widget-field">Вылеты внутрь макета (мм)<input aria-label="Вылеты печати" type="number" min={0} max={10} step=".5" value={bleed} onChange={e=>setBleed(e.target.value)}/></label>
 {professional?<div className="v2-print-size">Макет: {professional.widthMm.toFixed(2)} × {professional.heightMm.toFixed(2)} мм<br/>После обрезки: {professional.trimWidthMm.toFixed(2)} × {professional.trimHeightMm.toFixed(2)} мм</div>:<p className="v2-inspector-error">Недопустимый размер обрезки.</p>}
 <p className="v2-placeholder">Ширина выше — размер всего макета. Вылеты отнимаются с каждой стороны. Не увеличиваем фон автоматически: оставьте безопасное поле для текста и важных деталей.</p>
 <button className="v2-inspector-button" disabled={!professional} onClick={()=>void run(async()=>{const print=await prepareProfessionalPrint(source,page.id,Number(width),0,name+"-"+page.name);await openVectorPrint(print);setMessage("В диалоге печати выберите «Сохранить как PDF», без полей и колонтитулов.");})}><StudioIcon name="download"/> Векторный PDF (печать)</button>
 <button className="v2-inspector-button" disabled={!professional} onClick={()=>void run(async()=>{const print=await prepareProfessionalPrint(source,page.id,Number(width),Number(bleed),name+"-"+page.name);downloadOutput(new Blob([JSON.stringify(print)],{type:"application/json"}),name+"-"+page.name,"invito-print.json");setMessage("Печатный пакет подготовлен.");})}><StudioIcon name="download"/> Пакет для CMYK / PDF/X-4</button>
 <p className="v2-placeholder">Конвертация CMYK и PDF/X-4 — локальной утилитой с ICC-профилем принтера. Вылеты записываются в PDF/X-4 при конвертации, не в браузерном PDF. Для PDF/X-4 обязателен независимый preflight. Автоматического преобразования на GitHub Pages нет.</p>
 </details>
 {record&&<><h3>Варианты оформления</h3>
 <label className="v2-widget-field">Тема<select aria-label="Тема нового варианта" value={theme} onChange={e=>setTheme(e.target.value)}><option value="">Базовая</option>{Object.values(source.themes??{}).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
 <button className="v2-inspector-button" onClick={()=>void run(async()=>{await onVariant?.(createThemeVariant(record,theme||null,"template-"+crypto.randomUUID(),new Date().toISOString()));setMessage("Вариант создан.");})}><StudioIcon name="copy"/> Создать вариант из темы</button></>}
 </fieldset>
 </div>;
}
