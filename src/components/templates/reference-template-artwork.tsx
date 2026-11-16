import Image from "next/image";
import type {ReferenceTemplateArtwork} from "@/features/invitations/reference-templates";
import type {TemplateDefinition} from "@/features/invitations/template.types";
import type {Locale} from "@/i18n/locales";

export function ReferenceTemplatePreview({design, template, locale}: {
    design: ReferenceTemplateArtwork;
    template: TemplateDefinition;
    locale: Locale;
}) {
    const {defaultContent} = template;
    return <div className={`reference-preview ref-preview-${design.theme}`}
                style={{backgroundColor: design.paper, color: design.ink, borderColor: design.accent}}
                aria-hidden="true">
        {design.image && <Image src={design.image} fill sizes="220px" alt="" className="reference-preview-photo"/>}
        {design.decor &&
            <div className="reference-preview-ornaments" style={{backgroundImage: `url('${design.decor}')`}}/>}
        <div className="reference-preview-content">
            <small>{defaultContent.title[locale]}</small><b>{defaultContent.name1}{defaultContent.name2 ? ` & ${defaultContent.name2}` : ""}</b><em>20.08.2027</em>
        </div>
    </div>;
}
