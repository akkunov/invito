import {z} from "zod";
import {bindingKeySchema,bindingValueSchema,instantSchema,musicSourceSchema} from "./invitation.schema.ts";
const id=z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);
const label=z.strictObject({ru:z.string().trim().min(1).max(100),ky:z.string().trim().min(1).max(100)});
const common=z.strictObject({id,label,section:z.enum(["main","date","photos","location","schedule","music","rsvp","appearance"]),required:z.boolean()});
const uniqueIds=z.array(id).max(20).refine(v=>new Set(v).size===v.length,"Duplicate IDs");
export const editableFieldSchema=z.discriminatedUnion("kind",[
 common.extend({kind:z.literal("text"),key:bindingKeySchema,maxLength:z.number().int().min(1).max(500),multiline:z.boolean()}),
 common.extend({kind:z.literal("date"),key:bindingKeySchema}),
 common.extend({kind:z.literal("number"),key:bindingKeySchema,min:z.number().finite(),max:z.number().finite()}),
 common.extend({kind:z.literal("boolean"),key:bindingKeySchema}),
 common.extend({kind:z.literal("image"),nodeId:id,minWidth:z.number().int().min(1).max(4096),minHeight:z.number().int().min(1).max(4096)}),
 common.extend({kind:z.literal("gallery"),nodeId:id,maxPhotos:z.number().int().min(1).max(4)}),
 common.extend({kind:z.literal("schedule"),nodeId:id,maxItems:z.number().int().min(1).max(20)}),
 common.extend({kind:z.literal("music"),nodeId:id,sources:z.array(musicSourceSchema).max(50).refine(v=>v.every(Boolean)&&new Set(v).size===v.length,"Invalid music choices")}),
 common.extend({kind:z.literal("rsvp"),nodeId:id,maxGuests:z.number().int().min(1).max(10)}),
 common.extend({kind:z.literal("theme"),themeIds:uniqueIds,allowBase:z.boolean()}),
]);
const distinctPageIds=z.array(id).max(30).refine(v=>new Set(v).size===v.length,"Duplicate page IDs");
export const sectionEditingSchema=z.strictObject({hideablePageIds:distinctPageIds,reorderablePageIds:distinctPageIds});
export const personalizationSchema=z.strictObject({version:z.literal(1),locales:z.array(z.enum(["ru","ky"])).min(1).max(2).refine(v=>new Set(v).size===v.length,"Duplicate locale"),fields:z.array(editableFieldSchema).max(100),sectionEditing:sectionEditingSchema.optional()}).superRefine((p,ctx)=>{
 const ids=new Set<string>(),targets=new Set<string>();
 for(const [i,f] of p.fields.entries()){
  const target="key" in f?"binding:"+f.key:"nodeId" in f?"node:"+f.nodeId:"theme";
  if(ids.has(f.id)||targets.has(target))ctx.addIssue({code:"custom",path:["fields",i],message:"Duplicate field or target"});
  if(f.kind==="number"&&f.min>f.max)ctx.addIssue({code:"custom",path:["fields",i],message:"Minimum exceeds maximum"});
  if(f.kind==="theme"&&!f.allowBase&&!f.themeIds.length)ctx.addIssue({code:"custom",path:["fields",i],message:"No theme choices"});
  if(f.kind==="music"&&!f.sources.length&&f.required)ctx.addIssue({code:"custom",path:["fields",i],message:"No music choices"});
  ids.add(f.id);targets.add(target);
 }
});
export type EditableField=z.infer<typeof editableFieldSchema>;
export type PersonalizationContract=z.infer<typeof personalizationSchema>;
// Client payload is deliberately smaller than StudioCommand. Never accepts node patches.
const scheduleItem=z.strictObject({time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),label:z.strictObject({ru:z.string().max(500),ky:z.string().max(500)})});
export const personalizedValueSchema=z.discriminatedUnion("kind",[
 z.strictObject({kind:z.literal("binding"),value:bindingValueSchema}),
 z.strictObject({kind:z.literal("image"),assetId:id}),
 z.strictObject({kind:z.literal("gallery"),assetIds:z.array(id).max(4).refine(v=>new Set(v).size===v.length,"Duplicate photos")}),
 z.strictObject({kind:z.literal("schedule"),items:z.array(scheduleItem).max(20)}),
 z.strictObject({kind:z.literal("music"),source:musicSourceSchema}),
 z.strictObject({kind:z.literal("rsvp"),deadline:instantSchema.nullable(),maxGuests:z.number().int().min(1).max(10)}),
 z.strictObject({kind:z.literal("theme"),themeId:id.nullable()}),
]);
export const personalizationPatchSchema=z.strictObject({locale:z.enum(["ru","ky"]).optional(),values:z.record(id,personalizedValueSchema).refine(v=>Object.keys(v).length<=100,"Too many values"),sections:z.strictObject({order:distinctPageIds.min(1),hidden:distinctPageIds}).optional()});
export type PersonalizedValue=z.infer<typeof personalizedValueSchema>;
export type PersonalizationPatch=z.infer<typeof personalizationPatchSchema>;
