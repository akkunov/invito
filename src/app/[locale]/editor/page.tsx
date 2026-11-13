import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationEditor } from "@/components/editor/invitation-editor";
import { createInvitationFromTemplate } from "@/features/invitations/create-invitation";
import { findTemplateById } from "@/features/invitations/seed-templates";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";

export const metadata: Metadata = { title: "Редактор приглашений — INVITO", robots: { index: false, follow: false } };

export default async function EditorPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ template?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { template: slug } = await searchParams;
  const template = slug ? findTemplateById(slug) : undefined;
  if (!template) notFound();
  const dictionary = getDictionary(locale);
  return <><h1 className="sr-only">{dictionary.editor.title} — {template.name[locale]}</h1><InvitationEditor locale={locale} initialDocument={createInvitationFromTemplate(template, locale)} /></>;
}
