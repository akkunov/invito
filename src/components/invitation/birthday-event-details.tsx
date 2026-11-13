import { CalendarDays, Clock3, MapPin } from "lucide-react";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";
import { formatEventDate, formatEventTime } from "@/lib/format-event-date";

export function BirthdayEventDetails({ document }: { document: InvitationDocument }) {
  const { locale, content } = document;
  return <section data-editor-block="details" className="bd-event" aria-label={locale === "ru" ? "Информация о празднике" : "Майрам жөнүндө маалымат"}>
    <div className="bd-details-heading" data-birthday-reveal><p className="bd-overline">{locale === "ru" ? "Приходите праздновать" : "Майрамга келиңиз"}</p><h3>{locale === "ru" ? "Жду вас" : "Сиздерди күтөм"}</h3></div>
    <div className="bd-detail-list">
      <div data-birthday-reveal><CalendarDays size={20} /><p>{locale === "ru" ? "Дата" : "Күнү"}</p><strong>{formatEventDate(content.dateTimeLocal, locale)}</strong></div>
      <div data-birthday-reveal><Clock3 size={20} /><p>{locale === "ru" ? "Время" : "Убактысы"}</p><strong>{formatEventTime(content.dateTimeLocal, locale)}</strong></div>
      <div data-birthday-reveal><MapPin size={20} /><p>{locale === "ru" ? "Место" : "Өтүүчү жер"}</p><strong>{content.venue[locale]}, {content.city[locale]}</strong></div>
    </div>
  </section>;
}
