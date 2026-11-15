import Image from "next/image";
import type { TemplateDefinition } from "@/features/invitations/template.types";
import { getEditorialVariant, editorialDesigns } from "@/features/invitations/editorial-templates";
import type { Locale } from "@/i18n/locales";
import { formatEventDate } from "@/lib/format-event-date";

/** Lightweight preview; no animation runtime or editor JavaScript in the catalog. */
export function EditorialTemplateArtwork({ template, locale }: { template: TemplateDefinition; locale: Locale }) {
  const variant = getEditorialVariant(template.id);
  if (!variant) return null;
  const { defaultContent } = template;
  return <div className={`ed-template-preview ed-preview-${variant}`} aria-hidden="true">
    <Image src={editorialDesigns[variant].image} alt="" fill sizes="(max-width: 600px) 46vw, (max-width: 1100px) 30vw, 22vw" />
    <span className="ed-preview-overline">{defaultContent.title[locale]}</span>
    <strong>{defaultContent.name1}{variant === "wedding" && <><em>&</em>{defaultContent.name2}</>}</strong>
    {variant === "birthday" && <span className="ed-preview-age">{defaultContent.age}</span>}
    <span className="ed-preview-date">{formatEventDate(defaultContent.dateTimeLocal, locale)}</span>
  </div>;
}
