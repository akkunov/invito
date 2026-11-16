import Image from "next/image";
import type { TemplateDefinition } from "@/features/invitations/template.types";
import type { Locale } from "@/i18n/locales";

export function MonochromeTemplateArtwork({ template, locale }: { template: TemplateDefinition; locale: Locale }) {
  const { name1, name2 } = template.defaultContent;
  return <div className="mono-card" aria-hidden="true">
    <div className="mono-card-picture"><Image src="/images/riviera/couple.webp" alt="" fill sizes="(max-width:650px) 50vw,280px" /></div>
    <span className="mono-card-label">{locale === "ru" ? "СВАДЕБНОЕ ПРИГЛАШЕНИЕ" : "ҮЙЛӨНҮҮ ТОЮНА ЧАКЫРУУ"}</span>
    <strong>{name1}<span>&amp;</span>{name2}</strong>
    <small>14 / 06 / 2025</small>
  </div>;
}
