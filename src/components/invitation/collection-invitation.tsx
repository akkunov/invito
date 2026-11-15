"use client";

import type { CSSProperties } from "react";
import { CollectionCover } from "@/components/invitation/collection-cover";
import { HeritageCover } from "@/components/invitation/heritage-cover";
import { CountdownBlock } from "@/components/invitation/countdown-block";
import { GalleryBlock } from "@/components/invitation/gallery-block";
import { ProgramRoadmap } from "@/components/invitation/program-roadmap";
import { getCollectionDesign } from "@/features/invitations/collection-templates";
import { useBirthdayScroll } from "@/features/invitations/use-birthday-scroll";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";
import { formatEventDate, formatEventTime } from "@/lib/format-event-date";

export function CollectionInvitation({ document }: { document: InvitationDocument }) {
  const design = getCollectionDesign(document.templateId);
  const ref = useBirthdayScroll<HTMLElement>();
  if (!design) return null;
  const { locale, content } = document;
  const vars = { "--collection-paper": design.paper, "--collection-ink": design.ink, "--invite-accent": document.accent, "--invite-paper": design.paper, "--invite-text": design.ink } as CSSProperties;
  return <article ref={ref} lang={locale} className={`collection-invitation collection-${design.theme}`} style={vars}>
    {document.blocks.filter(b => b.enabled).map(block => {
      switch (block.id) {
        case "cover": return design.isHeritage ? <HeritageCover key={block.id} document={document} coverId={design.coverId} /> : <CollectionCover key={block.id} document={document} design={design} />;
        case "message": return <section key={block.id} data-editor-block="message" className="collection-section collection-story" data-birthday-reveal><p className="collection-kicker">{locale === "ru" ? "Дорогие гости" : "Кадырлуу коноктор"}</p><h3>{locale === "ru" ? "Приглашаем вас" : "Сиздерди чакырабыз"}</h3><p>{content.message[locale]}</p></section>;
        case "countdown": return <div key={block.id} className="collection-countdown"><CountdownBlock locale={locale} dateTimeLocal={content.dateTimeLocal} /></div>;
        case "details": return <section key={block.id} data-editor-block="details" className="collection-section collection-details" data-birthday-reveal><span>{locale === "ru" ? "Дата и время" : "Күнү жана убактысы"}</span><h3>{formatEventDate(content.dateTimeLocal,locale)}</h3><p>{formatEventTime(content.dateTimeLocal,locale)}</p></section>;
        case "program": return <ProgramRoadmap key={block.id} document={document} />;
        case "gallery": return <GalleryBlock key={block.id} document={document} />;
        case "location": return <section key={block.id} data-editor-block="location" className="collection-section collection-location" data-birthday-reveal><span>{locale === "ru" ? "Место проведения" : "Өтүүчү жай"}</span><h3>{content.venue[locale]}</h3><p>{content.city[locale]}</p>{content.dressCode && <p className="collection-dress">{content.dressCode[locale]}</p>}</section>;
        case "music": return null;
        case "rsvp": return <section key={block.id} data-editor-block="rsvp" className="collection-section collection-rsvp" data-birthday-reveal><h3>{locale === "ru" ? "Подтвердите участие" : "Катышууңузду ырастаңыз"}</h3><p>{content.giftNote?.[locale] ?? content.message[locale]}</p><small>{locale === "ru" ? "Ответы гостей станут доступны после подключения сервера" : "Коноктордун жооптору сервер кошулгандан кийин иштейт"}</small></section>;
      }
    })}
  </article>;
}
