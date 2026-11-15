"use client";

import type { CSSProperties } from "react";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { CountdownBlock } from "@/components/invitation/countdown-block";
import { EditorialHero } from "@/components/invitation/editorial-hero";
import { GalleryBlock } from "@/components/invitation/gallery-block";
import { ProgramRoadmap } from "@/components/invitation/program-roadmap";
import { getEditorialVariant, editorialDesigns } from "@/features/invitations/editorial-templates";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";
import { useBirthdayScroll } from "@/features/invitations/use-birthday-scroll";
import { formatEventDate, formatEventTime } from "@/lib/format-event-date";

export function EditorialInvitation({ document }: { document: InvitationDocument }) {
  const variant = getEditorialVariant(document.templateId);
  const ref = useBirthdayScroll({ heroSelector: ".ed-cover", offsetVariable: "--ed-photo-offset", scaleVariable: "--ed-photo-scale" });
  if (!variant) return null;
  const { locale, content } = document;
  const isRu = locale === "ru";
  const theme = editorialDesigns[variant];
  const vars = {
    "--ed-paper": theme.paper,
    "--ed-ink": theme.ink,
    "--ed-accent": document.accent,
    "--invite-paper": theme.paper,
    "--invite-text": theme.ink,
    "--invite-accent": document.accent,
  } as CSSProperties;
  return <article ref={ref} lang={locale} className={`editorial-invitation ed-${variant}`} style={vars}>
    {document.blocks.filter((block) => block.enabled).map((block) => {
      switch (block.id) {
        case "cover": return <EditorialHero key={block.id} document={document} variant={variant} />;
        case "message": return <section data-editor-block="message" className="ed-letter" key={block.id}>
          <div className="ed-letter-index" aria-hidden="true">{variant === "wedding" ? "A / A" : variant === "kyz" ? "01 / Кыз узатуу" : "01 / Birthday"}</div>
          <div className="ed-letter-copy" data-birthday-reveal>
            <p className="ed-overline">{isRu ? "Дорогие гости" : "Кадырлуу коноктор"}</p>
            <h3>{variant === "wedding" ? (isRu ? "Наша история продолжается вместе" : "Биздин тарыхыбыз бирге уланат") : variant === "kyz" ? (isRu ? "В добрый путь" : "Ак жол каалайбыз") : (isRu ? "Особенный день" : "Өзгөчө күн")}</h3>
            <p>{content.message[locale]}</p>
            <span className="ed-signature">{variant === "wedding" ? `${content.name1} & ${content.name2}` : content.name1}</span>
          </div>
        </section>;
        case "countdown": return <div className="ed-countdown" key={block.id}><CountdownBlock locale={locale} dateTimeLocal={content.dateTimeLocal} /></div>;
        case "details": return <section data-editor-block="details" className="ed-details" key={block.id}>
          <div className="ed-detail-item" data-birthday-reveal><CalendarDays size={25} strokeWidth={1.2}/><p className="ed-overline">{isRu ? "Дата" : "Күнү"}</p><h3>{formatEventDate(content.dateTimeLocal, locale)}</h3></div>
          <div className="ed-detail-item" data-birthday-reveal><Clock3 size={25} strokeWidth={1.2}/><p className="ed-overline">{isRu ? "Время" : "Убактысы"}</p><h3>{formatEventTime(content.dateTimeLocal, locale)}</h3></div>
          <div className="ed-detail-item" data-birthday-reveal><MapPin size={25} strokeWidth={1.2}/><p className="ed-overline">{isRu ? "Место" : "Өтүүчү жай"}</p><h3>{content.venue[locale]}</h3></div>
        </section>;
        case "program": return <ProgramRoadmap key={block.id} document={document} />;
        case "location": return <section data-editor-block="location" key={block.id} className="ed-location" data-birthday-reveal>
          <p className="ed-overline">{isRu ? "Место встречи" : "Жолугушуу жери"}</p><h3>{content.venue[locale]}</h3><p>{content.city[locale]}</p>
          {content.dressCode && <div className="ed-additional"><span>{isRu ? "Дресс-код" : "Кийим үлгүсү"}</span><p>{content.dressCode[locale]}</p></div>}
        </section>;
        case "gallery": return <GalleryBlock key={block.id} document={document} />;
        case "music": return null;
        case "rsvp": return <section data-editor-block="rsvp" key={block.id} className="ed-rsvp" data-birthday-reveal>
          <p className="ed-overline">{isRu ? "Будем вас ждать" : "Сиздерди күтөбүз"}</p>
          <h3>{variant === "wedding" ? (isRu ? "Разделите этот день с нами" : "Бул күндү биз менен бөлүшүңүздөр") : variant === "kyz" ? (isRu ? "До встречи на торжестве" : "Салтанатта жолукканча") : (isRu ? "Увидимся на празднике" : "Майрамда көрүшкөнчө")}</h3>
          {content.giftNote && <p>{content.giftNote[locale]}</p>}
          <span className="ed-rsvp-status">{isRu ? "RSVP будет доступен после подключения публикации" : "RSVP жарыялоо кошулгандан кийин жеткиликтүү болот"}</span>
        </section>;
      }
    })}
  </article>;
}
