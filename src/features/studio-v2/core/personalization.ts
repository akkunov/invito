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
 if(contract.sectionEditing){
  const all=new Set(doc.pages.map(page=>page.id));
  for(const pageId of [...contract.sectionEditing.hideablePageIds,...contract.sectionEditing.reorderablePageIds,...(contract.sectionEditing.renameablePageIds??[])]){
   if(!all.has(pageId))issues.push({fieldId:"sections",message:"Раздел для настройки отсутствует: "+pageId});
  }
 }

 for(const f of contract.fields){
  if("key" in f){if(!own(doc.variables,f.key)||doc.variables[f.key].type!==f.kind||!bindingIsUsed(doc,f.key))add(f,"Переменная отсутствует, не используется или имеет другой тип");continue;}
  if(f.kind==="theme"){if(f.themeIds.some(id=>!own(doc.themes??{},id)))add(f,"Тема отсутствует");continue;}
  const node=own(doc.nodes,f.nodeId)?doc.nodes[f.nodeId]:undefined;
  if(!node||(f.kind==="image"?node.type!=="image":f.kind==="textStyle"?node.type!=="text":node.type!=="widget"||node.block.kind!==f.kind))add(f,"Слой отсутствует или изменил тип");
 }
 return issues;
}
export function readPersonalizedValue(doc:ProjectDocumentV2,f:EditableField):PersonalizedValue|undefined{
 if("key" in f){const value=doc.values?.[f.key];return value?{kind:"binding",value:structuredClone(value)}:undefined;}
 if(f.kind==="theme")return {kind:"theme",themeId:doc.activeThemeId??null};
 const n=doc.nodes[f.nodeId];if(!n)return;
 if(f.kind==="image"&&n.type==="image")return {kind:"image",assetId:n.assetId};
 if(f.kind==="textStyle"&&n.type==="text"){
  const style=n.runs[0]?.style;
  if(!style)return;
  return {kind:"textStyle",fontFamily:style.fontFamily,fontSize:style.fontSize,fontWeight:style.fontWeight,color:style.color,textAlign:n.textAlign,...(f.allowItalic?{italic:style.italic}:{}),...(f.allowUnderline?{underline:style.underline}:{}),...(f.lineHeightRange?{lineHeight:n.lineHeight??1.2}:{}),...(f.letterSpacingRange?{letterSpacing:n.letterSpacing??0}:{})};
 }
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
 const asset=(id:string)=>{const a=own(doc.assets,id)?doc.assets[id]:undefined;if(!a)return reject("Ресурс не разрешён или не найден");return a;};
 const requiredText=(value:{ru:string;ky:string})=>{if(complete&&f.required&&locales.some(l=>!value[l].trim()))reject("Заполните обязательные языки");};
 if("key" in f){
  if(v.kind!=="binding"||v.value.type!==f.kind)return reject("Неверный тип значения");
  if(v.value.type==="text"&&f.kind==="text"){const value=v.value.value;if(Object.values(value).some(s=>s.length>f.maxLength||!f.multiline&&/[\r\n]/.test(s)))reject("Превышено ограничение текста");requiredText(value);}
  if(v.value.type==="number"&&f.kind==="number"&&(v.value.value<f.min||v.value.value>f.max))reject("Число вне диапазона");
  return;
 }
 switch(f.kind){
  case "textStyle":{
   if(v.kind!=="textStyle")return reject("Неверный тип");
   const original=doc.nodes[f.nodeId];
   if(v.fontSize<f.minFontSize||v.fontSize>f.maxFontSize||!f.allowedFonts.includes(v.fontFamily)||!f.allowedWeights.includes(v.fontWeight)||!f.allowedColors.some(color=>color.toLowerCase()===v.color.toLowerCase())&&!(original?.type==="text"&&original.runs[0]?.style.color.toLowerCase()===v.color.toLowerCase()))reject("Стиль текста не разрешён автором");
   if(v.italic!==undefined&&!f.allowItalic||v.underline!==undefined&&!f.allowUnderline)reject("Начертание не разрешено");
   if(v.lineHeight!==undefined&&(!f.lineHeightRange||v.lineHeight<f.lineHeightRange.min||v.lineHeight>f.lineHeightRange.max))reject("Межстрочный интервал вне диапазона");
   if(v.letterSpacing!==undefined&&(!f.letterSpacingRange||v.letterSpacing<f.letterSpacingRange.min||v.letterSpacing>f.letterSpacingRange.max))reject("Межбуквенный интервал вне диапазона");
   break;
  }
  case "image":{if(v.kind!=="image")return reject("Неверный тип");const a=asset(v.assetId);if((a.pixelWidth??1)<f.minWidth||(a.pixelHeight??1)<f.minHeight)reject("Недостаточное разрешение фото");break;}
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
export function personalizeDocument(source:ProjectDocumentV2,rawContract:unknown,rawPatch:unknown,uploadedAssets:readonly Asset[]=[],trustedCloudAssets=false):ProjectDocumentV2{
 const base=parseProjectV2(source),contract=personalizationSchema.parse(rawContract),patch=personalizationPatchSchema.parse(rawPatch),fields=indexBy(contract.fields);
 const problems=contractIssues(base,contract);if(problems.length)invalid("Invalid personalization contract: "+problems[0].fieldId);
 const doc=structuredClone(base);
 if(patch.locale!==undefined){if(!contract.locales.includes(patch.locale))invalid("Locale not allowed");doc.locale=patch.locale;}
 else if(!contract.locales.includes(doc.locale))invalid("Locale not allowed");
 const used=new Set<string>();
 for(const v of Object.values(patch.values)){if(v.kind==="image")used.add(v.assetId);if(v.kind==="gallery")v.assetIds.forEach(id=>used.add(id));}
 for(const raw of uploadedAssets){const a=mediaAssetRefSchema.parse(raw);if(!used.has(a.id)||own(doc.assets,a.id))invalid("Unexpected or colliding uploaded asset");if(a.mimeType==="image/svg+xml"||!a.pixelWidth||!a.pixelHeight||!a.sizeBytes||!(a.storageKey.startsWith("local:")||trustedCloudAssets&&/^asset:[0-9a-f-]{36}$/i.test(a.storageKey)))invalid("Unverified uploaded image");doc.assets[a.id]=a;}
 for(const [id,v] of Object.entries(patch.values)){
  const f=fields.get(id);if(!f)invalid("Field not allowed: "+id);
  checkValue(f,v,doc,contract.locales,false);
  if("key" in f&&v.kind==="binding"){doc.values??={};doc.values[f.key]=structuredClone(v.value);continue;}
  if(f.kind==="theme"&&v.kind==="theme"){doc.activeThemeId=v.themeId;continue;}
  if(f.kind==="textStyle"&&v.kind==="textStyle"){
   const node=doc.nodes[f.nodeId];
   if(node.type!=="text")invalid("Invalid text style target");
   node.runs=node.runs.map(run=>({...run,style:{...run.style,fontFamily:v.fontFamily,fontSize:v.fontSize,fontWeight:v.fontWeight,color:v.color,italic:v.italic??run.style.italic,underline:v.underline??run.style.underline}}));
   node.textAlign=v.textAlign;
   if(v.lineHeight!==undefined)node.lineHeight=v.lineHeight;
   if(v.letterSpacing!==undefined)node.letterSpacing=v.letterSpacing;
   // Explicit per-text color permission outranks the template theme token for this node only.
   if(node.tokenRefs)delete node.tokenRefs.textColor;
   continue;
  }
  if(!("nodeId" in f))return invalid("Invalid target");
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
 if(patch.sections){
  const allowed=contract.sectionEditing;
  if(!allowed)invalid("Section editing is not permitted by this template");
  const sourceIds=base.pages.map(page=>page.id);
  const order=patch.sections.order,hidden=patch.sections.hidden;
  if(order.length!==sourceIds.length||new Set(order).size!==sourceIds.length||
      sourceIds.some(id=>!order.includes(id)))invalid("Invalid section order");
  const movable=new Set(allowed.reorderablePageIds),hideable=new Set(allowed.hideablePageIds);
  // Non-movable pages remain at their original index: clients cannot move the cover or RSVP.
  for(let i=0;i<sourceIds.length;i++){
    if(!movable.has(sourceIds[i])&&order[i]!==sourceIds[i])invalid("Section order is locked: "+sourceIds[i]);
  }
  if(hidden.some(id=>!hideable.has(id)))invalid("Section cannot be hidden");
  if(hidden.length>=sourceIds.length)invalid("At least one section must remain visible");
  const byId=new Map(doc.pages.map(page=>[page.id,page]));
  doc.pages=order.map(id=>byId.get(id)!);
  for(const [id,name] of Object.entries(patch.sections.names??{})){
    if(!allowed.renameablePageIds?.includes(id)||!byId.has(id))invalid("Section name is locked");
    byId.get(id)!.name=name;
  }
  for(const id of hidden){
    const page=byId.get(id)!;
    const root=doc.nodes[page.rootNodeId];
    if(root)root.visible=false;
  }
 }
 // Preserve explicit local content overrides for materialized linked instances.
 noteOverrides(base,doc);
 return parseProjectV2(doc);
}

/** Candidates are opt-in: merely discovering a binding or image does not grant permission. */
export function editableCandidates(doc:ProjectDocumentV2):EditableField[]{
 const fields:EditableField[]=[];
 let index=0;const common=(ru:string,ky:string,section:EditableField["section"])=>({id:"field-"+(++index),label:{ru:ru.slice(0,100),ky:ky.slice(0,100)},section,required:false});
 for(const [key,v] of Object.entries(doc.variables)){
  if(!bindingIsUsed(doc,key))continue;
  const c=common(v.label.ru||key,v.label.ky||key,v.type==="date"?"date":"main");
  if(v.type==="text")fields.push({...c,kind:"text",key,maxLength:120,multiline:false});
  if(v.type==="date")fields.push({...c,kind:"date",key});
  if(v.type==="number")fields.push({...c,kind:"number",key,min:0,max:1000000});
  if(v.type==="boolean")fields.push({...c,kind:"boolean",key});
 }
 for(const n of Object.values(doc.nodes)){
  if(n.type==="image"){fields.push({...common(n.layerName??doc.assets[n.assetId]?.name??"Фото","Сүрөт","photos"),kind:"image",nodeId:n.id,minWidth:1,minHeight:1});continue;}
  if(n.type!=="widget")continue;const b=n.block,c=(section:EditableField["section"])=>common(b.title.ru||b.kind,b.title.ky||b.kind,section);
  if(b.kind==="gallery")fields.push({...c("photos"),kind:"gallery",nodeId:n.id,maxPhotos:4});
  if(b.kind==="schedule")fields.push({...c("schedule"),kind:"schedule",nodeId:n.id,maxItems:20});
  if(b.kind==="music")fields.push({...c("music"),kind:"music",nodeId:n.id,sources:b.source?[b.source]:[]});
  if(b.kind==="rsvp")fields.push({...c("rsvp"),kind:"rsvp",nodeId:n.id,maxGuests:b.maxGuests});
 }
 const themeIds=Object.keys(doc.themes??{});if(themeIds.length)fields.push({...common("Оформление","Жасалгалоо","appearance"),kind:"theme",themeIds,allowBase:true});
 return fields;
}
export function fieldTarget(f:EditableField){return "key" in f?"binding:"+f.key:"nodeId" in f?"node:"+f.nodeId:"theme";}

/** Revalidate the derived snapshot before publish; draft editing permits incomplete required fields. */
export function finalizePersonalization(source:ProjectDocumentV2,contract:PersonalizationContract,patch:unknown,assets:readonly Asset[]=[],trustedCloudAssets=false){const doc=personalizeDocument(source,contract,patch,assets,trustedCloudAssets);const issues=personalizationIssues(doc,contract);if(issues.length)throw Error(issues.map(i=>i.message).join("; "));return doc;}
