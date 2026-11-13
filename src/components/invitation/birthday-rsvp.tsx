import type { InvitationDocument } from "@/features/invitations/invitation.schema";

export function BirthdayRsvp({ document }: { document: InvitationDocument }) {
  const isRu = document.locale === "ru";
  return <section data-editor-block="rsvp" className="bd-rsvp" aria-label={isRu ? "Подтверждение присутствия" : "Катышууну ырастоо"}>
    <span className="bd-ornament" aria-hidden="true">✧</span>
    <h3 data-birthday-reveal>{isRu ? "Увидимся на празднике?" : "Майрамда жолугабызбы?"}</h3>
    <p data-birthday-reveal>{isRu ? "Форма ответа гостей появится после подключения сервера." : "Коноктордун жооп формасы сервер кошулганда жеткиликтүү болот."}</p>
    <button type="button" disabled>{isRu ? "Подтвердить участие" : "Катышууну ырастоо"}</button>
  </section>;
}
