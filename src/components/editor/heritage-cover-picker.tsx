"use client";
import Image from "next/image";
import { heritageCovers } from "@/features/invitations/heritage-covers";
import type { Locale } from "@/i18n/locales";

export function HeritageCoverPicker({ locale, selected, onChange }: { locale: Locale; selected: string; onChange: (id: string | undefined) => void }) {
  return <fieldset className="heritage-cover-picker"><legend>{locale === "ky" ? "Улуттук мукабалар" : "Национальные обложки"}</legend><p>{locale === "ky" ? "Оймолорду сактап, сүрөт жана ысымдарды өзгөртүңүз." : "Декор остаётся неизменным, имена и фотография редактируются."}</p><div className="heritage-cover-grid">
    <button type="button" className={!selected ? "active" : ""} onClick={() => onChange(undefined)} aria-pressed={!selected}><span className="heritage-cover-original">✦</span><small>{locale === "ky" ? "Баштапкы" : "Исходная"}</small></button>
    {heritageCovers.map(cover => <button key={cover.id} type="button" className={selected === cover.id ? "active" : ""} onClick={() => onChange(cover.id)} aria-pressed={selected === cover.id}><span className="heritage-cover-thumbnail"><Image src={cover.image} alt="" fill sizes="100px" /></span><small>{cover.name[locale]}</small></button>)}
  </div></fieldset>;
}
