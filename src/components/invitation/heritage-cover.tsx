import Image from "next/image";
import { getHeritageCover } from "@/features/invitations/heritage-covers";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";
import { formatEventDate } from "@/lib/format-event-date";

/** Fixed decorative asset, independent from the user-uploaded portrait layer. */
export function HeritageCover({ document, coverId }: { document: InvitationDocument; coverId: string }) {
  const cover = getHeritageCover(coverId);
  if (!cover) return null;
  const { locale, content, media } = document;
  return <section className="heritage-cover" data-cover={cover.id} data-editor-block="cover" lang={locale}>
    <Image className="heritage-cover-ornament" src={cover.image} unoptimized alt="" fill sizes="(max-width: 650px) 100vw, 650px" aria-hidden="true" />
    <div className="heritage-cover-center">
      <p className="heritage-cover-kicker">{content.title[locale]}</p>
      {media?.portraitDataUrl && <div className="heritage-cover-portrait"><Image src={media.portraitDataUrl} alt={locale === "ky" ? "Майрамдын сүрөтү" : "Фото мероприятия"} fill unoptimized sizes="150px" style={{ objectPosition: `center ${media.focalY}%` }} /></div>}
      <h2>{content.name1}{content.name2 && <><span className="heritage-cover-amp"> & </span>{content.name2}</>}</h2>
      <p className="heritage-cover-date">{formatEventDate(content.dateTimeLocal, locale)}</p>
    </div>
  </section>;
}
