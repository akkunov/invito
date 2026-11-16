import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
import {TemplateArtwork} from "@/components/templates/template-artwork";
import {routes} from "@/constants/routes";
import type {TemplateDefinition} from "@/features/invitations/template.types";
import type {Locale} from "@/i18n/locales";
import {getDictionary} from "@/i18n/dictionaries";

export function TemplateCard({template, locale}: { template: TemplateDefinition; locale: Locale }) {
    const dict = getDictionary(locale);
    return (
        <article className="template-card">
            <Link href={routes.template(locale, template.id)} className="template-card-link"
                  aria-label={`${dict.actions.preview}: ${template.name[locale]}`}>
                <TemplateArtwork template={template} locale={locale}/>
                <span className="template-card-overlay"><ArrowUpRight size={21} aria-hidden="true"/></span>
            </Link>
            <div className="template-card-meta"><h3><Link
                href={routes.template(locale, template.id)}>{template.name[locale]}</Link></h3><span
                className={template.premium ? "is-premium" : ""}>{template.premium ? dict.catalog.premium : dict.catalog.free}</span>
            </div>
        </article>
    );
}
