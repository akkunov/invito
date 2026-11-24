"use client";

import {useState, type ChangeEvent} from "react";
import {ImagePlus, X} from "lucide-react";
import type {Locale} from "@/i18n/locales";
import {prepareLocalPhoto} from "@/lib/prepare-local-photo";

export function BirthdayGalleryUploader({locale, photos, onChange}: {
    locale: Locale;
    photos: string[];
    onChange: (photos: string[]) => void;
}) {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");

    const addImages = async (event: ChangeEvent<HTMLInputElement>, replace=false) => {
        const files = Array.from(event.target.files ?? []);
        if (!files.length) return;
        const limit=replace?4:4-photos.length;
        if(files.length>limit){setError(locale==="ru"?"Выберите не больше "+limit+" фото.":"Бир жолуда "+limit+" сүрөттөн ашык тандабаңыз.");event.target.value="";return;}
        setProcessing(true);
        setError("");
        try {
            const nextPhotos:string[]=[];
            for(const file of files)nextPhotos.push(await prepareLocalPhoto(file, locale, 900, 220_000));
            onChange(replace?nextPhotos:[...photos,...nextPhotos]);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : locale === "ru" ? "Ошибка обработки фотографий." : "Сүрөттөрдү иштетүүдө ката кетти.");
        } finally {
            event.target.value = "";
            setProcessing(false);
        }
    };
    return <div className="birthday-gallery-control">
        <p className="inspector-help">{locale === "ru" ? "Добавьте до четырёх фотографий. Их увидят гости в отдельной секции." : "Төрткө чейин сүрөт кошуңуз. Алар өзүнчө бөлүктө көрсөтүлөт."}</p>
        <div className="birthday-upload-gallery-preview">{photos.map((photo, index) => <div
            key={`${index}-${photo.slice(-10)}`} className="birthday-gallery-chip"
            style={{backgroundImage: `url(${photo})`}}>
            <button type="button"
                    aria-label={locale === "ru" ? `Удалить фото ${index + 1}` : `${index + 1}-сүрөттү өчүрүү`}
                    disabled={processing} onClick={() => onChange(photos.filter((_, at) => at !== index))}><X size={14}/></button>
        </div>)}</div>
        {photos.length < 4 && <label className="birthday-upload-button"><ImagePlus
            size={17}/>{processing ? (locale === "ru" ? "Обрабатываем…" : "Иштетилүүдө…") : (locale === "ru" ? "Добавить фото" : "Сүрөт кошуу")}
            <input type="file" multiple accept="image/*,.heic,.heif" disabled={processing}
                   onChange={event=>void addImages(event)}
                   aria-label={locale === "ru" ? "Выбрать фотографии для галереи" : "Галереяга сүрөттөрдү тандоо"}/>
        </label>}
        {photos.length>0&&<label className="birthday-upload-button"><ImagePlus size={17}/>{locale==="ru"?"Заменить фотографии":"Сүрөттөрдү алмаштыруу"}<input type="file" multiple accept="image/*,.heic,.heif" disabled={processing} onChange={event=>void addImages(event,true)}/></label>}
        {error && <p className="birthday-upload-error" role="alert">{error}</p>}
    </div>;
}
