/** Downscale and strip metadata from a user image before local draft storage. */
import type { Locale } from "@/i18n/locales";

export async function prepareLocalPhoto(file: File, locale: Locale, maxSide = 1400, maxCharacters = 900_000): Promise<string> {
  const message = (ru: string, ky: string) => locale === "ru" ? ru : ky;
  if (!(["image/jpeg", "image/png", "image/webp", "image/avif"] as string[]).includes(file.type)) {
    throw new Error(message("Поддерживаются JPEG, PNG, WebP и AVIF.", "JPEG, PNG, WebP жана AVIF форматтары колдоого алынат."));
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error(message("Размер фотографии должен быть не больше 10 МБ.", "Сүрөттүн өлчөмү 10 МБдан ашпашы керек."));
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const photo = new Image();
    photo.src = objectUrl;
    await photo.decode();
    const scale = Math.min(1, maxSide / Math.max(photo.naturalWidth, photo.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(photo.naturalWidth * scale);
    canvas.height = Math.round(photo.naturalHeight * scale);
    if (canvas.width === 0 || canvas.height === 0) throw new Error(message("Не удалось прочитать фотографию.", "Сүрөттү ачуу мүмкүн болгон жок."));
    const context = canvas.getContext("2d");
    if (!context) throw new Error(message("Обработка фото недоступна в этом браузере.", "Бул браузерде сүрөттү иштетүү жеткиликтүү эмес."));
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(photo, 0, 0, canvas.width, canvas.height);

    // JPEG is broadly supported; reducing quality keeps localStorage below browser limits.
    for (const quality of [0.83, 0.7, 0.55, 0.4]) {
      const result = canvas.toDataURL("image/jpeg", quality);
      if (result.length <= maxCharacters) return result;
    }
    throw new Error(message("Слишком сложное изображение. Выберите фотографию меньшего разрешения.", "Сүрөт өтө чоң. Сапаты төмөнүрөөк сүрөт тандаңыз."));
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(message("Не удалось обработать фотографию.", "Сүрөттү иштетүү мүмкүн болгон жок."));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
