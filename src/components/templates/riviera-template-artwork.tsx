import Image from "next/image";
import type { TemplateDefinition } from "@/features/invitations/template.types";
import type { Locale } from "@/i18n/locales";

export function RivieraTemplateArtwork({ template, locale }: { template: TemplateDefinition; locale: Locale }) {
  const content = template.defaultContent;
  return <div className="riviera-card-preview" aria-hidden="true">
    <div className="riviera-card-photo"><Image src="/images/riviera/couple.webp" alt="" fill sizes="(max-width: 650px) 50vw, 300px"/></div>
    <span>INVITO · WEDDING</span>
    <strong>{content.name1}<i>&</i>{content.name2}</strong>
    <small>{locale === "ru" ? "Свадебное приглашение" : "Үйлөнүү тойго чакыруу"}</small>
  </div>;
}
