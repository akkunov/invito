import { publicFont } from "@/components/layout/public-font";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { TemplateCollection } from "@/components/landing/template-collection";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeatureSection } from "@/components/landing/feature-section";
import { ClosingCta } from "@/components/landing/closing-cta";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import "@/app/landing-editorial.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const dict = getDictionary(locale);
  return {
    title: dict.seo.home,
    description: dict.hero.description,
    alternates: { canonical: `${url}/${locale}`, languages: { ru: `${url}/ru`, ky: `${url}/ky` } },
    openGraph: { title: dict.seo.home, description: dict.hero.description, type: "website", locale: locale === "ru" ? "ru_RU" : "ky_KG" },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <div className={`invito-landing ${publicFont.variable}`}>
    <SiteHeader locale={locale}/>
    <main>
      <HeroSection locale={locale}/>
      <TemplateCollection locale={locale}/>
      <HowItWorks locale={locale}/>
      <FeatureSection locale={locale}/>
      <ClosingCta locale={locale}/>
    </main>
    <SiteFooter locale={locale}/>
  </div>;
}
