import { getBirthdayVariant } from "@/features/invitations/birthday-templates";
import { BirthdayTemplateArtwork } from "@/components/templates/birthday-template-artwork";
import type { TemplateDefinition } from "@/features/invitations/template.types";
import type { Locale } from "@/i18n/locales";

export function TemplateArtwork({ template, locale }: { template: TemplateDefinition; locale: Locale }) {
  if (getBirthdayVariant(template.id)) return <BirthdayTemplateArtwork template={template} locale={locale} />;
  const details = template.defaultContent;
  return (
    <div className={`template-art template-art-${template.theme}`} aria-hidden="true">
      <div className="template-art-motif"><span>✦</span></div>
      <div className="template-art-content">
        <span className="template-art-kicker">{details.title[locale]}</span>
        <span className="template-art-names">{details.name1}{details.name2 ? <> <i>&</i> {details.name2}</> : ""}</span>
        <span className="template-art-rule" />
        <span className="template-art-date">20.06.2027</span>
      </div>
      <div className="template-art-bottom" />
    </div>
  );
}
