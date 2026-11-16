import type { TemplateDefinition } from "@/features/invitations/template.types";
import type { Locale } from "@/i18n/locales";

/** The cover thumbnail mirrors the same hero and travel ticket as the invitation. */
export function SantoriniTemplateArtwork({ template, locale }: { template: TemplateDefinition; locale: Locale }) {
  const { defaultContent: c } = template;
  return <div className="santo-card" aria-hidden="true">
    <div className="santo-card-bg" style={{backgroundImage:'url("https://commons.wikimedia.org/wiki/Special:FilePath/Oia%20Santorini%20Blue%20Domes.jpg?width=960")'}}/>
    <div className="santo-card-top">✈ {c.title[locale].toUpperCase()} ✈</div>
    <div className="santo-card-names"><span>{c.name1}</span><i>&amp;</i><span>{c.name2}</span></div>
    <div className="santo-card-ticket"><span>12–16<br/>{locale === "ru" ? "СЕНТЯБРЯ" : "СЕНТЯБРЬ"}<br/>2025</span><span>{c.venue[locale].toUpperCase()}</span></div>
  </div>;
}
