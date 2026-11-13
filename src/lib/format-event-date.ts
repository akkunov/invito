import type { Locale } from "@/i18n/locales";

export function parseBishkekDate(dateTimeLocal: string): Date {
  return new Date(`${dateTimeLocal}:00+06:00`);
}

export function formatEventDate(dateTimeLocal: string, locale: Locale): string {
  const date = parseBishkekDate(dateTimeLocal);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "ky-KG", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bishkek",
  }).format(date);
}

export function formatEventTime(dateTimeLocal: string, locale: Locale): string {
  const date = parseBishkekDate(dateTimeLocal);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "ky-KG", {
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Bishkek",
  }).format(date);
}
