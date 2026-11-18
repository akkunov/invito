import {z} from "zod";
import {projectDocumentSchema,parseProjectV2} from "../core/document.schema.ts";
import {createTemplate,templateMetaSchema,templateDocument,type TemplateRecord} from "../core/template-registry.ts";
import {detectImage,rasterDimensions,boundedSize} from "../core/media-policy.ts";
import {readMedia,importLocalTemplate} from "./media-store.ts";
const MAX_BYTES=80_000_000;
const MAX_FILE_BYTES=115_000_000;
const packageSchema=z.strictObject({format:z.literal("invito-template"),version:z.literal(1),meta:templateMetaSchema,document:projectDocumentSchema,media:z.array(z.strictObject({assetId:z.string().max(80),data:z.string().max(70_000_000)})).max(200)});
function encode(blob:Blob):Promise<string>{return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});}
async function checkedRaster(blob:Blob){
 if(!blob.size||blob.size>50_000_000)throw Error("Недопустимый размер изображения");
 const bytes=new Uint8Array(await blob.arrayBuffer()),mime=detectImage(bytes);
 if(!mime||mime==="image/svg+xml")throw Error("В пакетах поддерживаются только PNG, JPEG, WebP. SVG сначала импортируйте в Studio.");
 const size=rasterDimensions(bytes,mime);boundedSize(size.width,size.height);
 // Decode in addition to checking the header, so broken files do not enter the registry.
 const bitmap=await createImageBitmap(new Blob([bytes],{type:mime}));
 try{boundedSize(bitmap.width,bitmap.height);return {blob:new Blob([bytes],{type:mime}),mime,width:bitmap.width,height:bitmap.height};}finally{bitmap.close();}
}
export async function exportTemplatePackage(record:TemplateRecord){
 const document=templateDocument(record),media:{assetId:string;data:string}[]=[];
 let total=0;
 for(const asset of Object.values(document.assets)){
  const blob=asset.storageKey.startsWith("local:")?await readMedia(asset.storageKey):await fetch((process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+asset.storageKey).then(r=>{if(!r.ok)throw Error("Ресурс недоступен: "+asset.name);return r.blob();});
  if(!blob)throw Error("Отсутствует ресурс: "+asset.name);
  total+=blob.size;if(total>MAX_BYTES)throw Error("Пакет превышает 80 МБ изображений");
  const checked=await checkedRaster(blob);media.push({assetId:asset.id,data:await encode(checked.blob)});
 }
 const json=JSON.stringify(packageSchema.parse({format:"invito-template",version:1,meta:record.meta,document,media}));
 const result=new Blob([json],{type:"application/json"});if(result.size>MAX_FILE_BYTES)throw Error("Пакет слишком большой");return result;
}
export async function importTemplatePackage(file:File):Promise<TemplateRecord>{
 if(!file.size||file.size>MAX_FILE_BYTES)throw Error("Недопустимый размер пакета");
 const pack=packageSchema.parse(JSON.parse(await file.text()));
 const document=structuredClone(pack.document),assets=document.assets,media=new Map<string,Blob>(),seen=new Set<string>();
 if(Object.keys(assets).length!==pack.media.length)throw Error("Неполный пакет ресурсов");
 let total=0;
 for(const entry of pack.media){
  const asset=assets[entry.assetId];if(!asset||seen.has(entry.assetId))throw Error("Повторный либо неизвестный ресурс");
  seen.add(entry.assetId);
  if(!/^[A-Za-z0-9+/]*={0,2}$/.test(entry.data)||entry.data.length%4!==0)throw Error("Повреждённый Base64");
  const binary=atob(entry.data);total+=binary.length;if(total>MAX_BYTES)throw Error("Пакет превышает 80 МБ изображений");
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0)),checked=await checkedRaster(new Blob([bytes]));
  const storageKey="local:package-"+crypto.randomUUID();
  assets[entry.assetId]={...asset,storageKey,mimeType:checked.mime,sizeBytes:checked.blob.size,pixelWidth:checked.width,pixelHeight:checked.height};
  media.set(storageKey,checked.blob);
 }
 const record=createTemplate("template-"+crypto.randomUUID(),{...pack.meta,status:"draft"},parseProjectV2(document),new Date().toISOString());
 await importLocalTemplate(record,media);return record;
}
export function downloadTemplatePackage(blob:Blob,name:string){
 const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=(name.replace(/[\\/:*?"<>|]/g,"-").slice(0,80)||"template")+".invito.json";link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
