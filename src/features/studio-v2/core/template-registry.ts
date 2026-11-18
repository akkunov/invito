import {z} from "zod";
import {projectDocumentSchema,parseProjectV2,type ProjectDocumentV2} from "./document.schema.ts";
const id=z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);
export const templateCategories=["wedding","kyz-uzatuu","birthday","anniversary","corporate","other"] as const;
export const templateMetaSchema=z.strictObject({
 name:z.string().trim().min(1).max(100),
 category:z.enum(templateCategories),
 description:z.string().trim().max(1000),
 tags:z.array(z.string().trim().min(1).max(40)).max(12),
 coverPageId:id,
 status:z.enum(["draft","ready"])
});
export const templateVersionSchema=z.strictObject({number:z.number().int().positive(),createdAt:z.string().datetime(),note:z.string().max(300),document:projectDocumentSchema});
export const templateRecordSchema=z.strictObject({
 id,meta:templateMetaSchema,createdAt:z.string().datetime(),updatedAt:z.string().datetime(),
 versions:z.array(templateVersionSchema).min(1).max(50)
}).superRefine((t,ctx)=>{
 for(const [i,v] of t.versions.entries())if(v.number!==i+1)ctx.addIssue({code:"custom",path:["versions",i,"number"],message:"Versions must be consecutive"});
 if(!t.versions.at(-1)?.document.pages.some(p=>p.id===t.meta.coverPageId))ctx.addIssue({code:"custom",path:["meta","coverPageId"],message:"Cover page missing from latest version"});
});
export type TemplateMeta=z.infer<typeof templateMetaSchema>;
export type TemplateRecord=z.infer<typeof templateRecordSchema>;
export type TemplateVersion=z.infer<typeof templateVersionSchema>;
export function templateDocument(t:TemplateRecord){return t.versions[t.versions.length-1].document;}
/** Snapshot retains only authored state. A new workspace ID avoids replacing the source project. */
export function forkTemplateDocument(doc:ProjectDocumentV2,projectId:string):ProjectDocumentV2{
 return parseProjectV2({...structuredClone(doc),id:projectId,revision:0});
}
export function createTemplate(id:string,meta:TemplateMeta,document:ProjectDocumentV2,now:string):TemplateRecord{
 return templateRecordSchema.parse({id,meta,createdAt:now,updatedAt:now,versions:[{number:1,createdAt:now,note:"Initial snapshot",document:forkTemplateDocument(document,id)}]});
}
export function appendTemplateVersion(record:TemplateRecord,document:ProjectDocumentV2,note:string,now:string):TemplateRecord{
 const t=templateRecordSchema.parse(record);
 const cover=t.meta.coverPageId;
 return templateRecordSchema.parse({...t,meta:{...t.meta,coverPageId:document.pages.some(p=>p.id===cover)?cover:document.pages[0].id,status:"draft"},updatedAt:now,versions:[...t.versions,{number:t.versions.length+1,createdAt:now,note,document:forkTemplateDocument(document,t.id)}]});
}
export function restoreTemplateVersion(record:TemplateRecord,number:number,now:string){
 const v=record.versions.find(v=>v.number===number);if(!v)throw Error("Version not found");
 return appendTemplateVersion(record,v.document,"Restore v"+number,now);
}
export function duplicateTemplate(record:TemplateRecord,id:string,now:string){
 return createTemplate(id,{...record.meta,name:(record.meta.name.slice(0,90)+" — копия").slice(0,100),status:"draft"},templateDocument(record),now);
}
export function filterTemplates(records:readonly TemplateRecord[],query:string,category:string,status:string){
 const q=query.trim().toLocaleLowerCase();
 return records.filter(t=>(!category||t.meta.category===category)&&(!status||t.meta.status===status)&&(!q||[t.meta.name,t.meta.description,...t.meta.tags].join(" ").toLocaleLowerCase().includes(q))).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||a.id.localeCompare(b.id));
}
export function updateTemplateMeta(record:TemplateRecord,meta:TemplateMeta,now:string){return templateRecordSchema.parse({...record,meta,updatedAt:now});}
