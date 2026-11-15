import Image from "next/image";
import { formatEventDate } from "@/lib/format-event-date";
import type { CollectionDesign } from "@/features/invitations/collection-templates";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";

export function CollectionCover({ document, design }: {document: InvitationDocument; design: CollectionDesign}) {
  const { locale, content } = document;
  const image = document.media?.portraitDataUrl ?? design.image;
  return <section className="collection-cover" data-editor-block="cover">
    <div className="collection-cover-photo"><Image src={image} alt={locale === "ru" ? "Фото обложки" : "Мукабанын сүрөтү"} fill sizes="(max-width: 650px) 100vw, 650px" unoptimized={Boolean(document.media?.portraitDataUrl)} style={{objectPosition: `center ${document.media?.focalY ?? 50}%`}} /></div>
    <div className="collection-cover-copy"><span className="collection-kicker">{content.title[locale]}</span><h2>{content.name1}{content.name2 && <><span> & </span>{content.name2}</>}</h2>{content.age && <strong className="collection-age">{content.age}</strong>}<p className="collection-cover-date">{formatEventDate(content.dateTimeLocal, locale)}</p></div>
    <span className="collection-ornament" aria-hidden="true">✦</span>
  </section>;
}
