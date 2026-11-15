import { EditorialInvitation } from "@/components/invitation/editorial-invitation";
import { getEditorialVariant } from "@/features/invitations/editorial-templates";
import Image from "next/image";
import { ReferenceInvitation } from "@/components/invitation/reference-invitation";
import { getReferenceTemplate } from "@/features/invitations/reference-templates";
import { GalleryBlock } from "@/components/invitation/gallery-block";
import { ProgramRoadmap } from "@/components/invitation/program-roadmap";
import { MusicPlayer } from "@/components/invitation/music-player";
import { BirthdayInvitation } from "@/components/invitation/birthday-invitation";
import { getBirthdayVariant } from "@/features/invitations/birthday-templates";
import type { CSSProperties } from "react";
import { CountdownBlock } from "@/components/invitation/countdown-block";
import { findTemplateById } from "@/features/invitations/seed-templates";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";
import { getDictionary } from "@/i18n/dictionaries";
import { formatEventDate, formatEventTime } from "@/lib/format-event-date";

export function InvitationCanvas({ document, musicSrc, musicName }: { document: InvitationDocument; musicSrc?: string | null; musicName?: string }) {
  const music = musicSrc && document.blocks.some((block) => block.id === "music" && block.enabled) ? <MusicPlayer src={musicSrc} name={musicName} locale={document.locale} /> : null;
  const template = findTemplateById(document.templateId);
  if (!template) return null;
  const birthdayVariant = getBirthdayVariant(document.templateId);
  if (birthdayVariant) return <><BirthdayInvitation document={document} variant={birthdayVariant} />{music}</>;
  if (getEditorialVariant(document.templateId)) return <><EditorialInvitation document={document} />{music}</>;
  if (getReferenceTemplate(document.templateId)) return <><ReferenceInvitation document={document} />{music}</>;
  const { locale, content } = document;
  const dict = getDictionary(locale).invitation;
  const visible = new Set(document.blocks.filter((block) => block.enabled).map((block) => block.id));
  const cssVars = { "--invite-accent": document.accent } as CSSProperties;
  return (
    <>
      <article className={`invitation-canvas invitation-theme-${template.theme}`} lang={locale} style={cssVars}>
      {document.blocks.map((block) => {
        if (!visible.has(block.id)) return null;
        switch (block.id) {
          case "cover":
            return <section className="invitation-cover" data-editor-block="cover" key={block.id}>{document.media?.portraitDataUrl && <div className="generic-cover-photo"><Image src={document.media.portraitDataUrl} fill sizes="(max-width: 600px) 100vw, 650px" unoptimized alt={document.locale === "ru" ? "Фото обложки" : "Мукабанын сүрөтү"} style={{ objectPosition: `center ${document.media.focalY}%` }}/></div>}<span className="invitation-ornament" aria-hidden="true">✦</span><p className="invitation-overline">{content.title[locale]}</p><h2>{content.name1}{content.name2 && <><span className="invitation-amp">&</span>{content.name2}</>}</h2><div className="invite-rule" /><p className="invite-cover-date">{formatEventDate(content.dateTimeLocal, locale)}</p><span className="invite-cover-bottom" aria-hidden="true">✧</span></section>;
          case "message":
            return <section className="invitation-message" data-editor-block="message" key={block.id}><span className="invitation-ornament" aria-hidden="true">✦</span><p>{content.message[locale]}</p></section>;
          case "countdown":
            return <CountdownBlock key={block.id} locale={locale} dateTimeLocal={content.dateTimeLocal} />;
          case "details":
            return <section className="invitation-details" data-editor-block="details" key={block.id}><p className="invitation-overline">{dict.dateLabel}</p><h3>{formatEventDate(content.dateTimeLocal, locale)}</h3><p>{formatEventTime(content.dateTimeLocal, locale)}</p></section>;
          case "location":
            return <section className="invitation-location" data-editor-block="location" key={block.id}><p className="invitation-overline">{dict.locationLabel}</p><h3>{content.venue[locale]}</h3><p>{content.city[locale]}</p></section>;
          case "gallery": return <GalleryBlock key={block.id} document={document} />;
          case "program": return <ProgramRoadmap key={block.id} document={document} />;
          case "music": return null;
          case "rsvp":
            return <section className="invitation-rsvp" data-editor-block="rsvp" key={block.id}><h3>{dict.rsvp}</h3><p>{dict.rsvpNote}</p><button type="button" disabled>{dict.rsvp}</button></section>;
        }
      })}
      </article>
      {music}
    </>
  );
}
