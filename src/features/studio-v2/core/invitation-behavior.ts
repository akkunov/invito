import type {ProjectDocumentV2,ProjectNodeV2} from "./document.schema.ts";
import type {BindingValue,InvitationBlock,RsvpInput} from "./invitation.schema.ts";
import {rsvpInputSchema} from "./invitation.schema.ts";
export type WidgetNode=Extract<ProjectNodeV2,{type:"widget"}>;
export type BlockKind=InvitationBlock["kind"];
export type Locale=ProjectDocumentV2["locale"];
export const BLOCK_NAMES:Record<BlockKind,{ru:string;ky:string}>={rsvp:{ru:"Подтверждение участия",ky:"Катышууну ырастоо"},countdown:{ru:"До торжества",ky:"Тойго чейин"},location:{ru:"Место встречи",ky:"Өтчү жер"},gallery:{ru:"Фотогалерея",ky:"Сүрөттөр"},music:{ru:"Музыка",ky:"Музыка"},schedule:{ru:"Программа",ky:"Программа"}};
export function bindingText(value:BindingValue,locale:Locale):string{
 switch(value.type){
  case "text":return value.value[locale];
  case "date":return new Intl.DateTimeFormat(locale==="ky"?"ky-KG":"ru-RU",{dateStyle:"long",timeZone:"Asia/Bishkek"}).format(new Date(value.value));
  case "number":return new Intl.NumberFormat(locale==="ky"?"ky-KG":"ru-RU").format(value.value);
  case "boolean":return value.value?(locale==="ky"?"Ооба":"Да"):(locale==="ky"?"Жок":"Нет");
 }
}
export function bindDocument(doc:ProjectDocumentV2):ProjectDocumentV2{
 const nodes={...doc.nodes};
 for(const [id,n] of Object.entries(nodes)){
  if(n.type==="text"&&n.bindingKey&&doc.values?.[n.bindingKey]){
   const value=bindingText(doc.values[n.bindingKey],doc.locale);
   nodes[id]={...n,runs:[{text:value,style:{...n.runs[0].style}}]};
  }
 }
 return {...doc,nodes};
}
export function countdownTarget(doc:ProjectDocumentV2,b:Extract<InvitationBlock,{kind:"countdown"}>){
 const v=b.targetKey?doc.values?.[b.targetKey]:null;return v?.type==="date"?v.value:b.target;
}
export function locationAddress(doc:ProjectDocumentV2,b:Extract<InvitationBlock,{kind:"location"}>){
 const v=b.addressKey?doc.values?.[b.addressKey]:null;return v?.type==="text"?v.value[doc.locale]:b.address[doc.locale];
}
export function countdownParts(target:string,now:number){
 let seconds=Math.max(0,Math.ceil((Date.parse(target)-now)/1000));if(!Number.isFinite(seconds))seconds=0;
 return {days:Math.floor(seconds/86400),hours:Math.floor(seconds%86400/3600),minutes:Math.floor(seconds%3600/60),seconds:seconds%60};
}
export function mapUrl(address:string){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(address.trim());}
export function validateRsvp(input:unknown,maxGuests:number):RsvpInput{
 const value=rsvpInputSchema.parse(input);if(value.guests>maxGuests)throw Error("Guest limit exceeded");return value;
}
/** Preview never calls a transport; live requires a supplied, authenticated-at-server adapter. */
export type GuestMode={mode:"studio"}|{mode:"preview"}|{mode:"live";submitRsvp?:(nodeId:string,input:RsvpInput)=>Promise<void>};
export async function submitGuestResponse(mode:GuestMode,nodeId:string,input:unknown,maxGuests:number,deadline:string|null,now=Date.now()){
 if(deadline&&now>=Date.parse(deadline))throw Error("RSVP closed");
 const value=validateRsvp(input,maxGuests);
 if(mode.mode==="preview")return "preview" as const;
 if(mode.mode!=="live"||!mode.submitRsvp)throw Error("RSVP unavailable");
 await mode.submitRsvp(nodeId,value);return "sent" as const;
}
export function createWidget(kind:BlockKind,id:string,parentId:string,width:number,now=Date.now()):WidgetNode{
 const title=BLOCK_NAMES[kind];const target=new Date(now+30*86400000).toISOString();
 const blocks:Record<BlockKind,InvitationBlock>={
 rsvp:{kind:"rsvp",title,deadline:null,maxGuests:2},
 countdown:{kind:"countdown",title,target,targetKey:null},
 location:{kind:"location",title,address:{ru:"",ky:""},addressKey:null},
 gallery:{kind:"gallery",title,assetIds:[]},
 music:{kind:"music",title,source:""},
 schedule:{kind:"schedule",title,items:[{time:"16:00",label:{ru:"Сбор гостей",ky:"Конокторду тосуу"}},{time:"17:00",label:{ru:"Начало торжества",ky:"Тойдун башталышы"}}]},
 };
 return {type:"widget",id,parentId,x:24,y:24,width,height:kind==="rsvp"?440:kind==="gallery"?420:kind==="schedule"?360:240,rotation:0,opacity:1,visible:true,locked:false,block:blocks[kind],appearance:{fontFamily:"sans",fontSize:Math.max(18,Math.min(36,Math.round(width/20))),color:"#263329",background:"transparent",accent:"#263329"}};
}
