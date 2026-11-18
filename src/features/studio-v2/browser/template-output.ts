import type {TemplateRecord} from "../core/template-registry.ts";
import {templateDocument} from "../core/template-registry.ts";
import {templatePreflight} from "../core/template-preflight.ts";
import {readMedia,storeMedia} from "./media-store.ts";
export function coverStorageKey(record:TemplateRecord){
 return "local:cover-"+record.id+"-v"+record.versions.length+"-"+record.meta.coverPageId;
}
export async function validateTemplateResources(record:TemplateRecord){
 const doc=templateDocument(record),available=new Set<string>();
 for(const key of new Set(Object.values(doc.assets).map(a=>a.storageKey))){
  try{
   if(key.startsWith("local:")){const blob=await readMedia(key);if(blob?.size)available.add(key);}
   else {const response=await fetch((process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+key,{method:"HEAD"});if(response.ok&&response.headers.get("content-type")?.startsWith("image/"))available.add(key);}
  }catch{/* missing asset is reported below */}
 }
 return templatePreflight(doc,record.meta.coverPageId,available);
}
export async function saveGeneratedCover(record:TemplateRecord,blob:Blob){
 if(blob.type!=="image/png"||!blob.size)throw Error("Invalid cover");
 await storeMedia(coverStorageKey(record),blob);
}
