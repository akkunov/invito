"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { routes } from "@/constants/routes";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function MobileMenu({ locale }: { locale: Locale }) {
  const [isOpen, setIsOpen] = useState(false);
  const dict = getDictionary(locale);
  return (
    <div className="mobile-menu">
      <button className="icon-button" type="button" aria-expanded={isOpen} aria-controls="mobile-navigation" aria-label={isOpen ? "Закрыть меню" : "Открыть меню"} onClick={() => setIsOpen((value) => !value)}>
        {isOpen ? <X size={23} /> : <Menu size={23} />}
      </button>
      {isOpen && (
        <nav id="mobile-navigation" className="mobile-menu-panel" aria-label="Мобильная навигация">
          <Link href={routes.home(locale)} onClick={() => setIsOpen(false)}>INVITO</Link>
          <Link href={routes.templates(locale)} onClick={() => setIsOpen(false)}>{dict.nav.templates}</Link>
          <Link href={`${routes.home(locale)}#features`} onClick={() => setIsOpen(false)}>{dict.nav.benefits}</Link>
          <Link href={`${routes.home(locale)}#how`} onClick={() => setIsOpen(false)}>{dict.nav.how}</Link>
          <Link className="button-primary" href={routes.templates(locale)} onClick={() => setIsOpen(false)}>{dict.actions.create}</Link>
        </nav>
      )}
    </div>
  );
}
