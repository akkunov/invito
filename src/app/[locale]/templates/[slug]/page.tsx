import { publicFont } from "@/components/layout/public-font";
import "@/app/landing-editorial.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { InvitationCanvas } from "@/components/invitation/invitation-canvas";
import { routes } from "@/constants/routes";
import { createInvitationFromTemplate } from "@/features/invitations/create-invitation";
import { findTemplateById, templates } from "@/features/invitations/seed-templates";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { notFound } from "next/navigation";

export function generateStaticParams() { return locales.flatMap((locale) => templates.map((template) => ({ locale, slug: template.id }))); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const template = findTemplateById(slug);
  if (!template) notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return { title: `${template.name[locale]} — eventiq`, description: template.description[locale], alternates: { canonical: `${siteUrl}/${locale}/templates/${slug}`, languages: { ru: `${siteUrl}/ru/templates/${slug}`, ky: `${siteUrl}/ky/templates/${slug}` } } };
}

export default async function TemplateDetailPage({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const template = findTemplateById(slug);
  if (!template) notFound();
  const dict = getDictionary(locale);
  const document = createInvitationFromTemplate(template, locale);
  if ((await searchParams).preview === "1") return <main className="invitation-embed"><InvitationCanvas document={document} /></main>;
  return <div className={`invito-landing ${publicFont.variable}`}><SiteHeader locale={locale} /><main className="detail-main page-container">
    <Link className="back-link" href={routes.templates(locale)}><ArrowLeft size={17} />{dict.actions.back}</Link>
    <div className="detail-layout"><div className="detail-description"><h1>{template.name[locale]}</h1><p>{template.description[locale]}</p><span className="detail-price">{template.premium ? dict.catalog.premium : dict.catalog.free}</span><p className="detail-note">{dict.catalog.demo}</p><Link className="button-primary button-large" href={routes.editor(locale, template.id)}>{dict.actions.edit}<ArrowUpRight size={18} /></Link></div><div className="detail-preview"><InvitationCanvas document={document} /></div></div>
  </main><SiteFooter locale={locale} /></div>;
}
