"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { templates } from "@/features/invitations/seed-templates";
import { TemplateArtwork } from "@/components/templates/template-artwork";
import { TemplatePreviewButton } from "@/components/templates/template-preview-button";
import { routes } from "@/constants/routes";
import type { Locale } from "@/i18n/locales";

export function HeroShowcase({ locale }: { locale: Locale }) {
  const [activeId, setActiveId] = useState(templates[0].id);
  const active = templates.find(template => template.id === activeId) ?? templates[0];
  const ru = locale === "ru";
  return <div className="ed-hero-feature">
    <div className="ed-showcase-stage">
      <span className="ed-stage-label">{ru ? "ВАША ИСТОРИЯ В НОВОЙ ФОРМЕ" : "ОКУЯҢЫЗ ЖАҢЫ ФОРМАТТА"}</span>
      <div className="ed-stage-orbit" aria-hidden="true">eventiq</div>
      <Link key={active.id} href={routes.template(locale, active.id)} className="ed-showcase-invitation"
        aria-label={`${ru ? "Открыть" : "Ачуу"}: ${active.name[locale]}`}>
        <TemplateArtwork template={active} locale={locale} />
        <span className="ed-showcase-open"><ArrowUpRight size={20} aria-hidden="true" /></span>
      </Link>
      <span className="ed-stage-note">{ru ? <>Сначала —<br/>приглашение.</> : <>Баары чакыруудан<br/>башталат.</>}</span>
    </div>
    <div className="ed-showcase-controls">
      <div className="ed-design-switcher" role="group" aria-label={ru ? "Выберите превью дизайна" : "Дизайнды көрүү үчүн тандаңыз"}>
        {templates.map((template, index) => <button key={template.id} type="button"
          onClick={() => setActiveId(template.id)} aria-pressed={active.id === template.id}
          aria-label={template.name[locale]}><span aria-hidden="true">0{index + 1}</span></button>)}
      </div>
      <p aria-live="polite">{active.name[locale]}</p>
      <TemplatePreviewButton id={active.id} name={active.name[locale]} locale={locale} />
    </div>
  </div>;
}
