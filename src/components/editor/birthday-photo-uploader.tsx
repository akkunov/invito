"use client";

import {useState, type ChangeEvent} from "react";
import {ImagePlus, Trash2} from "lucide-react";
import {prepareLocalPhoto} from "@/lib/prepare-local-photo";
import type {Locale} from "@/i18n/locales";

export function BirthdayPhotoUploader({locale, hasPhoto, onChange}: {
    locale: Locale;
    hasPhoto: boolean;
    onChange: (dataUrl: string | null) => void;
}) {
    const [error, setError] = useState("");
    const [processing, setProcessing] = useState(false);

    const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setProcessing(true);
        setError("");
        try {
            onChange(await prepareLocalPhoto(file, locale, 1120, 460_000));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : locale === "ru" ? "Не удалось загрузить фото." : "Сүрөттү жүктөө мүмкүн болгон жок.");
        } finally {
            event.target.value = "";
            setProcessing(false);
        }
    };

    return <div className="birthday-upload-control">
        <label className="birthday-upload-button"><ImagePlus
            size={17}/>{processing ? (locale === "ru" ? "Обрабатываем…" : "Иштетилүүдө…") : (locale === "ru" ? "Загрузить / сменить обложку" : "Мукабаны жүктөө / өзгөртүү")}
            <input aria-label={locale === "ru" ? "Выбрать фото именинника" : "Туулган күн ээсинин сүрөтүн тандоо"}
                   type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={processing}
                   onChange={handleFile}/>
        </label>
        {hasPhoto && <button type="button" className="birthday-remove-button" onClick={() => onChange(null)}><Trash2
            size={15}/>{locale === "ru" ? "Удалить обложку" : "Мукабаны өчүрүү"}</button>}
        {error && <p className="birthday-upload-error" role="alert">{error}</p>}
        <p className="inspector-help">{locale === "ru" ? "Фото уменьшается и сохраняется только в этом браузере. До 10 МБ, JPEG/PNG/WebP/AVIF." : "Сүрөт кичирейтилип ушул браузерде гана сакталат. 10 МБ чейин, JPEG/PNG/WebP/AVIF."}</p>
    </div>;
}
