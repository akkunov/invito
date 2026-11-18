import type {ProjectDocumentV2} from "./document.schema.ts";
import {parseProjectV2,mediaAssetRefSchema} from "./document.schema.ts";
import {personalizationSchema,personalizationPatchSchema,type PersonalizationContract,type EditableField,type PersonalizedValue} from "./personalization.schema.ts";
import {noteOverrides} from "./linked-components.ts";
type Asset=ProjectDocumentV2["assets"][string];
type Issue={fieldId:string;message:string};
const own=(obj:object,key:string)=>Object.prototype.hasOwnProperty.call(obj,key);
function indexBy<T extends {id:string}>(items:readonly T[]){return new Map(items.map(item=>[item.id,item]));}
/** Designer-approved bindings must actually map to authored content, not arbitrary variable names. */
export function bindingIsUsed(doc:ProjectDocumentV2,key:string){
 return Object.values(doc.nodes).some(n=>n.type==="text"?n.bindingKey===key:n.type==="widget"&&(n.block.kind==="location"?n.block.addressKey===key:n.block.kind==="countdown"&&n.block.targetKey===key));
}
export function contractIssues(doc:ProjectDocumentV2,contract:PersonalizationContract):Issue[]{
 const issues:Issue[]=[];const add=(f:EditableField,message:string)=>issues.push({fieldId:f.id,message});
 for(const f of contract.fields){
  if("key" in f){if(!own(doc.variables,f.key)||doc.variables[f.key].type!==f.kind||!bindingIsUsed(doc,f.key))add(f,"Переменная отсутствует, не используется или имеет другой тип");continue;}
  if(f.kind==="theme"){if(f.themeIds.some(id=>!own(doc.themes??{},id)))add(f,"Тема отсутствует");continue;}
  const node=own(doc.nodes,f.nodeId)?doc.nodes[f.nodeId]:undefined;
  if(!node||(f.kind==="image"?node.type!=="image":node.type!=="widget"||node.block.kind!==f.kind))add(f,"Слой отсутствует или изменил тип");
 }
 return issues;
}
export function readPersonalizedValue(doc:ProjectDocumentV2,f:EditableField):PersonalizedValue|undefined{
 if("key" in f){const value=doc.values?.[f.key];return value?{kind:"binding",value:structuredClone(value)}:undefined;}
 if(f.kind==="theme")return {kind:"theme",themeId:doc.activeThemeId??null};
 const n=doc.nodes[f.nodeId];if(!n)return;
 if(f.kind==="image"&&n.type==="image")return {kind:"image",assetId:n.assetId};
 if(n.type!=="widget")return;
 const b=n.block;
 switch(b.kind){
  case "gallery":return {kind:"gallery",assetIds:[...b.assetIds]};
  case "schedule":return {kind:"schedule",items:structuredClone(b.items)};
  case "music":return {kind:"music",source:b.source};
  case "rsvp":return {kind:"rsvp",deadline:b.deadline,maxGuests:b.maxGuests};
 }
}
function invalid(message:string):never{throw Error(message);}
function checkValue(f:EditableField,v:PersonalizedValue,doc:ProjectDocumentV2,locales:readonly ("ru"|"ky")[],complete:boolean){
 const reject=(msg:string)=>invalid(f.id+": "+msg);
 const asset=(id:string)=>{const a=own(doc.assets,id)?doc.assets[id]:undefined;if(!a)reject("Ресурс не разрешён или не найден");return a;};
 const requiredText=(value:{ru:string;ky:string})=>{if(complete&&f.required&&locales.some(l=>!value[l].trim()))reject("Заполните обязательные языки");};
 if("key" in f){
  if(v.kind!=="binding"||v.value.type!==f.kind)return reject("Неверный тип значения");
  if(v.value.type==="text"&&f.kind==="text"){const value=v.value.value;if(Object.values(value).some(s=>s.length>f.maxLength||!f.multiline&&/[\r\n]/.test(s)))reject("Превышено ограничение текста");requiredText(value);}
  if(v.value.type==="number"&&f.kind==="number"&&(v.value.value<f.min||v.value.value>f.max))reject("Число вне диапазона");
  return;
 }
 switch(f.kind){
  case "image":{if(v.kind!=="image")return reject("Неверный тип");const a=asset(v.assetId);if((a.pixelWidth??0)<f.minWidth||(a.pixelHeight??0)<f.minHeight)reject("Недостаточное разрешение фото");break;}
  case "gallery":if(v.kind!=="gallery")return reject("Неверный тип");if(v.assetIds.length>f.maxPhotos||complete&&f.required&&!v.assetIds.length)reject("Недопустимое количество фото");v.assetIds.forEach(asset);break;
  case "schedule":if(v.kind!=="schedule")return reject("Неверный тип");if(v.items.length>f.maxItems||complete&&f.required&&!v.items.length)reject("Недопустимое количество событий");for(const item of v.items)requiredText(item.label);break;
  case "music":if(v.kind!=="music")return reject("Неверный тип");if(v.source&&!f.sources.includes(v.source)||complete&&f.required&&!v.source)reject("Музыка не входит в разрешённый список");break;
  case "rsvp":if(v.kind!=="rsvp")return reject("Неверный тип");if(v.maxGuests>f.maxGuests)reject("Превышен лимит гостей");break;
  case "theme":if(v.kind!=="theme")return reject("Неверный тип");if(v.themeId===null?!f.allowBase:!f.themeIds.includes(v.themeId))reject("Тема не разрешена");break;
 }
}
export function personalizationIssues(doc:ProjectDocumentV2,contract:PersonalizationContract):Issue[]{
 const issues=contractIssues(doc,contract);
 if(!contract.locales.includes(doc.locale))issues.push({fieldId:"locale",message:"Язык не разрешён"});
 for(const f of contract.fields){
  try{const value=readPersonalizedValue(doc,f);if(value)checkValue(f,value,doc,contract.locales,true);else if(f.required)invalid("Обязательное значение отсутствует");}catch(e){issues.push({fieldId:f.id,message:e instanceof Error?e.message:"Неверное значение"});}
 }
 return issues;
}
/** Trusted design snapshot + restricted customer values -> derived document.
 * Asset descriptors are supplied by a trusted upload/storage adapter, NEVER taken from the patch.
 * A locked layer protects geometry in Studio; explicit field permission may change its content.
 */
export function personalizeDocument(source:ProjectDocumentV2,rawContract:unknown,rawPatch:unknown,uploadedAssets:readonly Asset[]=[]):ProjectDocumentV2{
 const base=parseProjectV2(source),contract=personalizationSchema.parse(rawContract),patch=personalizationPatchSchema.parse(rawPatch),fields=indexBy(contract.fields);
 const problems=contractIssues(base,contract);if(problems.length)invalid("Invalid personalization contract: "+problems[0].fieldId);
 const doc=structuredClone(base);
 if(patch.locale!==undefined){if(!contract.locales.includes(patch.locale))invalid("Locale not allowed");doc.locale=patch.locale;}
 else if(!contract.locales.includes(doc.locale))invalid("Locale not allowed");
 const used=new Set<string>();
 for(const v of Object.values(patch.values)){if(v.kind==="image")used.add(v.assetId);if(v.kind==="gallery")v.assetIds.forEach(id=>used.add(id));}
 for(const raw of uploadedAssets){const a=mediaAssetRefSchema.parse(raw);if(!used.has(a.id)||own(doc.assets,a.id))invalid("Unexpected or colliding uploaded asset");if(a.mimeType==="image/svg+xml"||!a.pixelWidth||!a.pixelHeight||!a.sizeBytes||!a.storageKey.startsWith("local:"))invalid("Unverified uploaded image");doc.assets[a.id]=a;}
 for(const [id,v] of Object.entries(patch.values)){
  const f=fields.get(id);if(!f)invalid("Field not allowed: "+id);
  checkValue(f,v,doc,contract.locales,false);
  if("key" in f&&v.kind==="binding"){doc.values??={};doc.values[f.key]=structuredClone(v.value);continue;}
  if(f.kind==="theme"&&v.kind==="theme"){doc.activeThemeId=v.themeId;continue;}
  if(!("nodeId" in f))invalid("Invalid target");
  const node=doc.nodes[f.nodeId];
  if(f.kind==="image"&&v.kind==="image"&&node.type==="image"){
   // Existing image box, focal point, crop, visual effects, locks and typography stay intact.
   node.assetId=v.assetId;
  }else if(node.type==="widget"){
   const b=node.block;
   if(f.kind==="gallery"&&v.kind==="gallery"&&b.kind==="gallery")b.assetIds=[...v.assetIds];
   else if(f.kind==="schedule"&&v.kind==="schedule"&&b.kind==="schedule")b.items=structuredClone(v.items);
   else if(f.kind==="music"&&v.kind==="music"&&b.kind==="music")b.source=v.source;
   else if(f.kind==="rsvp"&&v.kind==="rsvp"&&b.kind==="rsvp"){b.deadline=v.deadline;b.maxGuests=v.maxGuests;}
   else invalid("Invalid widget field");
  }else invalid("Invalid field target");
 }
 // Preserve explicit local content overrides for materialized linked instances.
 noteOverrides(base,doc);
 return parseProjectV2(doc);
}
