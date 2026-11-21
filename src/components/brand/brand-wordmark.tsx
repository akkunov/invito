import Link from "next/link";
import Image from "next/image";
import { routes } from "@/constants/routes";
import type { Locale } from "@/i18n/locales";

export function BrandWordmark({ locale }: { locale: Locale }) {
  return <Link href={routes.home(locale)} className="brand-wordmark" aria-label="eventiq — главная">
    <Image className="brand-logo" src="/brand/eventiq-logo.svg" alt="eventiq" width={1170} height={287} />
  </Link>;
}
