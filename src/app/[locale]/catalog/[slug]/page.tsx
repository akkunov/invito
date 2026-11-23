import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {isLocale} from "@/i18n/locales";
import {getPublicTemplate} from "@/features/invitations/server-catalog";
import {parseProjectV2} from "@/features/studio-v2/core/document.schema";
import {StudioV2ProjectRenderer} from "@/components/studio-v2/studio-v2-project-renderer";
import {publicFont} from "@/components/layout/public-font";
import {SiteHeader} from "@/components/layout/site-header";
import {SiteFooter} from "@/components/layout/site-footer";
import "@/app/landing-editorial.css";
import "@/app/studio-v2.css";

export const dynamic="force-dynamic";
export const revalidate=0;

export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}):Promise<Metadata>{
  const {locale,slug}=await params;
  if(!isLocale(locale))notFound();
  const item=await getPublicTemplate(slug);
  if(!item)notFound();
  return {title:item.name+" — eventiq",description:item.description,
    robots:{index:true,follow:true}};
}

export default async function CatalogTemplatePage({params}:{params:Promise<{locale:string;slug:string}>}){
  const {locale,slug}=await params;
  if(!isLocale(locale))notFound();
  const item=await getPublicTemplate(slug);
  if(!item)notFound();
  const document=parseProjectV2(item.document);
  return <div className={`invito-landing ${publicFont.variable}`}>
    <SiteHeader locale={locale}/>
    <main className="detail-main page-container">
      <Link className="back-link" href={`/${locale}/templates`}>{locale==="ru"?"← Все шаблоны":"← Бардык шаблондор"}</Link>
      <div className="detail-layout">
        <div className="detail-description">
          <h1>{item.name}</h1>
          <p>{item.description}</p>
          <p className="detail-note">{locale==="ru"?
            "Предпросмотр серверного шаблона. Личный мобильный редактор подключим следующим этапом.":
            "Сервердеги шаблондун алдын ала көрүнүшү. Жеке редактор кийинки этапта кошулат."}</p>
          <Link href={`/${locale}/templates`} className="button-primary button-large">
            {locale==="ru"?"Выбрать другой дизайн":"Башка дизайн тандоо"}
          </Link>
        </div>
        <div className="detail-preview" style={{maxWidth:460,marginInline:"auto",width:"100%"}}>
          <StudioV2ProjectRenderer document={document} mediaUrls={item.mediaUrls} device="mobile" guest={{mode:"preview"}}/>
        </div>
      </div>
    </main>
    <SiteFooter locale={locale}/>
  </div>;
}
