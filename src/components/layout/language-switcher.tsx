"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/i18n/locales";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  function href(next: Locale) {
    const nextPath = pathname.replace(/^\/(ru|ky)(?=\/|$)/, `/${next}`);
    const query = searchParams.toString();
    return query ? `${nextPath}?${query}` : nextPath;
  }
  return (
    <nav className="language-switcher" aria-label="Язык интерфейса / Интерфейстин тили">
      <Link href={href("ru")} hrefLang="ru" aria-current={locale === "ru" ? "page" : undefined} className={locale === "ru" ? "language-active" : ""}>RU</Link>
      <Link href={href("ky")} hrefLang="ky" aria-current={locale === "ky" ? "page" : undefined} className={locale === "ky" ? "language-active" : ""}>KY</Link>
    </nav>
  );
}
