"use client";

import { useEffect, useState } from "react";
import { parseBishkekDate } from "@/lib/format-event-date";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function CountdownBlock({ locale, dateTimeLocal }: { locale: Locale; dateTimeLocal: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const target = parseBishkekDate(dateTimeLocal).getTime();
    function refresh() { setRemaining(Number.isFinite(target) ? Math.max(0, target - Date.now()) : null); }
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(interval);
  }, [dateTimeLocal]);
  const dict = getDictionary(locale).invitation;
  const days = remaining === null ? "—" : String(Math.floor(remaining / 86_400_000));
  const hours = remaining === null ? "—" : String(Math.floor((remaining % 86_400_000) / 3_600_000)).padStart(2, "0");
  const minutes = remaining === null ? "—" : String(Math.floor((remaining % 3_600_000) / 60_000)).padStart(2, "0");
  return <section className="invitation-countdown"><p className="invitation-overline">{dict.countdown}</p><div className="countdown-grid"><span><strong>{days}</strong><small>{dict.days}</small></span><span><strong>{hours}</strong><small>{dict.hours}</small></span><span><strong>{minutes}</strong><small>{dict.minutes}</small></span></div></section>;
}
