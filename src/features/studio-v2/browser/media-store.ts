import {boundedSize,detectImage,MAX_UPLOAD_BYTES,SVG_ELEMENTS,SVG_ATTRIBUTES,safeSvgAttribute,validateSvgSource} from "../core/media-policy.ts";
import {parseProjectV2,type ProjectDocumentV2} from "../core/document.schema.ts";
import type {Asset} from "../core/component-engine.ts";
const DB="invito-studio-v2-local";
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
 const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{req.result.createObjectStore("media");req.result.createObjectStore("projects");};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error("Local storage blocked"));
});}
async function request<T>(store:"media"|"projects",mode:IDBTransactionMode,action:(s:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
 const db=await database();
 try{return await new Promise<T>((resolve,reject)=>{
  const tx=db.transaction(store,mode),req=action(tx.objectStore(store));
  tx.oncomplete=()=>resolve(req.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??Error("Storage transaction aborted"));req.onerror=()=>reject(req.error);
 });}finally{db.close();}
}
export async function storeMedia(key:string,blob:Blob){await request("media","readwrite",s=>s.put(blob,key));}
export async function readMedia(key:string):Promise<Blob|null>{return (await request("media","readonly",s=>s.get(key)))??null;}
export async function saveLocalProject(doc:ProjectDocumentV2){await request("projects","readwrite",s=>s.put(parseProjectV2(doc),doc.id));}
export async function loadLocalProject(id:string):Promise<ProjectDocumentV2|null>{const value=await request("projects","readonly",s=>s.get(id));return value?parseProjectV2(value):null;}
export function sanitizeSvg(source:string):string{
 validateSvgSource(source);
 const doc=new DOMParser().parseFromString(source,"image/svg+xml"),root=doc.documentElement;
 if(root.localName!=="svg"||root.namespaceURI!=="http://www.w3.org/2000/svg"||doc.querySelector("parsererror"))throw Error("Invalid SVG");
 const all=[root,...Array.from(root.querySelectorAll("*"))];
 if(all.length>3000)throw Error("SVG too complex");
 for(const el of all){
  if(el.namespaceURI!=="http://www.w3.org/2000/svg"||!SVG_ELEMENTS.has(el.localName))throw Error("Unsupported SVG element");
  for(const attr of Array.from(el.attributes))if(!safeSvgAttribute(attr.name,attr.value))throw Error("Unsupported SVG attribute");
 }
 const box=root.getAttribute("viewBox")?.trim().split(/[ ,]+/).map(Number);
 const dimension=(name:string,fallback:number)=>{const raw=root.getAttribute(name);return raw&&/^\d+(?:\.\d+)?(?:px)?$/.test(raw)?parseFloat(raw):fallback;};
 const size=boundedSize(dimension("width",box?.length===4?box[2]:1024),dimension("height",box?.length===4?box[3]:1024));
 if(!root.hasAttribute("viewBox"))root.setAttribute("viewBox","0 0 "+dimension("width",1024)+" "+dimension("height",1024));
 root.setAttribute("width",String(size.width));root.setAttribute("height",String(size.height));
 return new XMLSerializer().serializeToString(root);
}
export async function importImage(file:File,folder=""):Promise<Asset>{
 if(!file.size||file.size>MAX_UPLOAD_BYTES)throw Error("Файл должен быть не больше 20 МБ");
 const bytes=new Uint8Array(await file.arrayBuffer()),mime=detectImage(bytes);
 if(!mime)throw Error("Поддерживаются PNG, JPEG, WebP и безопасный SVG");
 const blob=mime==="image/svg+xml"?new Blob([sanitizeSvg(new TextDecoder().decode(bytes))],{type:mime}):new Blob([bytes],{type:mime});
 const bitmap=await createImageBitmap(blob);
 try{
  const size=boundedSize(bitmap.width,bitmap.height);
  const canvas=document.createElement("canvas");canvas.width=size.width;canvas.height=size.height;
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas unavailable");
  ctx.drawImage(bitmap,0,0,size.width,size.height);
  const result=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("Image encoding failed")),"image/png"));
  if(result.size>50_000_000)throw Error("Encoded image too large");
  const id="asset-"+crypto.randomUUID(),storageKey="local:"+id;
  await storeMedia(storageKey,result);
  return {id,storageKey,mimeType:"image/png",name:file.name.slice(0,200)||"Изображение",sizeBytes:result.size,pixelWidth:size.width,pixelHeight:size.height,folder:folder.slice(0,80)};
 }finally{bitmap.close();}
}
