"use client";

import { useState } from "react";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function HeroEnvelope({ locale }: { locale: Locale }) {
  const [isOpen, setIsOpen] = useState(false);
  const dict = getDictionary(locale);
  return (
    <div className={`hero-art${isOpen ? " hero-art-open" : ""}`}>
      <div className="hero-halo" aria-hidden="true" />
      <div className="hero-mountains" aria-hidden="true" />
      <div className="hero-ribbon" aria-hidden="true" />
      <div className="envelope-scene">
        <div className="envelope-card" aria-hidden="true">
          <small>{locale === "ru" ? "Наша свадьба" : "Биздин той"}</small>
          <span>Азамат<br /><i>&</i><br />Айпери</span>
          <em>20.06.2027 · Бишкек</em>
          <span className="envelope-card-mark">✦</span>
        </div>
        <div className="envelope-back" aria-hidden="true" />
        <div className="envelope-front" aria-hidden="true" />
        <div className="envelope-flap" aria-hidden="true" />
        <button className="envelope-seal" type="button" aria-pressed={isOpen} aria-label={isOpen ? (locale === "ru" ? "Закрыть приглашение" : "Чакырууну жабуу") : dict.invitation.open} onClick={() => setIsOpen((value) => !value)}>✧</button>
      </div>
      <span className="hero-scene-caption">{isOpen ? (locale === "ru" ? "Приглашение открыто" : "Чакыруу ачылды") : dict.invitation.open}</span>
    </div>
  );
}
