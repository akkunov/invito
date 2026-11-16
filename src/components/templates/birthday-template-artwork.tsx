import Image from "next/image";
import type {CSSProperties} from "react";
import {getBirthdayVariant} from "@/features/invitations/birthday-templates";
import type {TemplateDefinition} from "@/features/invitations/template.types";
import type {Locale} from "@/i18n/locales";

export function BirthdayTemplateArtwork({template, locale}: { template: TemplateDefinition; locale: Locale }) {
    const variant = getBirthdayVariant(template.id);
    if (!variant) return null;
    const imagePath = `/images/birthday/${variant}-demo.jpg`;
    return <div className={`birthday-template-art birthday-template-${variant}`}
                style={{"--preview-accent": template.accent} as CSSProperties} aria-hidden="true">
        <Image src={imagePath} alt="" fill sizes="(max-width: 600px) 46vw, (max-width: 1100px) 30vw, 22vw"/>
        <div className="birthday-template-copy">
            <span>{template.defaultContent.title[locale]}</span>
            {variant === "milestone" && <em>{template.defaultContent.age}</em>}
            <strong>{template.defaultContent.name1}</strong>
            {variant !== "milestone" && <em>{template.defaultContent.age} {locale === "ru" ? "лет" : "жаш"}</em>}
            <small>{locale === "ru" ? "20 июня 2027" : "20-июнь, 2027"}</small>
        </div>
    </div>;
}
