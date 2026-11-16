import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Onest, Noto_Serif_Display } from "next/font/google";
import { locales, isLocale } from "@/i18n/locales";
import "@/app/globals.css";
import "@/app/riviera.css";

const uiFont = Onest({ subsets: ["latin", "cyrillic"], variable: "--font-ui", display: "swap" });
const displayFont = Noto_Serif_Display({ subsets: ["latin", "cyrillic"], variable: "--font-display", display: "swap" });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleRootLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <html lang={locale} className={`${uiFont.variable} ${displayFont.variable}`}><body>{children}</body></html>;
}
