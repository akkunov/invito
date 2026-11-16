import type { InvitationDocument } from "@/features/invitations/invitation.schema";
import type { TemplateDefinition } from "@/features/invitations/template.types";
import type { Locale } from "@/i18n/locales";

export function createInvitationFromTemplate(
  template: TemplateDefinition,
  locale: Locale,
): InvitationDocument {
  return {
    schemaVersion: 1,
    templateId: template.id,
    locale,
    accent: template.accent,
    media: { portraitDataUrl: null, venuePhotoDataUrl: null, focalY: 50, galleryDataUrls: [] },
    content: structuredClone(template.defaultContent),
    program: template.defaultProgram ? structuredClone(template.defaultProgram) : [
      { id: "welcome", time: "17:30", title: { ru: "Сбор гостей", ky: "Конокторду тосуу" }, description: { ru: "Встречаемся и знакомимся", ky: "Коноктор менен жолугушуу" } },
      { id: "ceremony", time: "18:00", title: { ru: "Начало торжества", ky: "Салтанаттын башталышы" }, description: { ru: "Самый важный момент", ky: "Эң маанилүү учур" } },
      { id: "dinner", time: "19:00", title: { ru: "Праздничный ужин", ky: "Майрамдык кечки тамак" }, description: { ru: "Ужин и поздравления", ky: "Кечки тамак жана куттуктоолор" } },
      { id: "finale", time: "21:00", title: { ru: "Танцы и торт", ky: "Бий жана торт" }, description: { ru: "Празднуем вместе", ky: "Бирге майрамдайбыз" } },
    ],
    blocks: [
      { id: "cover", enabled: true },
      { id: "message", enabled: true },
      { id: "countdown", enabled: true },
      { id: "details", enabled: true },
      { id: "location", enabled: true },
      { id: "program", enabled: true },
      { id: "gallery", enabled: true },
      { id: "music", enabled: true },
      { id: "rsvp", enabled: true },
    ],
  };
}
