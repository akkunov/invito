import Link from "next/link";
import {draftUuid} from "@/features/auth/return-path";
import {CustomerDraftEntry} from "@/components/customer-editor/customer-draft-entry";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationEditor } from "@/components/editor/invitation-editor";
import { createInvitationFromTemplate } from "@/features/invitations/create-invitation";
import { findTemplateById } from "@/features/invitations/seed-templates";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import {getPublicTemplate} from "@/features/invitations/server-catalog";
import {parseProjectV2} from "@/features/studio-v2/core/document.schema";
import {personalizationSchema} from "@/features/studio-v2/core/personalization.schema";
import {CustomerMobileEditor} from "@/components/customer-editor/customer-mobile-editor";
import "@/app/studio-v2.css";

export const metadata: Metadata = { title: "Редактор приглашений — eventiq", robots: { index: false, follow: false } };

export default async function EditorPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ template?: string; draft?: string; local?: string; version?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { template: slug, draft, local, version } = await searchParams;
  if(draft!==undefined){
    if(typeof draft!=="string"||!draftUuid.test(draft))notFound();
    return <CustomerDraftEntry locale={locale} draftId={draft.toLowerCase()}/>;
  }
  const template = slug ? findTemplateById(slug) : undefined;
  if (!template && slug) {
    // Server templates use the restricted mobile editor; legacy seeds retain their editor.
    const remote = await getPublicTemplate(slug);
    if (!remote) notFound();
    if(version!==undefined&&version!==remote.templateVersionId){
      return <main className="ce-shell" style={{padding:24}}>
        <p role="alert">{locale==="ru"?"Версия шаблона изменилась. Локальные правки прежней версии сохранены на устройстве.":"Шаблондун версиясы өзгөрдү. Мурунку версиянын жергиликтүү өзгөртүүлөрү түзмөктө сакталды."}</p>
        <Link href={`/${locale}/catalog/${slug}`}>{locale==="ru"?"К шаблону":"Шаблонго"}</Link>
      </main>;
    }
    const source = parseProjectV2(remote.document);
    const contract = personalizationSchema.parse(remote.personalization);
    return <CustomerMobileEditor locale={locale} slug={remote.slug}
      name={remote.name} versionId={remote.templateVersionId}
      localDraftId={typeof local==="string"&&draftUuid.test(local)?local.toLowerCase():undefined}
      source={source} contract={contract} mediaUrls={remote.mediaUrls}/>;
  }
  if (!template) notFound();
  const dictionary = getDictionary(locale);
  return <><h1 className="sr-only">{dictionary.editor.title} — {template.name[locale]}</h1><InvitationEditor locale={locale} initialDocument={createInvitationFromTemplate(template, locale)} /></>;
}
