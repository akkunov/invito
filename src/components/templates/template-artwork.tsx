import { MonochromeTemplateArtwork } from "@/components/templates/monochrome-template-artwork";
import { RivieraTemplateArtwork } from "@/components/templates/riviera-template-artwork";
import type { TemplateDefinition } from "@/features/invitations/template.types";
import type { Locale } from "@/i18n/locales";

export function TemplateArtwork({ template, locale }: {
  template: TemplateDefinition;
  locale: Locale;
}) {
  if (template.id === "editorial-monochrome-wedding") return <MonochromeTemplateArtwork template={template} locale={locale}/>;
  return <RivieraTemplateArtwork template={template} locale={locale}/>;
}
