import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { routes } from "@/constants/routes";
import type { Locale } from "@/i18n/locales";

export function FeatureSection({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  const features = ru ? [
    "Ваши фотографии и история",
    "Музыка для настроения",
    "Программа и важные детали",
    "Два языка — русский и кыргызский",
  ] : [
    "Сиздин сүрөттөрүңүз жана окуяңыз",
    "Маанай үчүн музыка",
    "Программа жана маанилүү маалыматтар",
    "Кыргызча жана орусча",
  ];
  return <section id="features" className="ed-feature-section" aria-labelledby="ed-feature-title">
    <div className="page-container ed-feature-layout">
      <div className="ed-feature-photo"><Image src="/images/riviera/villa.webp" alt={ru ? "Атмосфера свадебного торжества в саду" : "Бакчадагы үйлөнүү салтанаты"} fill sizes="(max-width: 800px) 100vw, 48vw"/></div>
      <div className="ed-feature-text">
        <p className="ed-eyebrow">{ru ? "СДЕЛАЙТЕ ЕГО СВОИМ" : "ӨЗҮҢҮЗГӨ ЫЛАЙЫКТАШТЫРЫҢЫЗ"}</p>
        <h2 id="ed-feature-title">{ru ? <>Каждая деталь<br/><em>о вас.</em></> : <>Ар бир бөлүгү<br/><em>сиз жөнүндө.</em></>}</h2>
        <p className="ed-feature-lead">{ru ? "Мы оставляем главное на первом плане — ваши чувства. А дизайн помогает рассказать о них." : "Эң негизгиси — сиздин сезимдериңиз. Дизайн аларды айтып берүүгө жардам берет."}</p>
        <ul>{features.map(item=><li key={item}><span>✳</span>{item}</li>)}</ul>
        <Link href={routes.templates(locale)} className="ed-section-link">{ru ? "Перейти к дизайнам" : "Дизайндарды көрүү"}<ArrowUpRight size={18}/></Link>
      </div>
    </div>
  </section>;
}
