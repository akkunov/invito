import Image from "next/image";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";
import type { ReferenceTemplateArtwork } from "@/features/invitations/reference-templates";
import { formatEventDate } from "@/lib/format-event-date";

/** Text + cover are editable; edge ornaments are fixed, never part of an uploaded image. */
export function ReferenceHero({ document, design }: { document: InvitationDocument; design: ReferenceTemplateArtwork }) {
  const { content, locale } = document;
  const image = document.media?.portraitDataUrl ?? design.image;
  const initials = `${content.name1.slice(0, 1)}${content.name2 ? " + " + content.name2.slice(0, 1) : ""}`;
  return <section data-editor-block="cover" className={`reference-hero ref-${design.theme.replace("reference-", "")}`} aria-label={content.title[locale]}>
    {image && <div className="reference-cover-photo"><Image src={image} fill fetchPriority="high" sizes="(max-width:600px) 100vw, 700px" alt={locale === "ru" ? "Фотография обложки приглашения" : "Чакыруу мукабасынын сүрөтү"} unoptimized={image.startsWith("data:")} style={{ objectPosition: `center ${document.media?.focalY ?? 50}%` }} /></div>}
    {design.decor && <div className="reference-fixed-ornaments" style={{ backgroundImage: `url('${design.decor}')` }} aria-hidden="true" />}
    <div className="reference-hero-content">
      {design.theme === "reference-roundel" && <div className="reference-monogram" aria-label={initials}>{initials}</div>}
      <p className="reference-eyebrow" data-birthday-reveal>{content.title[locale]}</p>
      <h2 className="reference-name" data-birthday-reveal>{content.name1}{content.name2 && <><span className="reference-amp"> & </span>{content.name2}</>}</h2>
      <div className="reference-rule" aria-hidden="true" />
      <p className="reference-message" data-birthday-reveal>{content.message[locale]}</p>
      <p className="reference-date" data-birthday-reveal>{formatEventDate(content.dateTimeLocal, locale)}</p>
      <p className="reference-venue" data-birthday-reveal>{content.venue[locale]}<span>{content.city[locale]}</span></p>
    </div>
  </section>;
}
