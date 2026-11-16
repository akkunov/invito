"use client";

import Image from "next/image";
import { ArrowDown, ArrowUpRight, Check, MapPin, Pause, Play, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { GalleryBlock } from "@/components/invitation/gallery-block";
import { CountdownBlock } from "@/components/invitation/countdown-block";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";

const IMAGES = {
  couple: "/images/riviera/couple.webp",
  villa: "/images/riviera/villa.webp",
  flowers: "/images/riviera/flowers.webp",
  fabricLeft: "/images/riviera/fabric-left.webp",
  fabricRight: "/images/riviera/fabric-right.webp",
} as const;

function dateParts(value: string, locale: "ru" | "ky") {
  const [year = "2027", month = "06", day = "20"] = value.slice(0, 10).split("-");
  const parsed = new Date(`${year}-${month}-${day}T12:00:00`);
  const weekday = new Intl.DateTimeFormat(locale === "ky" ? "ky-KG" : "ru-RU", { weekday: "long", timeZone: "Asia/Bishkek" }).format(parsed);
  return { number: `${day}.${month}.${year}`, weekday };
}

/** A dedicated reference-led layout. Photos are assets; typography, buttons and layout are real DOM. */
export function RivieraInvitation({ document, musicSrc }: { document: InvitationDocument; musicSrc?: string | null }) {
  const { content, media, locale } = document;
  const ru = locale === "ru";
  const enabled = new Set(document.blocks.filter((item) => item.enabled).map((item) => item.id));
  const date = dateParts(content.dateTimeLocal, locale);
  const [rsvp, setRsvp] = useState<"yes" | "no" | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const canPlayMusic = Boolean(musicSrc && enabled.has("music"));

  // Most mobile browsers block unmuted autoplay. Try it, but let the visitor
  // start the track with the music control when the browser rejects play().
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!canPlayMusic) { audio.pause(); return; }
    let active = true;
    audio.play().then(() => { if (active) setPlaying(true); }).catch(() => {
      if (active) setPlaying(false);
    });
    return () => { active = false; audio.pause(); };
  }, [canPlayMusic, musicSrc]);

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio || !canPlayMusic) return;
    if (!audio.paused) { audio.pause(); return; }
    try { await audio.play(); } catch { setPlaying(false); }
  }
  const image = media?.portraitDataUrl ?? IMAGES.couple;
  const mapQuery = encodeURIComponent(`${content.venue[locale]}, ${content.city[locale]}`);
  const vars = { "--invite-accent": document.accent, "--invite-paper": "#F4F0ED", "--invite-text": "#151310" } as CSSProperties;
  const name1 = content.name1.trim();
  const name2 = content.name2.trim();

  return <article className="riviera" style={vars} lang={locale}>
    {enabled.has("cover") && <section className="riviera-hero" data-editor-block="cover" id="riviera-cover">
      <div className="riviera-hero-portrait">
        <Image src={image} alt={ru ? "Фотография пары" : "Жубайлардын сүрөтү"} fill priority sizes="(max-width: 700px) 100vw, 60vw" unoptimized={image.startsWith("data:")} style={{ objectPosition: `center ${media?.focalY ?? 50}%` }} />
      </div>
      <header className="riviera-topbar">
        <span className="riviera-brand">INVITO</span>
        <span className="riviera-topbar-rule" aria-hidden="true" />
        <div className="riviera-music-control">
          {musicSrc && <audio ref={audioRef} src={musicSrc} preload="auto" loop autoPlay
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />}
          <button type="button" className="riviera-music-button" disabled={!canPlayMusic}
            onClick={toggleMusic} aria-pressed={playing}
            title={!canPlayMusic ? (ru ? "Добавьте музыку в редакторе" : "Редактордон музыка кошуңуз") : undefined}
            aria-label={playing ? (ru ? "Приостановить музыку" : "Музыканы токтотуу") : (ru ? "Включить музыку" : "Музыканы күйгүзүү")}>
            {playing ? <Pause size={20} fill="currentColor" aria-hidden="true" /> : <Play size={20} fill="currentColor" aria-hidden="true" />}
          </button>
        </div>
      </header>
      <div className="riviera-hero-body">
        <div className="riviera-eyebrow">{ru ? <>ПРИГЛАШАЕМ<br/>НА НАШУ СВАДЬБУ</> : <>СИЗДЕРДИ<br/>ҮЙЛӨНҮҮ ТОЮБУЗГА ЧАКЫРАБЫЗ</>}</div>
        <h1 className="riviera-names"><span>{name1}</span> <span>{name2}</span></h1>
        {enabled.has("message") && <div className="riviera-hero-letter" data-editor-block="message"><span className="riviera-short-rule"/><p>{content.message[locale]}</p></div>}
        <a href="#riviera-date" className="riviera-scroll" aria-label={ru ? "К дате торжества" : "Тойдун күнүнө өтүү"}><ArrowDown strokeWidth={1.3} size={21}/></a>
      </div>
      <div className="riviera-hero-wave" aria-hidden="true"/>
    </section>}

    {enabled.has("details") && <section className="riviera-date" id="riviera-date" data-editor-block="details">
      <div className="riviera-section-label">{ru ? <>ДАТА<br/>ТОРЖЕСТВА</> : <>ТОЙ<br/>КҮНҮ</>}</div>
      <span className="riviera-slash" aria-hidden="true" />
      <div className="riviera-date-main"><strong>{date.number}</strong><span>{date.weekday}</span></div>
    </section>}

    {enabled.has("location") && <section className="riviera-venue" data-editor-block="location">
      <div className="riviera-venue-info"><MapPin size={27} strokeWidth={1.25} aria-hidden="true"/><div>
        <h2>{content.venue[locale]}</h2><p>{content.city[locale]}</p>
        <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer">{ru ? "ПОСМОТРЕТЬ НА КАРТЕ" : "КАРТАДАН КӨРҮҮ"}<ArrowUpRight size={16}/></a>
      </div></div>
      <div className="riviera-villa"><Image src={media?.venuePhotoDataUrl ?? IMAGES.villa} unoptimized={Boolean(media?.venuePhotoDataUrl)} alt={ru ? "Место торжества" : "Той өтүүчү жер"} fill sizes="(max-width: 700px) 100vw, 40vw"/></div>
    </section>}

    {enabled.has("program") && <section className="riviera-program" data-editor-block="program" id="riviera-program">
      <div className="riviera-flowers" aria-hidden="true"><Image src={IMAGES.flowers} alt="" fill sizes="210px" /></div>
      <div className="riviera-program-content"><h2>{ru ? "ПРОГРАММА ДНЯ" : "ТОЙДУН ПРОГРАММАСЫ"}</h2>
        <ol className="riviera-timeline">{(document.program ?? []).map(item => <li key={item.id}><time>{item.time}</time><div><strong>{item.title[locale]}</strong><span>{item.description[locale]}</span></div></li>)}</ol>
      </div>
      <svg className="riviera-heart" viewBox="0 0 120 190" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M22 165 C43 131 71 98 87 58 C102 20 75 14 58 49 C52 61 37 99 31 117 C32 86 32 54 23 39 C6 12 -9 36 9 80"/></svg>
    </section>}

    {enabled.has("countdown") && <div className="riviera-countdown" data-editor-block="countdown"><CountdownBlock locale={locale} dateTimeLocal={content.dateTimeLocal}/></div>}
    {enabled.has("gallery") && <div className="riviera-gallery" data-editor-block="gallery"><GalleryBlock document={document}/></div>}

    {enabled.has("rsvp") && <section className="riviera-rsvp" data-editor-block="rsvp" id="riviera-rsvp">
      <div className="riviera-rsvp-heading"><h2>{ru ? <>ПОДТВЕРДИТЕ<br/>СВОЁ УЧАСТИЕ</> : <>КАТЫШУУҢУЗДУ<br/>ЫРАСТАҢЫЗ</>}</h2><span className="riviera-slash" aria-hidden="true"/><p>{ru ? "Будем признательны, если вы сообщите о своём решении заранее." : "Келериңизди алдын ала билдирсеңиздер кубанабыз."}</p></div>
      <div className="riviera-rsvp-actions"><button type="button" className={rsvp === "yes" ? "riviera-selected" : ""} onClick={() => setRsvp("yes")}>{ru ? "Я БУДУ" : "БАРАМ"}<Check size={19} strokeWidth={1.4}/></button><button type="button" className={rsvp === "no" ? "riviera-selected" : ""} onClick={() => setRsvp("no")}>{ru ? "К СОЖАЛЕНИЮ, НЕ СМОГУ" : "ТИЛЕККЕ КАРШЫ, БАРА АЛБАЙМ"}<X size={18} strokeWidth={1.4}/></button></div>
      {rsvp && <p className="riviera-rsvp-note" role="status">{ru ? "Ответ выбран для предпросмотра. Отправка будет доступна после подключения сервера." : "Жооп алдын ала көрүү үчүн тандалды. Сервер кошулгандан кийин жөнөтүлөт."}</p>}
      <footer className="riviera-footer"><span>{ru ? "С ЛЮБОВЬЮ," : "СҮЙҮҮ МЕНЕН,"}<br/>{name1} {ru ? "И" : "ЖАНА"} {name2}</span><span className="riviera-footer-rule"/></footer>
      <div className="riviera-fabric riviera-fabric-left" style={{backgroundImage:`url(${IMAGES.fabricLeft})`}} aria-hidden="true" />
      <div className="riviera-fabric riviera-fabric-right" style={{backgroundImage:`url(${IMAGES.fabricRight})`}} aria-hidden="true" />
    </section>}
  </article>;
}
