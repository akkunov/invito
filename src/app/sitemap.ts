import type { MetadataRoute } from "next";
import { locales } from "@/i18n/locales";
import { templates } from "@/features/invitations/seed-templates";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticUrls = locales.flatMap((locale) => [
    { url: `${siteUrl}/${locale}`, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${siteUrl}/${locale}/templates`, changeFrequency: "weekly" as const, priority: .9 },
  ]);
  const templatesUrls = locales.flatMap((locale) => templates.map((template) => ({
    url: `${siteUrl}/${locale}/templates/${template.id}`, changeFrequency: "monthly" as const, priority: .6,
  })));
  return [...staticUrls, ...templatesUrls];
}
