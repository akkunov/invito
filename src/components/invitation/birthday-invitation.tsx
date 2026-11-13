"use client";

import type { CSSProperties } from "react";
import { CountdownBlock } from "@/components/invitation/countdown-block";
import { BirthdayHero } from "@/components/invitation/birthday-hero";
import { BirthdayStory } from "@/components/invitation/birthday-story";
import { BirthdayEventDetails } from "@/components/invitation/birthday-event-details";
import { BirthdayGallery } from "@/components/invitation/birthday-gallery";
import { BirthdayRsvp } from "@/components/invitation/birthday-rsvp";
import type { BirthdayVariant } from "@/features/invitations/birthday-templates";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";
import { useBirthdayScroll } from "@/features/invitations/use-birthday-scroll";

export function BirthdayInvitation({ document, variant }: { document: InvitationDocument; variant: BirthdayVariant }) {
  const ref = useBirthdayScroll();
  return <div ref={ref} className={`birthday-invitation bd-${variant}`} lang={document.locale} style={{ "--bd-accent": document.accent } as CSSProperties}>
    {document.blocks.filter((block) => block.enabled).map((block) => {
      switch (block.id) {
        case "cover": return <BirthdayHero key={block.id} document={document} variant={variant} />;
        case "message": return <BirthdayStory key={block.id} document={document} variant={variant} />;
        case "countdown": return <div key={block.id} className="bd-countdown" data-birthday-reveal><CountdownBlock locale={document.locale} dateTimeLocal={document.content.dateTimeLocal} /></div>;
        case "details": return <BirthdayEventDetails key={block.id} document={document} />;
        case "location": return <section key={block.id} className="bd-location" data-birthday-reveal><span className="bd-overline">{document.locale === "ru" ? "Наш адрес" : "Биздин дарек"}</span><h3>{document.content.venue[document.locale]}</h3><p>{document.content.city[document.locale]}</p></section>;
        case "gallery": return <BirthdayGallery key={block.id} document={document} />;
        case "rsvp": return <BirthdayRsvp key={block.id} document={document} />;
      }
    })}
  </div>;
}
