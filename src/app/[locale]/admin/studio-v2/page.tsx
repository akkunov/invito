import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {isLocale} from "@/i18n/locales";
import {StudioV2Authenticated} from "@/components/studio-v2/studio-v2-authenticated";
import "@/app/studio-v2.css";

export const metadata: Metadata = {
  title: "eventiq Studio 2.0 — бесконечный холст",
  description: "Рабочее пространство eventiq Studio с локальными проектами и защищённым облачным сохранением.",
  robots: {index: false, follow: false},
};
export default async function StudioV2Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  return <StudioV2Authenticated locale={locale}/>;
}
