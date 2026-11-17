import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { StudioV2Workspace } from "@/components/studio-v2/studio-v2-workspace";
import "@/app/studio-v2.css";

export const metadata: Metadata = {
  title: "INVITO Studio 2.0 — бесконечный холст",
  description: "Изолированный прототип рабочего пространства с несколькими фреймами, масштабом, линейками и навигацией.",
  robots: { index: false, follow: false },
};
export default async function StudioV2Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <StudioV2Workspace locale={locale}/>;
}
