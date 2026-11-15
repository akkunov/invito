import Image from "next/image";
import { ArrowDown } from "lucide-react";
import type { EditorialVariant } from "@/features/invitations/editorial-templates";
import { editorialDesigns } from "@/features/invitations/editorial-templates";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";
import { formatEventDate } from "@/lib/format-event-date";

/** The decorative composition never changes when the user uploads a new cover. */
export function EditorialHero({ document, variant }: { document: InvitationDocument; variant: EditorialVariant }) {
  const { locale, content, media } = document;
  const isRu = locale === "ru";
  const image = media?.portraitDataUrl ?? editorialDesigns[variant].image;
  const title = content.title[locale];
  const date = formatEventDate(content.dateTimeLocal, locale);
  const coverAlt = isRu ? "Фотография на обложке приглашения" : "Чакыруунун мукабасындагы сүрөт";

  return (
    <section className="ed-cover" data-editor-block="cover" aria-label={title}>
      <div className="ed-hero-photo">
        <Image
          src={image}
          alt={coverAlt}
          fill
          sizes="(max-width: 600px) 100vw, (max-width: 1100px) 60vw, 700px"
          fetchPriority="high"
          unoptimized={image.startsWith("data:")}
          style={{ objectPosition: `center ${media?.focalY ?? 50}%` }}
        />
      </div>
      <div className="ed-fixed-motif" aria-hidden="true" />
      <div className="ed-hero-topline" aria-hidden="true"><span>INVITO</span><span>{variant === "birthday" ? "a birthday issue" : variant === "wedding" ? "a wedding issue" : "a family celebration"}</span></div>
      <div className="ed-hero-copy">
        <p className="ed-kicker" data-birthday-reveal>{title}</p>
        {variant === "birthday" && <>
          <h2 data-birthday-reveal>{content.name1}</h2>
          <p className="ed-birthday-caption" data-birthday-reveal>{isRu ? "Мой день рождения" : "Менин туулган күнүм"}</p>
          <span className="ed-ghost-number" aria-hidden="true">{content.age ?? 25}</span>
        </>}
        {variant === "wedding" && <>
          <p className="ed-hero-small" data-birthday-reveal>{isRu ? "Вместе навсегда" : "Түбөлүк бирге"}</p>
          <h2 data-birthday-reveal>{content.name1}<span className="ed-amp">&</span>{content.name2}</h2>
          <span className="ed-wedding-monogram" aria-hidden="true">{content.name1.charAt(0)} + {content.name2.charAt(0)}</span>
        </>}
        {variant === "kyz" && <>
          <p className="ed-hero-small" data-birthday-reveal>{isRu ? "Вечер добрых пожеланий" : "Ак тилектер кечеси"}</p>
          <h2 data-birthday-reveal>{content.name1}</h2>
          <p className="ed-kyz-subtitle" data-birthday-reveal>{isRu ? "Кыз узатуу" : "Кыз узатуу"}</p>
        </>}
        <p className="ed-hero-date" data-birthday-reveal>{date}</p>
      </div>
      <span className="ed-scroll-note" aria-hidden="true">{isRu ? "Листайте вниз" : "Төмөн жылдырыңыз"}<ArrowDown size={14}/></span>
    </section>
  );
}
