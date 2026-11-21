import Image from "next/image";
import { ArrowDown, Play } from "lucide-react";
import type { TemplateDefinition } from "@/features/invitations/template.types";
import type { Locale } from "@/i18n/locales";

/**
 * Static, non-interactive replica of the Riviera cover.
 * The scaled composition uses the same photo, gradient overlay and section
 * order as RivieraInvitation, without nesting interactive controls in a Link.
 */
export function RivieraTemplateArtwork({ template, locale }: {
  template: TemplateDefinition;
  locale: Locale;
}) {
  const { name1, name2, message } = template.defaultContent;
  const ru = locale === "ru";

  return <div className="riviera-card-preview" aria-hidden="true" lang={locale}>
    <div className="riviera-card-portrait">
      <Image src="/images/riviera/couple.webp" alt="" fill sizes="(max-width: 700px) 50vw, 320px" />
    </div>
    <div className="riviera-card-topbar">
      <span>eventiq</span>
      <span className="riviera-card-rule"/>
      <span className="riviera-card-music"><Play fill="currentColor" strokeWidth={1.4}/></span>
    </div>
    <div className="riviera-card-body">
      <div className="riviera-card-eyebrow">
        {ru ? <>ПРИГЛАШАЕМ<br/>НА НАШУ СВАДЬБУ</> : <>СИЗДЕРДИ<br/>ҮЙЛӨНҮҮ ТОЮБУЗГА ЧАКЫРАБЫЗ</>}
      </div>
      <div className="riviera-card-names"><span>{name1}</span><span>{name2}</span></div>
      <div className="riviera-card-letter">
        <span className="riviera-card-short-rule"/>
        <p>{message[locale]}</p>
      </div>
      <div className="riviera-card-arrow"><ArrowDown strokeWidth={1.3}/></div>
    </div>
    <div className="riviera-card-wave"/>
  </div>;
}
