"use client";
import {ChevronDown, Menu} from "lucide-react";
import {useId,useCallback,useEffect,useMemo,useRef,useState} from "react";
import {isHeritagePresentation,layoutCollection,layoutHeritagePresentation} from "@/features/studio-v2/core/heritage-layout.ts";
import {resolveStyleDocument} from "@/features/studio-v2/core/style-tokens.ts";
import {bindDocument,type GuestMode} from "@/features/studio-v2/core/invitation-behavior.ts";
import type {MotionPlayback} from "./use-studio-motion";
import {StudioV2Artboard} from "./studio-v2-artboard";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema.ts";
import {deviceForWidth,responsiveDocument,presentationSize,DEVICE_WIDTH,type Device} from "@/features/studio-v2/core/responsive-engine.ts";

/** Shared presentation renderer. The editor uses the same Artboard and layout solver.
 * Public publishing can provide a validated immutable snapshot and asset URL map later. */
export function StudioV2ProjectRenderer({document,mediaUrls,device="auto",pageFilter,guest={mode:"preview"},motionPlayback={mode:"live"}}:{document:ProjectDocumentV2;mediaUrls?:Readonly<Record<string,string>>;device?:Device|"auto";pageFilter?:string;guest?:GuestMode;motionPlayback?:MotionPlayback}){
 const sectionId=useId();
 const menu=useRef<HTMLDetailsElement>(null);
 const container=useRef<HTMLDivElement>(null);
 const [width,setWidth]=useState(390);
 const [measured,setMeasured]=useState<Partial<Record<Device,Record<string,number>>>>({});
 const actual=device==="auto"?deviceForWidth(width):device;
 useEffect(()=>{const el=container.current;if(!el)return;const update=()=>setWidth(Math.max(1,el.clientWidth));update();const observer=new ResizeObserver(update);observer.observe(el);return()=>observer.disconnect();},[]);
 const measure=useCallback((id:string,height:number)=>setMeasured(old=>old[actual]?.[id]===height?old:{...old,[actual]:{...old[actual],[id]:height}}),[actual]);
 const gilded=document.presentation==="gilded";
 const alpine=document.presentation==="alpine";
 const felt=document.presentation==="felt";
 const heritage=isHeritagePresentation(document.presentation);
 const collection=document.presentation==="collection";
 const available=device==="auto"?width:Math.min(width,DEVICE_WIDTH[actual]);
 const resolved=useMemo(()=>{
  const bound=resolveStyleDocument(bindDocument(document));
  const measurements=measured[actual]??{};
  if(collection)return layoutCollection(bound,available,measurements);
  return heritage
   ?layoutHeritagePresentation(responsiveDocument(bound,actual),width,measurements)
   :responsiveDocument(bound,actual,measurements);
 },[document,actual,measured,heritage,width,collection,available]);
 const editorial=document.presentation==="editorial";
 const pages=document.pages.filter(page=>(!pageFilter||page.id===pageFilter)&&resolved.nodes[page.rootNodeId].visible);
 const rsvpPage=collection?pages.find(page=>{
  const root=resolved.nodes[page.rootNodeId];
  return root.type==="frame"&&root.children.some(id=>{
   const child=resolved.nodes[id];
   return child.visible&&child.type==="widget"&&child.block.kind==="rsvp";
  });
 }):undefined;
 const initials=document.values?.coupleNames;
 const navigationLabels:Record<string,string>=document.locale==="ky"?{
  cover:"Чакыруу",invitation:"Чакыруу жана тойдун программасы",countdown:"Тойго чейин",program:"Тойдун программасы",gallery:"Галерея",
  venue:"Той өтүүчү жер",rsvpPage:"Катышууну ырастоо",
 }:{};
 const monogram=initials?.type==="text"
  ?initials.value[document.locale].trim().split(/\s+/).filter(Boolean).filter((_,index,words)=>index===0||index===words.length-1).map(word=>Array.from(word)[0]).join(" / ")
  :"";
 return <div ref={container} className="v2-project-renderer" lang={document.locale} data-presentation={document.presentation} style={{width:"100%",minWidth:0,overflowX:heritage?"clip":undefined}}>
  <div style={{width:"100%",maxWidth:available,margin:"0 auto"}}>
   {editorial&&!pageFilter&&pages.length>0&&<header className="v2-editorial-header" style={{width:Math.min(available,presentationSize(document,resolved,pages[0],actual).width)}}>
    <span>{monogram}</span>
    <details ref={menu}>
     <summary aria-label={document.locale==="ru"?"Разделы приглашения":"Чакыруу бөлүмдөрү"}><Menu size={18}/></summary>
     <nav>{pages.map(page=><a key={page.id} href={`#${sectionId}-${page.id}`} onClick={()=>{if(menu.current)menu.current.open=false;}}>{navigationLabels[page.id]??page.name}</a>)}</nav>
    </details>
   </header>}
   {pages.map((page,index)=>{
    const size=presentationSize(document,resolved,page,actual);
    const scale=collection?1:heritage?Math.max(1,Math.min(available,500)/390):Math.min(1,available/size.width)*size.scale;
    const next=heritage&&page===document.pages[0]?pages[index+1]:undefined;
    const root=resolved.nodes[page.rootNodeId];
    return <section key={page.id} id={editorial||heritage||collection?`${sectionId}-${page.id}`:undefined} aria-label={editorial||heritage?navigationLabels[page.id]??page.name:page.name} data-preview-page={page.id} style={{position:"relative",margin:"0 auto",width:root.width*scale,maxWidth:heritage?"100%":undefined,height:root.height*scale,overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,transformOrigin:"top left",transform:collection?undefined:`scale(${scale})`}}>
       <StudioV2Artboard document={resolved} rootNodeId={page.rootNodeId} mediaUrls={mediaUrls} guest={guest} motionPlayback={guest.mode==="studio"?undefined:motionPlayback} onMeasure={measure}
         sectionLinks={collection?{
          next:pages[index+1]?`#${sectionId}-${pages[index+1].id}`:undefined,
          rsvp:rsvpPage?`#${sectionId}-${rsvpPage.id}`:undefined,
         }:undefined}/>
       {next&&<a href={`#${sectionId}-${next.id}`} className="v2-heritage-advance" style={{top:root.height-(felt?92:alpine?145:gilded?113:95)}} aria-label={document.locale==="ru"?"К следующему разделу":"Кийинки бөлүмгө"}><ChevronDown size={felt||alpine?24:gilded?22:20}/></a>}
      </div>
    </section>;
   })}
  </div>
 </div>;
}
