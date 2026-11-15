import Image from "next/image";
import type { CSSProperties } from "react";
import type { TemplateDefinition } from "@/features/invitations/template.types";
import type { Locale } from "@/i18n/locales";
import { getCollectionDesign } from "@/features/invitations/collection-templates";

export function CollectionTemplateArtwork({ template, locale }: {template: TemplateDefinition; locale: Locale}) {
  const design = getCollectionDesign(template.id);
  if (!design) return null;
  return <div className={`collection-template-preview collection-preview-${design.theme}`} style={{"--collection-paper":design.paper,"--collection-ink":design.ink,"--invite-accent":design.accent} as CSSProperties} aria-hidden="true">
    <Image src={design.image} alt="" fill sizes="(max-width: 600px) 46vw, (max-width: 1100px) 30vw, 22vw" />
    <div className="collection-template-text"><small>{template.defaultContent.title[locale]}</small><strong>{template.defaultContent.name1}{template.defaultContent.name2 && <> & {template.defaultContent.name2}</>}</strong></div>
  </div>;
}
