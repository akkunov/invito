import { HeroShowcase } from "@/components/landing/hero-showcase";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { routes } from "@/constants/routes";
import { templates } from "@/features/invitations/seed-templates";
import type { Locale } from "@/i18n/locales";

export function HeroSection({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  const featured = templates.find(t => t.id === "editorial-riviera-wedding") ?? templates[0];
  const preview = featured ? routes.template(locale, featured.id) : routes.templates(locale);

  return <section className="ed-hero page-container" aria-labelledby="ed-hero-title">
    <div className="ed-hero-topline">
      <span>{ru ? "ЦИФРОВЫЕ ПРИГЛАШЕНИЯ С ХАРАКТЕРОМ" : "ӨЗГӨЧӨ МҮНӨЗДӨГҮ САНАРИП ЧАКЫРУУЛАР"}</span>
      <span className="ed-hero-issue">RU / KY</span>
    </div>
    <div className="ed-hero-grid">
      <div className="ed-hero-copy">
        <h1 id="ed-hero-title">{ru ? <>Ваш день.<br/>Ваша история.<br/><span className="ed-title-accent">Ваше eventiq.</span></> : <>Сиздин күн.<br/>Сиздин окуя.<br/><span className="ed-title-accent">Сиздин eventiq.</span></>}</h1>
        <div className="ed-hero-support">
          <p>{ru ? "Приглашение, с которого начинается ваше событие. Выберите дизайн, добавьте фотографии и расскажите гостям всё важное." : "Өзгөчө күнүңүз чакыруудан башталат. Дизайн тандап, сүрөттөрдү кошуп, конокторго маанилүү маалыматты айтып бериңиз."}</p>
          <div className="ed-hero-actions">
            <Link href={routes.templates(locale)} className="ed-action-primary">{ru ? "Выбрать дизайн" : "Дизайн тандоо"}<ArrowUpRight size={18} aria-hidden="true"/></Link>
            <Link href={preview} className="ed-action-text">{ru ? "Посмотреть приглашение" : "Чакырууну көрүү"}<ArrowUpRight size={16} aria-hidden="true"/></Link>
          </div>
        </div>
      </div>
      <HeroShowcase locale={locale}/>
    </div>
    <div className="ed-hero-bottom">
      <span>{ru ? "СОЗДАНО ДЛЯ ВАШИХ ИСТОРИЙ" : "СИЗДИН ОКУЯЛАРЫҢЫЗ ҮЧҮН"}</span>
      <a href="#designs" aria-label={ru ? "К дизайнам" : "Дизайндарга"}>{ru ? "Листайте вниз" : "Төмөн жылдырыңыз"}<ArrowDownRight size={18} aria-hidden="true"/></a>
    </div>
  </section>;
}
