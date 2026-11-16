import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TemplateCard } from "@/components/templates/template-card";
import { routes } from "@/constants/routes";
import { templates } from "@/features/invitations/seed-templates";
import type { Locale } from "@/i18n/locales";

export function TemplateCollection({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  return <section id="designs" className="ed-collection page-container" aria-labelledby="ed-collection-title">
    <div className="ed-section-heading">
      <div>
        <p className="ed-eyebrow">{ru ? "01 / КОЛЛЕКЦИЯ" : "01 / КОЛЛЕКЦИЯ"}</p>
        <h2 id="ed-collection-title">{ru ? <>Не шаблон.<br/><em>Ваш характер.</em></> : <>Жөн гана калып эмес.<br/><em>Сиздин стилиңиз.</em></>}</h2>
      </div>
      <Link href={routes.templates(locale)} className="ed-section-link">{ru ? "Все дизайны" : "Бардык дизайндар"}<ArrowUpRight size={19} aria-hidden="true"/></Link>
    </div>
    <p className="ed-collection-intro">{ru ? "У каждого приглашения своя атмосфера. Выберите ту, в которой узнаёте себя." : "Ар бир чакыруунун өз атмосферасы бар. Өзүңүзгө жакканын тандаңыз."}</p>
    <div className="ed-collection-grid">{templates.slice(0, 6).map((template,index) => <div className="ed-collection-item" key={template.id}>
      <div className="ed-collection-index">0{index + 1} / {template.category === "wedding" ? (ru ? "СВАДЬБА" : "ҮЙЛӨНҮҮ ТОЮ") : (ru ? "СОБЫТИЕ" : "ИШ-ЧАРА")}</div>
      <TemplateCard template={template} locale={locale}/>
    </div>)}</div>
  </section>;
}
