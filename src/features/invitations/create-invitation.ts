import { getBirthdayVariant } from "@/features/invitations/birthday-templates";
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
    media: { portraitDataUrl: null, focalY: 50, galleryDataUrls: [] },
    content: structuredClone(template.defaultContent),
    blocks: [
      { id: "cover", enabled: true },
      { id: "message", enabled: true },
      { id: "countdown", enabled: true },
      { id: "details", enabled: true },
      { id: "location", enabled: true },
      { id: "gallery", enabled: getBirthdayVariant(template.id) !== null },
      { id: "rsvp", enabled: true },
    ],
  };
}
