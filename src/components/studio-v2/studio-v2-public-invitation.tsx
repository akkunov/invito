"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {StudioV2ProjectRenderer} from "./studio-v2-project-renderer";
import type {PublicInvitation} from "@/features/studio-v2/browser/public-invitation";
import {decodePublicInvitation,invitationApiBase} from "@/features/studio-v2/browser/public-invitation";
import type {RsvpInput} from "@/features/studio-v2/core/invitation.schema.ts";

export function StudioV2PublicInvitation({initial,locale}:{initial:PublicInvitation;locale:"ru"|"ky"}){
 const [publication,setPublication]=useState(initial);
 const [available,setAvailable]=useState(true);
 const requestIdByPayload=useRef(new Map<string,string>());
 const base=useMemo(()=>invitationApiBase(),[]);
 // Both this route and the signed media URL fetches always bypass caches. A
 // withdrawn or republished invitation is refreshed without a browser reload.
 useEffect(()=>{
  let active=true;
  const refresh=async()=>{
   try{
    const res=await fetch(base+"/public/invitations/"+encodeURIComponent(initial.slug),{
      cache:"no-store",credentials:"omit",
    });
    if(!active)return;
    if(res.status===404){setAvailable(false);return;}
    if(!res.ok)return;
    const next=decodePublicInvitation(await res.json());
    if(active&&next.slug===initial.slug){setPublication(next);setAvailable(true);}
   }catch{/* Offline guests keep their already opened invitation, not a new phantom version. */}
  };
  const timer=window.setInterval(()=>void refresh(),45_000);
  return()=>{active=false;window.clearInterval(timer);};
 },[base,initial.slug]);
 const submitRsvp=useCallback(async(nodeId:string,input:RsvpInput,turnstileToken?:string,website="")=>{
   const key=nodeId+":"+JSON.stringify(input);
   let requestId=requestIdByPayload.current.get(key);
   if(!requestId){requestId=crypto.randomUUID();requestIdByPayload.current.set(key,requestId);}
   const response=await fetch(base+"/public/invitations/"+encodeURIComponent(initial.slug)+"/rsvp",{
     method:"POST",headers:{"content-type":"application/json"},credentials:"omit",cache:"no-store",
     body:JSON.stringify({requestId,nodeId,name:input.name,attendance:input.attendance,
       guests:input.guests,...(turnstileToken?{turnstileToken}:{}),website}),
   });
   if(!response.ok)throw new Error("RSVP_HTTP_"+response.status);
 },[base,initial.slug]);
 const guest=useMemo(()=>({
   mode:"live" as const,rsvpEnabled:publication.rsvpEnabled,
   turnstileSiteKey:publication.turnstileSiteKey??undefined,submitRsvp,
 }),[publication.rsvpEnabled,publication.turnstileSiteKey,submitRsvp]);
 if(!available)return <main className="v2-public-gone" role="status">
    <h1>Приглашение недоступно</h1>
    <p>Автор временно закрыл доступ к этому приглашению.</p>
   </main>;
 const localizedDocument={...publication.document,locale};
 return <main className="studio-v2 v2-public-invitation" lang={locale}>
   <StudioV2ProjectRenderer document={localizedDocument} mediaUrls={publication.mediaUrls}
      guest={guest} device="auto"/>
 </main>;
}
