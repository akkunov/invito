"use client";

import { useState, type ChangeEvent } from "react";
import { Music2, Trash2, Upload } from "lucide-react";
import type { Locale } from "@/i18n/locales";

export function MusicUploader({ locale, name, error, onUpload, onRemove }: {
  locale: Locale;
  name: string | null;
  error: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try { await onUpload(file); } finally { setLoading(false); event.target.value = ""; }
  };
  return <div className="inspector-music">
    <p className="inspector-help">{locale === "ru" ? "Добавьте музыку к приглашению. Плеер включается гостем по нажатию — браузеры блокируют автозапуск со звуком." : "Чакыруу үчүн музыка кошуңуз. Музыка баскычты басканда ойнойт."}</p>
    <label className="birthday-upload-button"><Upload size={17}/>{loading ? "…" : locale === "ru" ? "Загрузить музыку" : "Музыка жүктөө"}<input type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm,.mp3,.m4a" disabled={loading} onChange={onChange}/></label>
    {name && <div className="inspector-music-item"><Music2 size={15}/><span title={name}>{name}</span><button type="button" onClick={onRemove} aria-label={locale === "ru" ? "Удалить музыку" : "Музыканы өчүрүү"}><Trash2 size={16}/></button></div>}
    {error && <p role="alert" className="birthday-upload-error">{error}</p>}
    <p className="inspector-help">{locale === "ru" ? "Аудио хранится только в этом браузере (IndexedDB), до подключения сервера." : "Музыка сервер кошулганга чейин ушул браузерде (IndexedDB) гана сакталат."}</p>
  </div>;
}
