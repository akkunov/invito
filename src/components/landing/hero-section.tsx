import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { HeroEnvelope } from "@/components/landing/hero-envelope";
import { routes } from "@/constants/routes";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function HeroSection({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <section className="hero-section page-container" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title" className="hero-title">{dict.hero.title}</h1>
        <p className="hero-description">{dict.hero.description}</p>
        <div className="hero-actions">
          <Link href={routes.templates(locale)} className="button-primary button-large">{dict.actions.create}<ArrowUpRight size={18} aria-hidden="true" /></Link>
          <Link href={routes.template(locale, "mountain-vows")} className="button-outline button-large"><Play size={17} aria-hidden="true" />{dict.actions.sample}</Link>
        </div>
      </div>
      <HeroEnvelope locale={locale} />
      <div className="hero-facts">
        <span><b>60</b> {dict.hero.stat1}</span>
        <span>{dict.hero.stat2}</span>
        <span>{dict.hero.stat3}</span>
      </div>
    </section>
  );
}
