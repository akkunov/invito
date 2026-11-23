import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {isLocale} from "@/i18n/locales";
import {CustomerInvitationsDashboard} from "@/components/customer-editor/customer-invitations-dashboard";
export const metadata:Metadata={
  title:"Мои приглашения — Eventiq",
  robots:{index:false,follow:false,noarchive:true},
};
export default async function InvitationsPage({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  if(!isLocale(locale))notFound();
  return <CustomerInvitationsDashboard locale={locale}/>;
}
