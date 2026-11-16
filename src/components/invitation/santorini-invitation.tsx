"use client";

import Image from "next/image";
import { CalendarDays, Compass, Heart, MapPin, Music2, Pause, Plane, Play, Send, Ticket, Check, X, Ship, Landmark, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";
import { GalleryBlock } from "@/components/invitation/gallery-block";

const PHOTO = {
  // Wikimedia Commons, CC BY / CC BY-SA. See docs/SANTORINI_TEMPLATE.md for credits.
  hero: "https://commons.wikimedia.org/wiki/Special:FilePath/Oia%20Santorini%20Blue%20Domes.jpg?width=1280",
  left: "https://commons.wikimedia.org/wiki/Special:FilePath/Oia%20Sunset%20%2CSantorini.jpg?width=640",
  right: "https://commons.wikimedia.org/wiki/Special:FilePath/Sunset%20in%20Santorini1.jpg?width=640",
} as const;

function travelDate(value: string, locale: "ru" | "ky") {
  const parsed = new Date((value || "2025-09-12").slice(0, 10) + "T12:00:00Z");
  if (Number.isNaN(parsed.valueOf())) return "—";
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "ky-KG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(parsed);
}
function compactDate(value: string, locale: "ru" | "ky") {
  const parsed = new Date((value || "2025-09-12").slice(0, 10) + "T12:00:00Z");
  if (Number.isNaN(parsed.valueOf())) return "—";
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "ky-KG", { day: "numeric", month: "long", timeZone: "UTC" }).format(parsed);
}

const itineraryIcons = [Plane, Ship, Heart, Landmark, Compass] as const;

/** An actual editable invitation, not a screenshot used as page background. */
export function SantoriniInvitation({ document, musicSrc }: { document: InvitationDocument; musicSrc?: string | null }) {
  const { content, media, locale } = document;
  const ru = locale === "ru";
  const enabled = new Set(document.blocks.filter(item => item.enabled).map(item => item.id));
  const hero = media?.portraitDataUrl ?? PHOTO.hero;
  const secondPhoto = media?.venuePhotoDataUrl ?? PHOTO.right;
  const entries = document.program ?? [];
  const startDate = content.tripStartDateLocal ?? "2025-09-12";
  const endDate = content.tripEndDateLocal ?? "2025-09-16";
  const deadline = content.rsvpDeadlineLocal ?? "2025-08-01";
  const mapQuery = encodeURIComponent(content.city[locale] || content.venue[locale]);
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [rsvp, setRsvp] = useState<"yes" | "no" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const hasMusic = Boolean(enabled.has("music") && musicSrc);
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    if (!hasMusic) { el.pause(); return; }
    let current = true;
    el.play().then(() => { if (current) setPlaying(true); }).catch(() => { if (current) setPlaying(false); });
    return () => { current = false; el.pause(); };
  }, [hasMusic, musicSrc]);
  const toggleMusic = async () => {
    const el = audio.current;
    if (!el) return;
    if (!el.paused) { el.pause(); return; }
    try { await el.play(); } catch { setPlaying(false); }
  };
  const picture = (src: string, alt: string, priority = false) => src.startsWith("data:")
    ? <Image src={src} alt={alt} fill unoptimized sizes="(max-width:440px) 100vw,440px" priority={priority}/>
    : <div className="santo-remote-photo" role="img" aria-label={alt} style={{ backgroundImage: `url("${src}")` }}/>;

  return <article className="santo" lang={locale}>
    {enabled.has("cover") && <section className="santo-hero" data-editor-block="cover" id="santo-hero">
      <div className="santo-hero-photo">{picture(hero, ru ? "Санторини на закате" : "Күн батардагы Санторини", true)}</div>
      <div className="santo-blossoms" aria-hidden="true"><span>✿</span><span>✿</span><span>✿</span><span>✿</span></div>
      <div className="santo-cover-heading"><Plane size={23} strokeWidth={1.8}/><div><span>{content.title[locale]}</span><small>{ru ? "ВМЕСТЕ — В НОВОЕ ПРИКЛЮЧЕНИЕ!" : "БИРГЕ ЖАҢЫ УКМУШТУУ САПАРГА!"}</small></div></div>
      <div className="santo-stamp" aria-hidden="true"><span>{ru ? "СВАДЬБА" : "ҮЙЛӨНҮҮ"}</span><Compass size={29} strokeWidth={1.2}/><span>{ru ? "ПУТЕШЕСТВИЕ" : "САЯКАТ"}</span></div>
      <h1 className="santo-names"><span>{content.name1}</span><i>&amp;</i><span>{content.name2}</span></h1>
      <div className="santo-sail" aria-hidden="true">⛵</div>
      {musicSrc && <audio ref={audio} src={musicSrc} preload="auto" loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}/>}
      <button className="santo-music" type="button" disabled={!hasMusic} onClick={toggleMusic}
        aria-pressed={playing} aria-label={playing ? (ru ? "Остановить музыку" : "Музыканы токтотуу") : (ru ? "Включить музыку" : "Музыканы күйгүзүү")}>
        <Music2 size={15}/>{playing ? <Pause size={13} fill="currentColor"/> : <Play size={13} fill="currentColor"/>}
      </button>
    </section>}

    {enabled.has("details") && <section className="santo-ticket" data-editor-block="details" id="santo-details">
      <div className="santo-ticket-cell"><CalendarDays size={26}/><strong>{compactDate(startDate,locale)} –<br/>{compactDate(endDate,locale)}</strong></div>
      <div className="santo-ticket-cell"><MapPin size={28}/><strong>{content.venue[locale]}</strong><small>{content.city[locale]}</small></div>
      <div className="santo-ticket-stamp" aria-hidden="true">✈<span>GREECE</span></div>
    </section>}

    <div className="santo-paper">
      <div className="santo-route-deco" aria-hidden="true"><Plane/><span>········</span><MapPin/></div>
      {enabled.has("message") && <section className="santo-intro" data-editor-block="message">
        <h2>{ru ? "Дорогие друзья!" : "Кадырлуу достор!"}</h2>
        <p>{content.message[locale]}</p>
        <div className="santo-ornament" aria-hidden="true"><span>⌁</span>♡<span>⌁</span></div>
      </section>}

      {enabled.has("location") && <section className="santo-location" data-editor-block="location">
        <span className="santo-label">{ru ? "НАПРАВЛЕНИЕ ПУТЕШЕСТВИЯ" : "САЯКАТТЫН БАГЫТЫ"}</span>
        <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer">
          <MapPin size={15}/>{content.venue[locale]} <ArrowRight size={15}/>
        </a>
      </section>}

      {enabled.has("program") && <section className="santo-program" data-editor-block="program" id="santo-program">
        <div className="santo-program-label">{ru ? "ПРОГРАММА ПУТЕШЕСТВИЯ" : "САЯКАТ ПРОГРАММАСЫ"}</div>
        <div className="santo-postcard santo-postcard-left" aria-hidden="true">{picture(PHOTO.left,"")}</div>
        <div className="santo-postcard santo-postcard-right" aria-hidden="true">{picture(secondPhoto,"")}</div>
        <ol className="santo-itinerary">
          {entries.map((item,i) => {
            const Icon = itineraryIcons[i % itineraryIcons.length];
            const highlight = i === 2;
            return <li key={item.id} className={highlight ? "is-wedding" : ""}>
              <span className="santo-itinerary-icon"><Icon size={19} strokeWidth={1.5}/></span>
              <time>{item.time}</time>
              <div><strong>{item.title[locale]}</strong><p>{item.description[locale]}</p></div>
            </li>;
          })}
        </ol>
      </section>}
      {enabled.has("gallery") && <div className="santo-gallery" data-editor-block="gallery"><GalleryBlock document={document}/></div>}
      {enabled.has("countdown") && <div className="santo-countdown" data-editor-block="countdown"><span className="santo-label">{ru ? "НАЧАЛО ПУТЕШЕСТВИЯ" : "САЯКАТКА ЧЕЙИН"}</span><span>{travelDate(startDate,locale)}</span></div>}
      {enabled.has("rsvp") && <section className="santo-rsvp" data-editor-block="rsvp" id="santo-rsvp">
        <div className="santo-ticket-decor" aria-hidden="true"><Ticket size={25}/>✈</div>
        <button type="button" className="santo-rsvp-cta" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          <CalendarDays size={18}/>{ru ? "ПОДТВЕРДИТЬ УЧАСТИЕ (RSVP)" : "КАТЫШУУНУ ЫРАСТОО (RSVP)"}<ArrowRight size={21}/>
        </button>
        {expanded && <div className="santo-rsvp-options">
          <button type="button" onClick={() => setRsvp("yes")} aria-pressed={rsvp==="yes"}><Check size={17}/>{ru ? "Я буду!" : "Барам!"}</button>
          <button type="button" onClick={() => setRsvp("no")} aria-pressed={rsvp==="no"}><X size={17}/>{ru ? "Не смогу" : "Бара албайм"}</button>
          {rsvp && <small role="status">{ru ? "Ответ выбран. Отправка будет доступна после подключения сервера." : "Жооп тандалды. Жөнөтүү сервер кошулганда иштейт."}</small>}
        </div>}
        <p>{ru ? "Пожалуйста, подтвердите своё участие" : "Сураныч, катышууңузду ырастаңыз"}<br/>{ru ? "до " : ""}{travelDate(deadline,locale)}</p>
        <div className="santo-ornament" aria-hidden="true">⌁ ♡ ⌁</div>
        <strong className="santo-farewell">{ru ? "С НЕТЕРПЕНИЕМ ЖДЁМ, ЧТОБЫ РАЗДЕЛИТЬ ЭТО ПРИКЛЮЧЕНИЕ С ВАМИ!" : "БУЛ УКМУШТУУ САПАРДЫ СИЗДЕР МЕНЕН БӨЛҮШҮҮНҮ КҮТӨБҮЗ!"}</strong>
      </section>}
      <div className="santo-compass" aria-hidden="true"><Compass size={55} strokeWidth={.75}/></div>
    </div>
  </article>;
}
