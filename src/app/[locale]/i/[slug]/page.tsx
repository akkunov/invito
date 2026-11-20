import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {isLocale} from "@/i18n/locales";
import {
  decodePublicInvitation,invitationApiBase,
} from "@/features/studio-v2/browser/public-invitation";
import {StudioV2PublicInvitation} from "@/components/studio-v2/studio-v2-public-invitation";
import "@/app/studio-v2.css";
import "@/app/public-invitation.css";

export const dynamic="force-dynamic";
export const revalidate=0;

export const metadata:Metadata={
  title:"Приглашение — INVITO",
  description:"Персональное приглашение",
  robots:{index:false,follow:false,noarchive:true},
};
export default async function InvitationPage({params}:{
 params:Promise<{locale:string;slug:string}>;
}){
 const {locale,slug}=await params;
 if(!isLocale(locale)||!(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)&&slug.length<=80))notFound();
 const response=await fetch(invitationApiBase()+"/public/invitations/"+encodeURIComponent(slug),{
   cache:"no-store",headers:{"accept":"application/json"},
 });
 if(response.status===404)notFound();
 if(!response.ok)throw new Error("PUBLIC_INVITATION_UNAVAILABLE");
 const result=decodePublicInvitation(await response.json());
 if(result.slug!==slug)notFound();
 return <StudioV2PublicInvitation initial={result} locale={locale}/>;
}
