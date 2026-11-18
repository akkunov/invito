"use client";
import {createRoot} from "react-dom/client";
import {flushSync} from "react-dom";
import {StudioV2Artboard} from "./studio-v2-artboard";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema.ts";
import {bindDocument} from "@/features/studio-v2/core/invitation-behavior.ts";
import {resolveStyleDocument} from "@/features/studio-v2/core/style-tokens.ts";
import {layoutDocument} from "@/features/studio-v2/core/layout-engine.ts";
import {readMedia} from "@/features/studio-v2/browser/media-store.ts";
import {printSize,pngWithDpi,rasterPdf,type PrintDpi} from "@/features/studio-v2/core/print-output.ts";

function dataUrl(blob:Blob):Promise<string>{return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});}
function toBlob(canvas:HTMLCanvasElement):Promise<Blob>{return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error("Не удалось закодировать PNG")),"image/png"));}
const nextFrame=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
async function embedImages(source:HTMLElement,clone:HTMLElement){
 const original=Array.from(source.querySelectorAll("img")),copies=Array.from(clone.querySelectorAll("img"));
 for(let i=0;i<original.length;i++){
  const image=original[i],copy=copies[i],url=image.currentSrc||image.src;
  if(!url)throw Error("Отсутствует изображение");
  const res=await fetch(url);if(!res.ok)throw Error("Не удалось получить изображение: "+image.alt);
  const blob=await res.blob();if(!["image/png","image/jpeg","image/webp"].includes(blob.type))throw Error("Неподдерживаемый ресурс: "+image.alt);
  copy.removeAttribute("srcset");copy.removeAttribute("sizes");copy.removeAttribute("loading");copy.setAttribute("src",await dataUrl(blob));
 }
}
function inlineTree(source:HTMLElement,clone:HTMLElement){
 const sources=[source,...Array.from(source.querySelectorAll<HTMLElement>("*"))],copies=[clone,...Array.from(clone.querySelectorAll<HTMLElement>("*"))];
 for(let i=0;i<sources.length;i++){
  const a=sources[i],c=copies[i],style=getComputedStyle(a);
  if(!c.style)continue;
  // A detached XML clone must not depend on application stylesheets or external font URLs.
  for(let j=0;j<style.length;j++){
   const property=style[j],value=style.getPropertyValue(property);
   if(value&&!value.includes("url("))c.style.setProperty(property,value);
  }
  c.style.setProperty("animation","none");c.style.setProperty("transition","none");
  if(a instanceof HTMLInputElement){c.setAttribute("value",a.value);if(a.checked)c.setAttribute("checked","");else c.removeAttribute("checked");}
  if(a instanceof HTMLSelectElement)Array.from(c.querySelectorAll("option")).forEach((o,j)=>{if(j===a.selectedIndex)o.setAttribute("selected","");else o.removeAttribute("selected");});
 }
}
async function renderPrintCanvas<T extends {pixelWidth:number;pixelHeight:number}>(source:ProjectDocumentV2,pageId:string,dimensions:(width:number,height:number)=>T):Promise<{canvas:HTMLCanvasElement;size:T}>{
 const page=source.pages.find(p=>p.id===pageId);if(!page)throw Error("Страница не найдена");
 const host=document.createElement("div");host.className="v2-print-capture";
 Object.assign(host.style,{position:"fixed",left:"-100000px",top:"0",pointerEvents:"none",zIndex:"-1",overflow:"visible"});
 (document.querySelector(".studio-v2")??document.body).append(host);
 const reactRoot=createRoot(host),urls:Record<string,string>={};
 let rendered:HTMLElement|null=null;
 try{
  const keys=new Set(Object.values(source.assets).map(a=>a.storageKey).filter(k=>k.startsWith("local:")));
  for(const key of keys){const blob=await readMedia(key);if(!blob)throw Error("Недоступен локальный ресурс: "+key);urls[key]=URL.createObjectURL(blob);}
  const base=resolveStyleDocument(bindDocument(source)),measurements:Record<string,number>={};
  let resolved=layoutDocument(base,measurements),previous="";
  for(let pass=0;pass<6;pass++){
   flushSync(()=>reactRoot.render(<StudioV2Artboard document={resolved} rootNodeId={page.rootNodeId} mediaUrls={urls} guest={{mode:"studio"}} onMeasure={(id,height)=>{measurements[id]=height;}}/>));
   await document.fonts.ready;await nextFrame();
   const signature=JSON.stringify(measurements);if(signature===previous)break;previous=signature;resolved=layoutDocument(base,measurements);
  }
  rendered=host.querySelector<HTMLElement>(".studio-v2-artboard-content");if(!rendered)throw Error("Не удалось отобразить страницу");
  const width=rendered.offsetWidth,height=rendered.offsetHeight;if(!width||!height)throw Error("Пустой артборд");
  const size=dimensions(width,height),{pixelWidth,pixelHeight}=size;
  if(!Number.isInteger(pixelWidth)||!Number.isInteger(pixelHeight)||pixelWidth<1||pixelHeight<1||pixelWidth>10000||pixelHeight>10000||pixelWidth*pixelHeight>32_000_000)throw Error("Недопустимый размер экспорта");
  for(const img of Array.from(rendered.querySelectorAll("img"))){img.loading="eager";await img.decode();if(!img.naturalWidth)throw Error("Изображение не загрузилось: "+img.alt);}
  const clone=rendered.cloneNode(true) as HTMLElement;inlineTree(rendered,clone);await embedImages(rendered,clone);
  clone.setAttribute("xmlns","http://www.w3.org/1999/xhtml");clone.style.margin="0";clone.style.overflow="hidden";
  const markup=new XMLSerializer().serializeToString(clone);
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+pixelWidth+'" height="'+pixelHeight+'" viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none"><foreignObject x="0" y="0" width="'+width+'" height="'+height+'">'+markup+'</foreignObject></svg>';
  const img=new window.Image();img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);await img.decode();
  const canvas=document.createElement("canvas");canvas.width=pixelWidth;canvas.height=pixelHeight;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)throw Error("Canvas недоступен");
  ctx.fillStyle="#FFFFFF";ctx.fillRect(0,0,pixelWidth,pixelHeight);ctx.drawImage(img,0,0,pixelWidth,pixelHeight);
  // Reject a tainted surface before handing it to either export path.
  ctx.getImageData(0,0,1,1);return {canvas,size};
 }finally{reactRoot.unmount();host.remove();Object.values(urls).forEach(URL.revokeObjectURL);}
}
export async function exportPrintPage(source:ProjectDocumentV2,pageId:string,widthMm:number,dpi:PrintDpi,format:"png"|"pdf"){
 const {canvas,size}=await renderPrintCanvas(source,pageId,(width,height)=>printSize(width,height,widthMm,dpi));
 try{
  if(format==="png"){const png=new Uint8Array(await (await toBlob(canvas)).arrayBuffer());return new Blob([pngWithDpi(png,dpi).slice().buffer],{type:"image/png"});}
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas недоступен");
  const rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data,rgb=new Uint8Array(canvas.width*canvas.height*3);
  for(let i=0,j=0;i<rgba.length;i+=4){rgb[j++]=rgba[i];rgb[j++]=rgba[i+1];rgb[j++]=rgba[i+2];}
  const deflated=new Uint8Array(await new Response(new Blob([rgb]).stream().pipeThrough(new CompressionStream("deflate"))).arrayBuffer());
  return new Blob([rasterPdf(deflated,size).slice().buffer],{type:"application/pdf"});
 }finally{canvas.width=0;canvas.height=0;}
}
export async function generateCover(source:ProjectDocumentV2,pageId:string){
 const {canvas}=await renderPrintCanvas(source,pageId,(width,height)=>{const scale=Math.min(800/width,1200/height);return {pixelWidth:Math.max(1,Math.round(width*scale)),pixelHeight:Math.max(1,Math.round(height*scale))};});
 try{return await toBlob(canvas);}finally{canvas.width=0;canvas.height=0;}
}
export function downloadOutput(blob:Blob,name:string,extension:string){
 const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=(name.replace(/[\\/:*?"<>|]/g,"-").slice(0,100)||"invito")+"."+extension;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1500);
}
