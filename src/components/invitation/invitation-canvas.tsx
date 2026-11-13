import { BirthdayInvitation } from "@/components/invitation/birthday-invitation";
import { getBirthdayVariant } from "@/features/invitations/birthday-templates";
import type { CSSProperties } from "react";
import { CountdownBlock } from "@/components/invitation/countdown-block";
import { findTemplateById } from "@/features/invitations/seed-templates";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";
import { getDictionary } from "@/i18n/dictionaries";
import { formatEventDate, formatEventTime } from "@/lib/format-event-date";

export function InvitationCanvas({ document }: { document: InvitationDocument }) {
  const template = findTemplateById(document.templateId);
  if (!template) return null;
  const birthdayVariant = getBirthdayVariant(document.templateId);
  if (birthdayVariant) return <BirthdayInvitation document={document} variant={birthdayVariant} />;
  const { locale, content } = document;
  const dict = getDictionary(locale).invitation;
  const visible = new Set(document.blocks.filter((block) => block.enabled).map((block) => block.id));
  const cssVars = { "--invite-accent": document.accent } as CSSProperties;
  return (
    <article className={`invitation-canvas invitation-theme-${template.theme}`} lang={locale} style={cssVars}>
      {document.blocks.map((block) => {
        if (!visible.has(block.id)) return null;
        switch (block.id) {
          case "cover":
            return <section className="invitation-cover" key={block.id}><span className="invitation-ornament" aria-hidden="true">✦</span><p className="invitation-overline">{content.title[locale]}</p><h2>{content.name1}{content.name2 && <><span className="invitation-amp">&</span>{content.name2}</>}</h2><div className="invite-rule" /><p className="invite-cover-date">{formatEventDate(content.dateTimeLocal, locale)}</p><span className="invite-cover-bottom" aria-hidden="true">✧</span></section>;
          case "message":
            return <section className="invitation-message" key={block.id}><span className="invitation-ornament" aria-hidden="true">✦</span><p>{content.message[locale]}</p></section>;
          case "countdown":
            return <CountdownBlock key={block.id} locale={locale} dateTimeLocal={content.dateTimeLocal} />;
          case "details":
            return <section className="invitation-details" key={block.id}><p className="invitation-overline">{dict.dateLabel}</p><h3>{formatEventDate(content.dateTimeLocal, locale)}</h3><p>{formatEventTime(content.dateTimeLocal, locale)}</p></section>;
          case "location":
            return <section className="invitation-location" key={block.id}><p className="invitation-overline">{dict.locationLabel}</p><h3>{content.venue[locale]}</h3><p>{content.city[locale]}</p></section>;
          case "gallery":
            return <section className="invitation-gallery" key={block.id}><h3>{dict.gallery}</h3><div className="invitation-gallery-tiles" aria-hidden="true"><span>✦</span><span>❋</span><span>✧</span></div></section>;
          case "rsvp":
            return <section className="invitation-rsvp" key={block.id}><h3>{dict.rsvp}</h3><p>{dict.rsvpNote}</p><button type="button" disabled>{dict.rsvp}</button></section>;
        }
      })}
    </article>
  );
}
