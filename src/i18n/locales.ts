export const locales = ["ru", "ky"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

export function oppositeLocale(locale: Locale): Locale {
  return locale === "ru" ? "ky" : "ru";
}
