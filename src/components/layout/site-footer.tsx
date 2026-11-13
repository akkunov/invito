import Link from "next/link";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { routes } from "@/constants/routes";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function SiteFooter({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <footer className="site-footer page-container">
      <BrandWordmark locale={locale} />
      <p>© {new Date().getFullYear()} INVITO</p>
      <nav aria-label="Нижнее меню"><Link href={routes.templates(locale)}>{dict.nav.templates}</Link><Link href={`${routes.home(locale)}#how`}>{dict.nav.how}</Link></nav>
    </footer>
  );
}
