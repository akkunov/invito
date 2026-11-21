"use client";
import {professionalPrintSource,type PrintSource} from "@/features/studio-v2/core/professional-print.ts";
import {createRoot} from "react-dom/client";
import {flushSync} from "react-dom";
import {StudioV2Artboard} from "./studio-v2-artboard";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema.ts";
import {bindDocument} from "@/features/studio-v2/core/invitation-behavior.ts";
import {resolveStyleDocument} from "@/features/studio-v2/core/style-tokens.ts";
import {layoutDocument} from "@/features/studio-v2/core/layout-engine.ts";
import {readMedia} from "@/features/studio-v2/browser/media-store.ts";
import {printSize,pngWithDpi,rasterPdf,printStrips,pngHeader,pngIdat,pngEnd,pngStripRows,stripedPdfParts,type PrintDpi,type PrintSize,type CompressedPrintStrip} from "@/features/studio-v2/core/print-output.ts";

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
async function preparePrintArtwork(source:ProjectDocumentV2,pageId:string):Promise<{markup:string;width:number;height:number}>{
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
  for(const img of Array.from(rendered.querySelectorAll("img"))){img.loading="eager";await img.decode();if(!img.naturalWidth)throw Error("Изображение не загрузилось: "+img.alt);}
  const clone=rendered.cloneNode(true) as HTMLElement;inlineTree(rendered,clone);await embedImages(rendered,clone);
  clone.setAttribute("xmlns","http://www.w3.org/1999/xhtml");clone.style.margin="0";clone.style.overflow="hidden";
  const markup=new XMLSerializer().serializeToString(clone);
  return {markup,width,height};
 }finally{reactRoot.unmount();host.remove();Object.values(urls).forEach(URL.revokeObjectURL);}
}
type Artwork=Awaited<ReturnType<typeof preparePrintArtwork>>;
async function rasterBand(art:Artwork,size:{pixelWidth:number;pixelHeight:number},y:number,height:number){
 const {markup,width,height:designHeight}=art,{pixelWidth,pixelHeight}=size;
 // Every band uses the same full-page coordinates and pixel grid, not a resized crop.
 const top=y*designHeight/pixelHeight,span=height*designHeight/pixelHeight;
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+pixelWidth+'" height="'+height+'" viewBox="0 '+top+' '+width+' '+span+'" preserveAspectRatio="none"><foreignObject x="0" y="0" width="'+width+'" height="'+designHeight+'">'+markup+'</foreignObject></svg>';
 const img=new window.Image();img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);await img.decode();
 const canvas=document.createElement("canvas");canvas.width=pixelWidth;canvas.height=height;
 const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)throw Error("Canvas недоступен");
 try{ctx.fillStyle="#FFFFFF";ctx.fillRect(0,0,pixelWidth,height);ctx.drawImage(img,0,0,pixelWidth,height);ctx.getImageData(0,0,1,1);return canvas;}
 catch(e){canvas.width=0;canvas.height=0;throw e;}
}
function pixels(canvas:HTMLCanvasElement){const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas недоступен");return ctx.getImageData(0,0,canvas.width,canvas.height).data;}
function rgbPixels(rgba:Uint8ClampedArray){const rgb=new Uint8Array(rgba.length/4*3);for(let i=0,j=0;i<rgba.length;i+=4){rgb[j++]=rgba[i];rgb[j++]=rgba[i+1];rgb[j++]=rgba[i+2];}return rgb;}
async function deflate(rgb:Uint8Array){return new Uint8Array(await new Response(new Blob([rgb.slice().buffer]).stream().pipeThrough(new CompressionStream("deflate"))).arrayBuffer());}
type PrintOptions={signal?:AbortSignal;onProgress?:(done:number,total:number)=>void};
const MAX_COMPRESSED_BYTES=256_000_000;
async function exportLargePage(art:Artwork,size:PrintSize,format:"png"|"pdf",options:PrintOptions):Promise<Blob>{
 const bands=printStrips(size);
 const check=()=>options.signal?.throwIfAborted();
 options.onProgress?.(0,bands.length);
 if(format==="pdf"){
  const compressed:CompressedPrintStrip[]=[];let bytes=0;
  for(const [index,band] of bands.entries()){
   check();const canvas=await rasterBand(art,size,band.y,band.height);
   try{check();const data=await deflate(rgbPixels(pixels(canvas)));bytes+=data.length;if(bytes>MAX_COMPRESSED_BYTES)throw Error("PDF слишком большой для браузерного экспорта.");compressed.push({...band,data});}finally{canvas.width=0;canvas.height=0;}
   check();options.onProgress?.(index+1,bands.length);await nextFrame();
  }
  return new Blob(stripedPdfParts(compressed,size).map(p=>p.slice().buffer),{type:"application/pdf"});
 }
 const stream=new CompressionStream("deflate"),writer=stream.writable.getWriter(),reader=stream.readable.getReader();
 const parts:BlobPart[]=[pngHeader(size).slice().buffer];let bytes=0;
 const collect=(async()=>{try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>MAX_COMPRESSED_BYTES)throw Error("PNG слишком большой для браузерного экспорта.");parts.push(pngIdat(value).slice().buffer);}}catch(e){await reader.cancel(e).catch(()=>{});throw e;}})();
 // Attach rejection handler immediately; errors propagate through the writer or await below.
 void collect.catch(()=>{});
 try{
  for(const [index,band] of bands.entries()){
   check();const canvas=await rasterBand(art,size,band.y,band.height);
   try{check();await writer.write(pngStripRows(pixels(canvas),size.pixelWidth,band.height));}finally{canvas.width=0;canvas.height=0;}
   check();options.onProgress?.(index+1,bands.length);await nextFrame();
  }
  await writer.close();await collect;parts.push(pngEnd().slice().buffer);return new Blob(parts,{type:"image/png"});
 }catch(e){await writer.abort(e).catch(()=>{});await collect.catch(()=>{});throw e;}
 finally{writer.releaseLock();reader.releaseLock();}
}
export async function exportPrintPage(source:ProjectDocumentV2,pageId:string,widthMm:number,dpi:PrintDpi,format:"png"|"pdf",options:PrintOptions={}){
 options.signal?.throwIfAborted();const art=await preparePrintArtwork(source,pageId),size=printSize(art.width,art.height,widthMm,dpi);options.signal?.throwIfAborted();
 if(size.pixelWidth*size.pixelHeight>8_000_000||size.pixelWidth>8192||size.pixelHeight>8192)return exportLargePage(art,size,format,options);
 const canvas=await rasterBand(art,size,0,size.pixelHeight);
 try{
  options.signal?.throwIfAborted();
  if(format==="png"){const png=new Uint8Array(await (await toBlob(canvas)).arrayBuffer());return new Blob([pngWithDpi(png,dpi).slice().buffer],{type:"image/png"});}
  return new Blob([rasterPdf(await deflate(rgbPixels(pixels(canvas))),size).slice().buffer],{type:"application/pdf"});
 }finally{canvas.width=0;canvas.height=0;}
}
export async function generateCover(source:ProjectDocumentV2,pageId:string){
 const art=await preparePrintArtwork(source,pageId),scale=Math.min(800/art.width,1200/art.height);
 const size={pixelWidth:Math.max(1,Math.round(art.width*scale)),pixelHeight:Math.max(1,Math.round(art.height*scale))},canvas=await rasterBand(art,size,0,size.pixelHeight);
 try{return await toBlob(canvas);}finally{canvas.width=0;canvas.height=0;}
}
export function downloadOutput(blob:Blob,name:string,extension:string){
 const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=(name.replace(/[\\/:*?"<>|]/g,"-").slice(0,100)||"invito")+"."+extension;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1500);
}

export async function prepareProfessionalPrint(source:ProjectDocumentV2,pageId:string,widthMm:number,bleedMm:number,title:string):Promise<PrintSource>{
 const artwork=await preparePrintArtwork(source,pageId);
 return professionalPrintSource(artwork,widthMm,bleedMm,title);
}
export async function openVectorPrint(source:PrintSource){
 const frame=document.createElement("iframe");frame.setAttribute("sandbox","allow-same-origin allow-modals");frame.setAttribute("title","Печать eventiq");Object.assign(frame.style,{position:"fixed",left:"-100000px",top:"0",width:source.geometry.widthMm+"mm",height:source.geometry.heightMm+"mm",border:"0"});
 const loaded=new Promise<void>((resolve,reject)=>{frame.onload=()=>resolve();frame.onerror=()=>reject(Error("Не удалось открыть печать"));});
 frame.srcdoc=source.html;document.body.append(frame);
 try{await loaded;const win=frame.contentWindow,doc=frame.contentDocument;if(!win||!doc)throw Error("Печать недоступна");
  await doc.fonts.ready;await Promise.all(Array.from(doc.images).map(img=>img.decode()));win.focus();
  // Keep the source alive until the print dialog closes, including engines where print is non-blocking.
  const dispose=()=>frame.remove();win.addEventListener("afterprint",dispose,{once:true});window.setTimeout(dispose,120000);win.print();
 }catch(e){frame.remove();throw e;}
}
