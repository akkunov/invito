"use client";

import {useEffect,useState} from "react";
import {StudioV2ProjectRenderer} from "@/components/studio-v2/studio-v2-project-renderer";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema";
import type {Locale} from "@/i18n/locales";

export type CustomerPublicPayload={
  slug:string;release:number;sha256:string;
  document:ProjectDocumentV2;mediaUrls:Record<string,string>;
};

export function CustomerPublicInvitation({initial,locale}:{
  initial:CustomerPublicPayload;locale:Locale;
}){
  const [publication,setPublication]=useState(initial);
  const [available,setAvailable]=useState(true);
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
  if(!available)return <main role="status" className="v2-public-gone">
    <h1>{locale==="ru"?"Приглашение недоступно":"Чакыруу жеткиликсиз"}</h1>
    <p>{locale==="ru"?"Автор закрыл доступ к приглашению.":"Автор чакырууга кирүүнү жапты."}</p>
  </main>;
  return <main className="studio-v2 v2-public-invitation" lang={locale}>
    <StudioV2ProjectRenderer
      document={{...publication.document,locale}}
      mediaUrls={publication.mediaUrls}
      device="auto"
      guest={{mode:"live",rsvpEnabled:false}}
    />
  </main>;
}
