import type { BirthdayVariant } from "@/features/invitations/birthday-templates";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";

export function BirthdayStory({ document, variant }: { document: InvitationDocument; variant: BirthdayVariant }) {
  const { locale, content } = document;
  if (variant === "milestone") {
    return <section className="bd-age-story" aria-label={locale === "ru" ? "История юбилея" : "Маараке жөнүндө"}>
      <div className="bd-age-sticky"><span className="bd-age-big">{content.age ?? 50}</span><span className="bd-age-years">{locale === "ru" ? "лет истории" : "жылдык тарых"}</span><span className="bd-age-rule" /></div>
      <p className="bd-age-message" data-birthday-reveal>{content.message[locale]}</p>
    </section>;
  }
  return <section className="bd-story" aria-label={locale === "ru" ? "Личное приглашение" : "Жеке чакыруу"}>
    <span className="bd-ornament" aria-hidden="true">{variant === "bloom" ? "✿" : "✧"}</span>
    <p className="bd-story-kicker" data-birthday-reveal>{locale === "ru" ? "В этот вечер" : "Бул кечте"}</p>
    <p className="bd-story-message" data-birthday-reveal>{content.message[locale]}</p>
    <span className="bd-story-signature" data-birthday-reveal>{content.name1}</span>
  </section>;
}
