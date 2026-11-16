"use client";

import Image from "next/image";
import { ArrowRight, Check, Gift, Info, MapPin, Music2, Pause, Play, Shirt, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GalleryBlock } from "@/components/invitation/gallery-block";
import { CountdownBlock } from "@/components/invitation/countdown-block";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";

function weddingDate(value: string, locale: "ru" | "ky") {
  const [year = "2025", month = "06", day = "14"] = value.slice(0, 10).split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  const lang = locale === "ru" ? "ru-RU" : "ky-KG";
  const monthLabel = new Intl.DateTimeFormat(lang, { month: "long", timeZone: "UTC" }).format(date);
  const weekday = new Intl.DateTimeFormat(lang, { weekday: "long", timeZone: "UTC" }).format(date);
  date.setUTCDate(date.getUTCDate() - 13);
  const deadline = new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  return { day, monthLabel, year, weekday, deadline };
}

/** Mobile-first typography and photography are real content rather than a flattened screenshot. */
export function MonochromeInvitation({ document, musicSrc }: {
  document: InvitationDocument;
  musicSrc?: string | null;
}) {
  const { content, media, locale } = document;
  const ru = locale === "ru";
  const enabled = new Set(document.blocks.filter(block => block.enabled).map(block => block.id));
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [response, setResponse] = useState<"yes" | "no" | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const canPlayMusic = Boolean(musicSrc && enabled.has("music"));
  const date = weddingDate(content.dateTimeLocal, locale);
  const portrait = media?.portraitDataUrl ?? "/images/riviera/couple.webp";
  const restaurant = media?.venuePhotoDataUrl ?? "/images/riviera/villa.webp";
  const initials = [content.name1[0], content.name2[0]].filter(Boolean).join(" & ");
  const mapQuery = encodeURIComponent(`${content.venue[locale]}, ${content.city[locale]}`);
  const program = document.program ?? [];
  const welcome = program[0]?.time ?? "16:30";
  const ceremony = program[1]?.time ?? "17:00";

  useEffect(() => {
    const player = audio.current;
    if (!player) return;
    if (!canPlayMusic) { player.pause(); return; }
    let active = true;
    player.play().then(() => { if (active) setPlaying(true); }).catch(() => {
      if (active) setPlaying(false);
    });
    return () => { active = false; player.pause(); };
  }, [canPlayMusic, musicSrc]);

  const toggleMusic = async () => {
    const player = audio.current;
    if (!player) return;
    if (!player.paused) { player.pause(); return; }
    try { await player.play(); } catch { setPlaying(false); }
  };

  return <article className="mono-invitation" lang={locale}>
    {enabled.has("cover") && <section className="mono-hero" id="mono-cover" data-editor-block="cover">
      <div className="mono-hero-image">
        <Image src={portrait} alt={ru ? "Фото пары" : "Жубайлардын сүрөтү"} fill priority
          unoptimized={portrait.startsWith("data:")} sizes="(max-width:440px) 70vw,320px"
          style={{objectPosition:`50% ${media?.focalY ?? 50}%`}}/>
      </div>
      <header className="mono-header">
        <span className="mono-header-label">{ru ? <>СВАДЕБНОЕ<br/>ПРИГЛАШЕНИЕ</> : <>ҮЙЛӨНҮҮ ТОЮНА<br/>ЧАКЫРУУ</>}</span>
        <span className="mono-header-rule" aria-hidden="true"/>
        <span className="mono-initials">{initials}</span>
      </header>
      <div className="mono-hero-copy">
        <h1><span>{content.name1} <b>&amp;</b></span><span>{content.name2}</span></h1>
        <p>{content.title[locale]}</p>
      </div>
      {musicSrc && <audio ref={audio} src={musicSrc} preload="auto" loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}/>}
      <button className="mono-music-button" type="button" disabled={!canPlayMusic} onClick={toggleMusic}
        aria-label={playing ? (ru ? "Остановить музыку" : "Музыканы токтотуу") : (ru ? "Включить музыку" : "Музыканы күйгүзүү")}
        aria-pressed={playing} title={!canPlayMusic ? (ru ? "Загрузите музыку в редакторе" : "Редактордон музыка кошуңуз") : undefined}>
        <Music2 size={16}/>{playing ? <Pause size={11} fill="currentColor"/> : <Play size={11} fill="currentColor"/>}
      </button>
    </section>}

    <div className="mono-paper">
      {enabled.has("message") && <section className="mono-intro" data-editor-block="message">
        <h2>{ru ? <>Дорогие<br/>друзья!</> : <>Кадырлуу<br/>достор!</>}</h2>
        <p>{content.message[locale]}</p>
      </section>}
      {enabled.has("details") && <section className="mono-date" data-editor-block="details" id="mono-date">
        <span className="mono-watermark" aria-hidden="true">&amp;</span>
        <div className="mono-calendar">
          <strong>{date.day}</strong>
          <span>{date.monthLabel}<br/>{date.year}</span>
        </div>
        <div className="mono-date-schedule">
          <p>{date.weekday}</p>
          <p>{ru ? "СБОР ГОСТЕЙ" : "КОНOКТОРДУ ТОСУУ"}<br/>{ru ? "В " : ""}<b>{welcome}</b></p>
          <p>{ru ? "НАЧАЛО ЦЕРЕМОНИИ" : "АЗЕМДИН БАШТАЛЫШЫ"}<br/>{ru ? "В " : ""}<b>{ceremony}</b></p>
        </div>
      </section>}

      {enabled.has("location") && <section className="mono-venue" data-editor-block="location" id="mono-venue">
        <div className="mono-venue-picture"><Image src={restaurant} alt={ru ? "Место проведения свадьбы" : "Той өтүүчү жай"}
          fill sizes="(max-width:440px) 100vw,440px" unoptimized={restaurant.startsWith("data:")}/></div>
        <div className="mono-venue-content">
          <span>{ru ? "МЕСТО ПРОВЕДЕНИЯ" : "ӨТҮҮЧҮ ЖАЙ"}</span>
          <h2>{content.venue[locale]}</h2>
          <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer">
            <MapPin size={22} strokeWidth={1.5}/>
            <span>{content.city[locale]}</span>
          </a>
        </div>
      </section>}

      {enabled.has("program") && <section className="mono-details" data-editor-block="program" id="mono-details">
        <div className="mono-details-title"><h2>{ru ? "ДЕТАЛИ" : "МААЛЫМАТ"}</h2><span/></div>
        <div className="mono-details-grid">
          <div>
            <Shirt strokeWidth={1.25} size={31}/>
            <h3>{ru ? "ДРЕСС-КОД" : "КИЙИМ ҮЛГҮСҮ"}</h3>
            <p>{content.dressCode?.[locale] || (ru ? "Будем рады видеть вас в чёрно-белой гамме." : "Ак-кара түстөгү кийимдер жарашат.")}</p>
          </div>
          <div>
            <Gift strokeWidth={1.4} size={30}/>
            <h3>{ru ? "ПОДАРКИ" : "БЕЛЕКТЕР"}</h3>
            <p>{content.giftNote?.[locale] || (ru ? "Ваше присутствие — главный подарок!" : "Сиздердин келишиңиздер — эң чоң белек!")}</p>
          </div>
          <div>
            <Info strokeWidth={1.5} size={30}/>
            <h3>{ru ? "ПРОЧЕЕ" : "КОШУМЧА"}</h3>
            <p>{content.otherNote?.[locale] || (ru ? "Возьмите с собой тёплую накидку на вечер." : "Кечке жылуу кийим ала келиңиздер.")}</p>
          </div>
        </div>
      </section>}
      {enabled.has("countdown") && <div className="mono-countdown" data-editor-block="countdown"><CountdownBlock locale={locale} dateTimeLocal={content.dateTimeLocal}/></div>}
      {enabled.has("gallery") && <div className="mono-gallery" data-editor-block="gallery"><GalleryBlock document={document}/></div>}

      {enabled.has("rsvp") && <section className="mono-rsvp" id="mono-rsvp" data-editor-block="rsvp">
        <button type="button" className="mono-rsvp-open" onClick={() => setRsvpOpen(v=>!v)} aria-expanded={rsvpOpen}>
          {ru ? "ПОДТВЕРДИТЬ УЧАСТИЕ (RSVP)" : "КАТЫШУУНУ ЫРАСТОО (RSVP)"} <ArrowRight size={22}/>
        </button>
        {rsvpOpen && <div className="mono-rsvp-choices">
          <button type="button" className={response==="yes" ? "is-active" : ""} onClick={()=>setResponse("yes")}>
            {ru ? "Я БУДУ" : "БАРАМ"} <Check size={16}/>
          </button>
          <button type="button" className={response==="no" ? "is-active" : ""} onClick={()=>setResponse("no")}>
            {ru ? "К СОЖАЛЕНИЮ, НЕ СМОГУ" : "БАРА АЛБАЙМ"} <X size={16}/>
          </button>
          {response && <small role="status">{ru ? "Ответ выбран для предпросмотра. Отправка появится после подключения сервера." : "Жооп тандалды. Сервер кошулганда жөнөтүлөт."}</small>}
        </div>}
        <p>{ru ? "Будем признательны за ответ" : "Жообуңуздар үчүн ыраазы болобуз"}<br/>{ru ? "до " : ""}{date.deadline}</p>
        <div className="mono-signature">{ru ? "До встречи!" : "Көрүшкөнчө!"} <span>♡</span></div>
      </section>}
    </div>
  </article>;
}
