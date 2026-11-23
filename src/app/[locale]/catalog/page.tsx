import {redirect,notFound} from "next/navigation";
import {isLocale} from "@/i18n/locales";

/** Keep legacy /catalog links compatible with the canonical /templates index. */
export default async function CatalogIndexPage({params}:{
  params:Promise<{locale:string}>;
}){
  const {locale}=await params;
  if(!isLocale(locale))notFound();
  redirect(`/${locale}/templates`);
}
