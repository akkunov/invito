import Link from "next/link";
import { Suspense } from "react";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { routes } from "@/constants/routes";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function SiteHeader({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <header className="site-header">
      <div className="site-header-inner page-container">
        <BrandWordmark locale={locale} />
        <Suspense fallback={<span className="language-switcher" aria-hidden="true">RU　KY</span>}><LanguageSwitcher locale={locale} /></Suspense>
        <nav className="desktop-nav" aria-label={locale === "ru" ? "Главное меню" : "Башкы меню"}>
          <Link href={routes.templates(locale)}>{dict.nav.templates}</Link>
          <Link href={`/${locale}/invitations`}>{locale === "ru" ? "Мои приглашения" : "Менин чакырууларым"}</Link>
          <Link href={`${routes.home(locale)}#features`}>{dict.nav.benefits}</Link>
          <Link href={`${routes.home(locale)}#how`}>{dict.nav.how}</Link>
        </nav>
        <Link href={routes.templates(locale)} className="button-primary header-cta">{dict.actions.create}</Link>
        <MobileMenu locale={locale} />
      </div>
    </header>
  );
}
