import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TemplateCard } from "@/components/templates/template-card";
import { routes } from "@/constants/routes";
import { templates } from "@/features/invitations/seed-templates";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function TemplateCollection({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <section className="collection-section page-container" aria-labelledby="collection-title">
      <div className="section-heading"><h2 id="collection-title">{dict.landing.collection}</h2><Link href={routes.templates(locale)} className="text-link">{dict.actions.all}<ArrowUpRight size={19} aria-hidden="true" /></Link></div>
      <div className="home-templates">{templates.slice(0, 6).map((template) => <TemplateCard key={template.id} template={template} locale={locale} />)}</div>
    </section>
  );
}
