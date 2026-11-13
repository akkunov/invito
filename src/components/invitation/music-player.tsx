"use client";

import { useEffect, useRef, useState } from "react";
import { Music2, Pause, Play } from "lucide-react";
import type { Locale } from "@/i18n/locales";

/** Never autoplays audio; explicit user click satisfies browser autoplay policies. */
export function MusicPlayer({ src, locale, name }: { src: string; locale: Locale; name?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setPlaying(false); audioRef.current?.pause(); }, [src]);
  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); setPlaying(true); } catch { setPlaying(false); }
    } else { audio.pause(); setPlaying(false); }
  };
  return <div className="invite-music-player">
    <audio ref={audioRef} src={src} loop preload="none" onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} />
    <button type="button" onClick={toggle} aria-label={playing ? (locale === "ru" ? "Остановить музыку" : "Музыканы токтотуу") : (locale === "ru" ? "Включить музыку" : "Музыканы күйгүзүү")} aria-pressed={playing}>
      {playing ? <Pause size={17} /> : <Play size={17} />}
      <Music2 size={16} aria-hidden="true" />
      <span>{name || (locale === "ru" ? "Музыка приглашения" : "Чакыруу музыкасы")}</span>
    </button>
  </div>;
}
