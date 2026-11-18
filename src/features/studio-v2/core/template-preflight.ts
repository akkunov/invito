import {parseProjectV2,type ProjectDocumentV2} from "./document.schema.ts";
import {bindDocument,locationAddress} from "./invitation-behavior.ts";
import {resolveStyleDocument} from "./style-tokens.ts";
import {layoutDocument} from "./layout-engine.ts";
import {responsiveDocument,type Device} from "./responsive-engine.ts";
export type PreflightIssue={severity:"error"|"warning";code:string;message:string;nodeId?:string;pageId?:string;device?:Device};
export function templatePreflight(source:ProjectDocumentV2,coverPageId:string,available?:ReadonlySet<string>):PreflightIssue[]{
 const doc=parseProjectV2(source),issues:PreflightIssue[]=[];
 const add=(severity:PreflightIssue["severity"],code:string,message:string,extra:Partial<PreflightIssue>={})=>issues.push({severity,code,message,...extra});
 const cover=doc.pages.find(p=>p.id===coverPageId);
 if(!cover||!doc.nodes[cover.rootNodeId]?.visible)add("error","cover","Обложка отсутствует или скрыта");
 for(const a of Object.values(doc.assets))if(available&&!available.has(a.storageKey))add("error","resource","Не найден ресурс: "+a.name);
 const styled=resolveStyleDocument(bindDocument(doc));
 for(const page of doc.pages){
  const root=doc.nodes[page.rootNodeId];if(root.type!=="frame")continue;
  if(!root.children.some(id=>doc.nodes[id]?.visible))add(page.id===coverPageId?"error":"warning","empty-page","Пустая страница: "+page.name,{pageId:page.id});
 }
 for(const n of Object.values(doc.nodes)){
  if(!n.visible)continue;
  if(n.type==="text"&&n.bindingKey&&!doc.values?.[n.bindingKey])add("warning","binding","Переменная без значения: "+n.bindingKey,{nodeId:n.id});
  if(n.type==="text"&&!n.runs.some(r=>r.text.trim())&&!n.bindingKey)add("warning","empty-text","Пустой текстовый слой",{nodeId:n.id});
  if(n.type==="widget"){
   const b=n.block;
   if(b.kind==="location"&&(["ru","ky"] as const).some(locale=>!locationAddress({...doc,locale},b).trim()))add("warning","location","Адрес не заполнен для обоих языков",{nodeId:n.id});
   if(b.kind==="gallery"&&!b.assetIds.length)add("warning","gallery","Галерея без фотографий",{nodeId:n.id});
   if(b.kind==="music"&&!b.source)add("warning","music","Музыка не настроена",{nodeId:n.id});
   if(b.kind==="schedule"&&!b.items.length)add("warning","schedule","Программа без событий",{nodeId:n.id});
  }
 }
 for(const device of ["desktop","tablet","mobile"] as const){
  const resolved=responsiveDocument(styled,device);
  for(const n of Object.values(resolved.nodes)){
   if(!n.visible||!n.parentId||n.rotation)continue;
   const parent=resolved.nodes[n.parentId];if(parent?.type!=="frame"||!parent.visible||!parent.clip)continue;
   if(n.x<-.5||n.y<-.5||n.x+n.width>parent.width+.5||n.y+n.height>parent.height+.5)add("warning","overflow","Слой может обрезаться: "+(n.layerName??n.id),{nodeId:n.id,device});
  }
 }
 return issues;
}
/** Estimated source pixel density for visible image layers, before any manual translation. */
export function printImageWarnings(source:ProjectDocumentV2,pageId:string,widthMm:number,dpi:number):PreflightIssue[]{
 const doc=layoutDocument(resolveStyleDocument(bindDocument(source))),page=doc.pages.find(p=>p.id===pageId);if(!page)return [];
 const root=doc.nodes[page.rootNodeId],mmPerUnit=widthMm/root.width,issues:PreflightIssue[]=[];
 function visit(id:string){
  const n=doc.nodes[id];if(!n?.visible)return;
  if(n.type==="frame")n.children.forEach(visit);
  if(n.type!=="image")return;
  const a=doc.assets[n.assetId];if(!a?.pixelWidth||!a.pixelHeight){issues.push({severity:"warning",code:"unknown-resolution",message:"Размер исходника неизвестен: "+(a?.name??id),nodeId:id});return;}
  const zoom=n.visual?.imageCrop?.zoom??1;
  const unitsPerPixel=(n.fit==="cover"?Math.max(n.width/a.pixelWidth,n.height/a.pixelHeight):Math.min(n.width/a.pixelWidth,n.height/a.pixelHeight))*zoom;
  const actual=Math.round(25.4/(unitsPerPixel*mmPerUnit));
  if(actual<dpi*.9)issues.push({severity:"warning",code:"low-resolution",message:a.name+": примерно "+actual+" DPI при выбранном размере",nodeId:id});
 }
 visit(root.id);return issues;
}
