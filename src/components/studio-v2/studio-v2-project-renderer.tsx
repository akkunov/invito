"use client";
import {Menu} from "lucide-react";
import {useId,useCallback,useEffect,useMemo,useRef,useState} from "react";
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
 const resolved=useMemo(()=>responsiveDocument(resolveStyleDocument(bindDocument(document)),actual,measured[actual]??{}),[document,actual,measured]);
 const editorial=document.presentation==="editorial";
 const pages=document.pages.filter(page=>(!pageFilter||page.id===pageFilter)&&resolved.nodes[page.rootNodeId].visible);
 const initials=document.values?.coupleNames;
 const navigationLabels:Record<string,string>=document.locale==="ky"?{
  cover:"Чакыруу",countdown:"Тойго чейин",program:"Тойдун программасы",gallery:"Галерея",
  venue:"Той өтүүчү жер",rsvpPage:"Катышууну ырастоо",
 }:{};
 const monogram=initials?.type==="text"
  ?initials.value[document.locale].trim().split(/\s+/).filter(Boolean).filter((_,index,words)=>index===0||index===words.length-1).map(word=>Array.from(word)[0]).join(" / ")
  :"";
 const available=device==="auto"?width:Math.min(width,DEVICE_WIDTH[actual]);
 return <div ref={container} className="v2-project-renderer" lang={document.locale} data-presentation={document.presentation} style={{width:"100%",minWidth:0}}>
  <div style={{width:"100%",maxWidth:available,margin:"0 auto"}}>
   {editorial&&!pageFilter&&pages.length>0&&<header className="v2-editorial-header" style={{width:Math.min(available,presentationSize(document,resolved,pages[0],actual).width)}}>
    <span>{monogram}</span>
    <details ref={menu}>
     <summary aria-label={document.locale==="ru"?"Разделы приглашения":"Чакыруу бөлүмдөрү"}><Menu size={18}/></summary>
     <nav>{pages.map(page=><a key={page.id} href={`#${sectionId}-${page.id}`} onClick={()=>{if(menu.current)menu.current.open=false;}}>{navigationLabels[page.id]??page.name}</a>)}</nav>
    </details>
   </header>}
   {pages.map(page=>{
    const size=presentationSize(document,resolved,page,actual),scale=Math.min(1,available/size.width)*size.scale;
    const root=resolved.nodes[page.rootNodeId];
    return <section key={page.id} id={editorial?`${sectionId}-${page.id}`:undefined} aria-label={editorial?navigationLabels[page.id]??page.name:page.name} data-preview-page={page.id} style={{position:"relative",margin:"0 auto",width:root.width*scale,height:root.height*scale,overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,transformOrigin:"top left",transform:`scale(${scale})`}}>
       <StudioV2Artboard document={resolved} rootNodeId={page.rootNodeId} mediaUrls={mediaUrls} guest={guest} motionPlayback={guest.mode==="studio"?undefined:motionPlayback} onMeasure={measure}/>
      </div>
    </section>;
   })}
  </div>
 </div>;
}
