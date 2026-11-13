import type { Locale } from "@/i18n/locales";

export const routes = {
  home: (locale: Locale) => `/${locale}`,
  templates: (locale: Locale) => `/${locale}/templates`,
  template: (locale: Locale, slug: string) => `/${locale}/templates/${slug}`,
  editor: (locale: Locale, slug: string) => `/${locale}/editor?template=${encodeURIComponent(slug)}`,
} as const;
