import Image from "next/image";
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
      <span className="ed-hero-issue">INVITO / 2026</span>
    </div>
    <div className="ed-hero-grid">
      <div className="ed-hero-copy">
        <h1 id="ed-hero-title">{ru ? <>Моменты,<br/><em>которые</em><br/>остаются.</> : <>Эсте калган<br/><em>өзгөчө</em><br/>көз ирмемдер.</>}</h1>
        <div className="ed-hero-support">
          <p>{ru ? "Не просто ссылка с датой. Маленькая история о вашем большом событии — в красивом онлайн-приглашении." : "Жөн гана датасы жазылган шилтеме эмес. Өзгөчө күнүңүз тууралуу чакан, кооз санарип баяндоо."}</p>
          <div className="ed-hero-actions">
            <Link href={routes.templates(locale)} className="ed-action-primary">{ru ? "Выбрать дизайн" : "Дизайн тандоо"}<ArrowUpRight size={18} aria-hidden="true"/></Link>
            <Link href={preview} className="ed-action-text">{ru ? "Посмотреть приглашение" : "Чакырууну көрүү"}<ArrowUpRight size={16} aria-hidden="true"/></Link>
          </div>
        </div>
      </div>
      <div className="ed-hero-feature">
        <Link href={preview} className="ed-feature-image" aria-label={ru ? "Открыть приглашение Editorial Riviera" : "Editorial Riviera чакыруусун ачуу"}>
          <Image src="/images/riviera/couple.webp" fill priority sizes="(max-width: 800px) 100vw, 46vw"
            alt={ru ? "Пара в нежный момент свадебной фотосессии" : "Үйлөнүү тоюндагы жубайлардын сүрөтү"}/>
          <div className="ed-image-caption"><span>INVITO — 01 / EDITORIAL</span><ArrowUpRight size={22} aria-hidden="true"/></div>
        </Link>
        <div className="ed-feature-note">
          <span className="ed-feature-asterisk" aria-hidden="true">✳</span>
          <p>{ru ? "Особенные события заслуживают красивого начала." : "Өзгөчө күндүн башталышы да кооз болсун."}</p>
        </div>
      </div>
    </div>
    <div className="ed-hero-bottom">
      <span>{ru ? "СОЗДАНО ДЛЯ ВАШИХ ИСТОРИЙ" : "СИЗДИН ОКУЯЛАРЫҢЫЗ ҮЧҮН"}</span>
      <a href="#designs" aria-label={ru ? "К дизайнам" : "Дизайндарга"}>{ru ? "Листайте вниз" : "Төмөн жылдырыңыз"}<ArrowDownRight size={18} aria-hidden="true"/></a>
    </div>
  </section>;
}
