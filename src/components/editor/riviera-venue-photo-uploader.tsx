"use client";

import { useState, type ChangeEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { prepareLocalPhoto } from "@/lib/prepare-local-photo";
import type { Locale } from "@/i18n/locales";

export function RivieraVenuePhotoUploader({ locale, photo, onChange }: {
  locale: Locale;
  photo: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    setError("");
    try {
      onChange(await prepareLocalPhoto(file, locale, 1100, 650_000));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (locale === "ru" ? "Ошибка обработки фото." : "Сүрөттү иштетүүдө ката."));
    } finally {
      event.target.value = "";
      setProcessing(false);
    }
  };
  return <div className="birthday-upload-control">
    <p className="inspector-help">{locale === "ru" ? "Фото ресторана" : "Ресторандын сүрөтү"}</p>
    {photo && <div className="riviera-venue-upload-preview" style={{backgroundImage:`url("${photo}")`}} role="img" aria-label={locale === "ru" ? "Выбранное фото ресторана" : "Тандалган ресторан сүрөтү"}/>}
    <label className="birthday-upload-button"><ImagePlus size={17}/>
      {processing ? (locale === "ru" ? "Обрабатываем…" : "Иштетилүүдө…") : (locale === "ru" ? "Загрузить / сменить ресторан" : "Ресторандын сүрөтүн өзгөртүү")}
      <input type="file" accept="image/*,.heic,.heif" disabled={processing} onChange={upload} aria-label={locale === "ru" ? "Выбрать фото ресторана" : "Ресторандын сүрөтүн тандоо"}/>
    </label>
    {photo && <button type="button" className="birthday-remove-button" onClick={() => onChange(null)}><Trash2 size={15}/>{locale === "ru" ? "Вернуть исходную фотографию" : "Баштапкы сүрөткө кайтуу"}</button>}
    {error && <p className="birthday-upload-error" role="alert">{error}</p>}
  </div>;
}
