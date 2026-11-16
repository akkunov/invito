import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { routes } from "@/constants/routes";
import type { Locale } from "@/i18n/locales";

export function ClosingCta({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  return <section className="ed-final page-container" aria-labelledby="ed-final-title">
    <div className="ed-final-head"><span>INVITO / {ru ? "НАЧНИТЕ С ВАШЕЙ ИСТОРИИ" : "ӨЗ ОКУЯҢЫЗДАН БАШТАҢЫЗ"}</span><span>✳</span></div>
    <h2 id="ed-final-title">{ru ? <>Пусть всё начнётся<br/><span className="ed-title-accent">красиво.</span></> : <>Баары кооз<br/><span className="ed-title-accent">башталсын.</span></>}</h2>
    <Link href={routes.templates(locale)}>{ru ? "Выбрать своё приглашение" : "Чакырууну тандоо"}<ArrowUpRight size={22} strokeWidth={1.5}/></Link>
    <p>{ru ? "Ваш день. Ваши люди. Ваша история." : "Сиздин күнүңүз. Жакындарыңыз. Окуяңыз."}</p>
  </section>;
}
