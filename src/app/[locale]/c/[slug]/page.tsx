import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {isLocale} from "@/i18n/locales";
import {parseProjectV2} from "@/features/studio-v2/core/document.schema";
import {CustomerPublicInvitation} from "@/components/customer-editor/customer-public-invitation";
import {invitationApiBase} from "@/features/studio-v2/browser/public-invitation";
import "@/app/studio-v2.css";
import "@/app/public-invitation.css";

export const dynamic="force-dynamic";
export const revalidate=0;
export const metadata:Metadata={
  title:"Приглашение — Eventiq",
  description:"Персональное приглашение",
  robots:{index:false,follow:false,noarchive:true},
};

export default async function CustomerInvitationPage({params}:{
  params:Promise<{locale:string;slug:string}>;
}){
  const {locale,slug}=await params;
  if(!isLocale(locale)||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>80)notFound();
  const response=await fetch(invitationApiBase()+"/public/customer-invitations/"+encodeURIComponent(slug),{
    cache:"no-store",headers:{Accept:"application/json"},
  });
  if(response.status===404)notFound();
  if(!response.ok)throw Error("CUSTOMER_INVITATION_UNAVAILABLE");
  const data=await response.json() as {
    slug:string;release:number;sha256:string;document:unknown;
    mediaUrls:Record<string,string>;
  };
  if(data.slug!==slug)notFound();
  return <CustomerPublicInvitation locale={locale} initial={{
    slug:data.slug,release:data.release,sha256:data.sha256,
    document:parseProjectV2(data.document),mediaUrls:data.mediaUrls,
  }}/>;
}
