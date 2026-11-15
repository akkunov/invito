"use client";
import type { CSSProperties } from "react";
import { CountdownBlock } from "@/components/invitation/countdown-block";
import { ReferenceHero } from "@/components/invitation/reference-hero";
import { GalleryBlock } from "@/components/invitation/gallery-block";
import { ProgramRoadmap } from "@/components/invitation/program-roadmap";
import { getReferenceTemplate } from "@/features/invitations/reference-templates";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";
import { useBirthdayScroll } from "@/features/invitations/use-birthday-scroll";
import { formatEventDate, formatEventTime } from "@/lib/format-event-date";

export function ReferenceInvitation({ document }: { document: InvitationDocument }) {
  const design = getReferenceTemplate(document.templateId);
  const ref = useBirthdayScroll<HTMLElement>();
  if (!design) return null;
  const { content, locale } = document;
  const vars = {
    "--ref-paper": design.paper,
    "--ref-ink": design.ink,
    "--invite-paper": design.paper,
    "--invite-text": design.ink,
    "--invite-accent": document.accent,
  } as CSSProperties;
  return <article ref={ref} className={`reference-invitation ref-design-${design.theme}`} lang={locale} style={vars}>
    {document.blocks.filter((b) => b.enabled).map((block) => {
      switch (block.id) {
        case "cover": return <ReferenceHero key={block.id} document={document} design={design} />;
        case "message": return <section key={block.id} data-editor-block={block.id} className="reference-content-block" data-birthday-reveal><span className="reference-sig" aria-hidden="true">✧</span><h3>{locale === "ru" ? "Дорогие гости" : "Кадырлуу коноктор"}</h3><p>{content.message[locale]}</p></section>;
        case "countdown": return <div key={block.id} className="reference-countdown"><CountdownBlock dateTimeLocal={content.dateTimeLocal} locale={locale} /></div>;
        case "details": return <section key={block.id} data-editor-block={block.id} className="reference-content-block" data-birthday-reveal><p className="reference-minor">{locale === "ru" ? "Дата и время" : "Күнү жана убактысы"}</p><h3>{formatEventDate(content.dateTimeLocal, locale)}</h3><p>{formatEventTime(content.dateTimeLocal, locale)}</p></section>;
        case "program": return <ProgramRoadmap document={document} key={block.id} />;
        case "location": return <section key={block.id} data-editor-block={block.id} className="reference-content-block" data-birthday-reveal><p className="reference-minor">{locale === "ru" ? "Место проведения" : "Өтүүчү жай"}</p><h3>{content.venue[locale]}</h3><p>{content.city[locale]}</p></section>;
        case "gallery": return <GalleryBlock key={block.id} document={document} />;
        case "music": return null;
        case "rsvp": return <section key={block.id} data-editor-block="rsvp" className="reference-content-block reference-rsvp" data-birthday-reveal><h3>{locale === "ru" ? "Будем рады вас видеть!" : "Сиздерди күтөбүз!"}</h3><p>{locale === "ru" ? "Подтверждение участия появится после подключения сервера" : "Катышууну ырастоо сервер кошулганда иштейт"}</p></section>;
      }
    })}
  </article>;
}
