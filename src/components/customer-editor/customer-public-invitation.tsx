"use client";

import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import type {RsvpInput} from "@/features/studio-v2/core/invitation.schema";
import {StudioV2ProjectRenderer} from "@/components/studio-v2/studio-v2-project-renderer";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema";
import type {Locale} from "@/i18n/locales";

export type CustomerPublicPayload={
  slug:string;release:number;sha256:string;
  document:ProjectDocumentV2;mediaUrls:Record<string,string>;
  rsvpEnabled:boolean;turnstileSiteKey:string|null;
};

export function CustomerPublicInvitation({initial,locale}:{
  initial:CustomerPublicPayload;locale:Locale;
}){
  const [publication,setPublication]=useState(initial);
  const [available,setAvailable]=useState(true);
  const pending=useRef(new Map<string,string>());
  const base=process.env.NEXT_PUBLIC_API_URL;
  useEffect(()=>{
    const base=process.env.NEXT_PUBLIC_API_URL;
    if(!base)return;
    let active=true;
    const refresh=async()=>{
      try{
        const api=base.endsWith("/")?base.slice(0,-1):base;
        const response=await fetch(api+"/public/customer-invitations/"+encodeURIComponent(initial.slug),{
          cache:"no-store",credentials:"omit",
        });
        if(!active)return;
        if(response.status===404){setAvailable(false);return;}
        if(!response.ok)return;
        const next=await response.json() as CustomerPublicPayload;
        if(active&&next.slug===initial.slug){
          setPublication(next);setAvailable(true);
        }
      }catch{/* Keep the last verified release when offline. */}
    };
    const timer=window.setInterval(()=>void refresh(),45_000);
    return()=>{active=false;window.clearInterval(timer);};
  },[initial.slug]);
  const submitRsvp=useCallback(async(nodeId:string,input:RsvpInput,turnstileToken?:string,website="")=>{
    if(!base)throw Error("PUBLIC_API_NOT_CONFIGURED");
    const key=nodeId+":"+JSON.stringify(input);
    let requestId=pending.current.get(key);
    if(!requestId){requestId=crypto.randomUUID();pending.current.set(key,requestId);}
    const api=base.endsWith("/")?base.slice(0,-1):base;
    const response=await fetch(api+"/public/customer-invitations/"+encodeURIComponent(initial.slug)+"/rsvp",{
      method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",credentials:"omit",
      body:JSON.stringify({requestId,nodeId,name:input.name,attendance:input.attendance,
        guests:input.guests,...(input.wish?{wish:input.wish}:{}),website,...(turnstileToken?{turnstileToken}:{})}),
    });
    if(!response.ok)throw Error("RSVP_HTTP_"+response.status);
  },[base,initial.slug]);
  const guest=useMemo(()=>({
    mode:"live" as const,
    rsvpEnabled:publication.rsvpEnabled,
    turnstileSiteKey:publication.turnstileSiteKey??undefined,
    submitRsvp,
  }),[publication.rsvpEnabled,publication.turnstileSiteKey,submitRsvp]);
  if(!available)return <main role="status" className="v2-public-gone">
    <h1>{locale==="ru"?"Приглашение недоступно":"Чакыруу жеткиликсиз"}</h1>
    <p>{locale==="ru"?"Автор закрыл доступ к приглашению.":"Автор чакырууга кирүүнү жапты."}</p>
  </main>;
  return <main className="studio-v2 v2-public-invitation" lang={locale}>
    <StudioV2ProjectRenderer
      document={{...publication.document,locale}}
      mediaUrls={publication.mediaUrls}
      device="auto"
      guest={guest}
    />
  </main>;
}
