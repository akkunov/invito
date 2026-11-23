"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { Menu, X } from "lucide-react";
import { routes } from "@/constants/routes";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function MobileMenu({ locale }: { locale: Locale }) {
  const [isOpen, setIsOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dict = getDictionary(locale);
  const ru = locale === "ru";
  useEffect(() => {
    if (!isOpen) return;
    function dismiss(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        trigger.current?.focus();
      }
    }
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", outside);
    };
  }, [isOpen]);
  return (
    <div className="mobile-menu" ref={root}>
      <button ref={trigger} className="icon-button" type="button" aria-expanded={isOpen} aria-controls={isOpen ? "mobile-navigation" : undefined} aria-label={isOpen ? (ru ? "Закрыть меню" : "Менюну жабуу") : (ru ? "Открыть меню" : "Менюну ачуу")} onClick={() => setIsOpen((value) => !value)}>
        {isOpen ? <X size={23} /> : <Menu size={23} />}
      </button>
      {isOpen && (
        <nav id="mobile-navigation" className="mobile-menu-panel" aria-label={ru ? "Мобильная навигация" : "Мобилдик навигация"}>
          <BrandWordmark locale={locale} />
          <Link href={routes.templates(locale)} onClick={() => setIsOpen(false)}>{dict.nav.templates}</Link>
          <Link href={`/${locale}/invitations`} onClick={() => setIsOpen(false)}>{ru ? "Мои приглашения" : "Менин чакырууларым"}</Link>
          <Link href={`${routes.home(locale)}#features`} onClick={() => setIsOpen(false)}>{dict.nav.benefits}</Link>
          <Link href={`${routes.home(locale)}#how`} onClick={() => setIsOpen(false)}>{dict.nav.how}</Link>
          <Link className="button-primary" href={routes.templates(locale)} onClick={() => setIsOpen(false)}>{dict.actions.create}</Link>
        </nav>
      )}
    </div>
  );
}
