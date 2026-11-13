import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { routes } from "@/constants/routes";
import type { Locale } from "@/i18n/locales";

export function BrandWordmark({ locale }: { locale: Locale }) {
  return (
    <Link href={routes.home(locale)} className="brand-wordmark" aria-label="INVITO — главная">
      <span className="brand-icon"><BrandMark /></span>
      <span>INVITO</span>
    </Link>
  );
}
