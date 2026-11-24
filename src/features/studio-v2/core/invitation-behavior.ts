import type {ProjectDocumentV2,ProjectNodeV2} from "./document.schema.ts";
import type {BindingValue,InvitationBlock,RsvpInput} from "./invitation.schema.ts";
import {rsvpInputSchema} from "./invitation.schema.ts";
export type WidgetNode=Extract<ProjectNodeV2,{type:"widget"}>;
export type BlockKind=InvitationBlock["kind"];
export type Locale=ProjectDocumentV2["locale"];
export const BLOCK_NAMES:Record<BlockKind,{ru:string;ky:string}>={sectionLink:{ru:"Переход к разделу",ky:"Бөлүмгө өтүү"},calendar:{ru:"Календарь",ky:"Жылнаама"},rsvp:{ru:"Подтверждение участия",ky:"Катышууну ырастоо"},countdown:{ru:"До торжества",ky:"Тойго чейин"},location:{ru:"Место встречи",ky:"Өтчү жер"},gallery:{ru:"Фотогалерея",ky:"Сүрөттөр"},music:{ru:"Музыка",ky:"Музыка"},schedule:{ru:"Программа",ky:"Программа"}};
export function bindingText(value:BindingValue,locale:Locale):string{
 switch(value.type){
  case "text":return value.value[locale];
  case "date":return new Intl.DateTimeFormat(locale==="ky"?"ky-KG":"ru-RU",{dateStyle:"long",timeZone:"Asia/Bishkek"}).format(new Date(value.value));
  case "number":return new Intl.NumberFormat(locale==="ky"?"ky-KG":"ru-RU").format(value.value);
  case "boolean":return value.value?(locale==="ky"?"Ооба":"Да"):(locale==="ky"?"Жок":"Нет");
 }
}
const editorialMonths={
 ru:["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],
 ky:["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"],
};
const editorialDateParts=new Intl.DateTimeFormat("en-US",{
 day:"numeric",month:"numeric",year:"numeric",timeZone:"Asia/Bishkek",
});
const kyrgyzDateMonths=["январы","февралы","марты","апрели","майы","июну","июлу","августу","сентябры","октябры","ноябры","декабры"];
function editorialDate(value:string,locale:Locale,longKyrgyz:boolean):string{
 const parts=editorialDateParts.formatToParts(new Date(value));
 const day=parts.find(part=>part.type==="day")?.value;
 const month=Number(parts.find(part=>part.type==="month")?.value);
 const year=parts.find(part=>part.type==="year")?.value;
 if(longKyrgyz)return `${year}-жылдын ${day}-${kyrgyzDateMonths[month-1]}`.toLocaleUpperCase(locale);
 return `${day}${locale==="ky"?"-":" "}${editorialMonths[locale][month-1]} ${year}`.toLocaleUpperCase(locale);
}
export function bindDocument(doc:ProjectDocumentV2):ProjectDocumentV2{
 const nodes={...doc.nodes};
 for(const [id,n] of Object.entries(nodes)){
  if(n.type==="text"&&n.bindingKey&&doc.values?.[n.bindingKey]){
   const binding=doc.values[n.bindingKey];
   const longKyrgyzDate=(doc.presentation==="alpine"||doc.presentation==="felt")&&doc.locale==="ky"&&binding.type==="date";
   const value=binding.type==="date"&&n.dateFormat
     ?formatEventDate(binding.value,doc.locale,n.dateFormat)
     :doc.presentation&&binding.type==="date"
     ?editorialDate(binding.value,doc.locale,longKyrgyzDate)
     :bindingText(binding,doc.locale);
   const style={...n.runs[0].style};
   if(longKyrgyzDate)style.fontSize=Math.min(style.fontSize,19);
   nodes[id]={...n,...(longKyrgyzDate?{letterSpacing:2}:{}),runs:[{text:value,style}]};
  }
 }
 return {...doc,nodes};
}
const calendarDateTime=new Intl.DateTimeFormat("en-GB",{
 timeZone:"Asia/Bishkek",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",hourCycle:"h23",
});
const weekdayNames={
 ru:["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"],
 ky:["Жекшемби","Дүйшөмбү","Шейшемби","Шаршемби","Бейшемби","Жума","Ишемби"],
};
export function formatEventDate(instant:string,locale:Locale,format:"date"|"numeric"|"weekday"|"time"|"date-time"):string {
 if(format==="date")return editorialDate(instant,locale,locale==="ky");
 const parts=Object.fromEntries(calendarDateTime.formatToParts(new Date(instant)).map(part=>[part.type,part.value]));
 if(format==="weekday")return weekdayNames[locale][new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day))).getUTCDay()];
 const date=`${parts.day}.${parts.month}.${parts.year}`;
 const time=`${parts.hour}:${parts.minute}`;
 return format==="time"?time:format==="date-time"?`${date} · ${time}`:date;
}
export function countdownTarget(doc:ProjectDocumentV2,b:Extract<InvitationBlock,{kind:"countdown"|"calendar"}>){
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
export type GuestMode={mode:"studio"}|{mode:"preview"}|{mode:"live";rsvpEnabled?:boolean;turnstileSiteKey?:string;submitRsvp?:(nodeId:string,input:RsvpInput,turnstileToken?:string,website?:string)=>Promise<void>};
export async function submitGuestResponse(mode:GuestMode,nodeId:string,input:unknown,maxGuests:number,deadline:string|null,now=Date.now(),turnstileToken?:string,website?:string){
 if(deadline&&now>=Date.parse(deadline))throw Error("RSVP closed");
 const value=validateRsvp(input,maxGuests);
 if(mode.mode==="preview")return "preview" as const;
 if(mode.mode!=="live"||!mode.submitRsvp)throw Error("RSVP unavailable");
 await mode.submitRsvp(nodeId,value,turnstileToken,website);return "sent" as const;
}
export function createWidget(kind:BlockKind,id:string,parentId:string,width:number,now=Date.now()):WidgetNode{
 const title=BLOCK_NAMES[kind];const target=new Date(now+30*86400000).toISOString();
 const blocks:Record<BlockKind,InvitationBlock>={
 rsvp:{kind:"rsvp",title,deadline:null,maxGuests:2},
  calendar:{kind:"calendar",title,target,targetKey:null,layout:"button"},
  sectionLink:{kind:"sectionLink",title,destination:"next",style:"outline"},
 countdown:{kind:"countdown",title,target,targetKey:null},
 location:{kind:"location",title,address:{ru:"",ky:""},addressKey:null},
 gallery:{kind:"gallery",title,assetIds:[]},
 music:{kind:"music",title,source:""},
 schedule:{kind:"schedule",title,items:[{time:"16:00",label:{ru:"Сбор гостей",ky:"Конокторду тосуу"}},{time:"17:00",label:{ru:"Начало торжества",ky:"Тойдун башталышы"}}]},
 };
 return {type:"widget",id,parentId,x:24,y:24,width,height:kind==="rsvp"?760:kind==="gallery"?560:kind==="schedule"?440:240,rotation:0,opacity:1,visible:true,locked:false,block:blocks[kind],appearance:{fontFamily:"sans",fontSize:Math.max(18,Math.min(48,Math.round(width/18))),color:"#263329",background:"transparent",accent:"#263329"}};
}
