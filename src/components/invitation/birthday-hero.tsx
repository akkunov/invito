import { ChevronDown } from "lucide-react";
import type { BirthdayVariant } from "@/features/invitations/birthday-templates";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";
import { formatEventDate } from "@/lib/format-event-date";
import { BirthdayPhoto } from "@/components/invitation/birthday-photo";

export function BirthdayHero({ document, variant }: { document: InvitationDocument; variant: BirthdayVariant }) {
  const { content, locale } = document;
  return <section className="bd-hero" aria-label={content.title[locale]}>
    <div className="bd-hero-art" aria-hidden="true"><span className="bd-hero-glow" /></div>
    <BirthdayPhoto document={document} variant={variant} className="bd-hero-photo" />
    <div className="bd-hero-copy">
      <p className="bd-overline" data-birthday-reveal>{content.title[locale]}</p>
      {variant === "milestone" && <p className="bd-hero-age" data-birthday-reveal>{content.age ?? 50}</p>}
      <h2 data-birthday-reveal>{content.name1}</h2>
      {variant !== "milestone" && <p className="bd-age-caption" data-birthday-reveal>{content.age ?? 25} {locale === "ru" ? "лет" : "жаш"}</p>}
      <div className="bd-fine-line" aria-hidden="true" />
      <p className="bd-hero-date" data-birthday-reveal>{formatEventDate(content.dateTimeLocal, locale)}</p>
    </div>
    <span className="bd-scroll-hint" aria-hidden="true"><ChevronDown size={17} /></span>
  </section>;
}
