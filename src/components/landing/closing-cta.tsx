import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { routes } from "@/constants/routes";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function ClosingCta({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <section className="closing-cta page-container" aria-labelledby="closing-title"><div className="closing-panel"><h2 id="closing-title">{dict.landing.footerHeading}</h2><p>{dict.landing.footerDescription}</p><Link href={routes.templates(locale)} className="button-primary button-large">{dict.actions.create}<ArrowUpRight size={18} aria-hidden="true" /></Link></div></section>
  );
}
