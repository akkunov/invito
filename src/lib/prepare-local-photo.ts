/** Downscale and strip metadata from a user image before local draft storage. */
import type { Locale } from "@/i18n/locales";
import {prepareCustomerPhoto} from "@/features/invitations/prepare-customer-photo";

export async function prepareLocalPhoto(file: File, locale: Locale, maxSide = 1400, maxCharacters = 900_000): Promise<string> {
  const message = (ru: string, ky: string) => locale === "ru" ? ru : ky;
  let prepared:File;
  try{prepared=await prepareCustomerPhoto(file,{minWidth:1,minHeight:1,maxEdge:maxSide});}
  catch{throw Error(message("Не удалось прочитать фотографию. Выберите другой файл.","Сүрөт ачылган жок. Башка файлды тандаңыз."));}

  const objectUrl = URL.createObjectURL(prepared);
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
    throw new Error(message("Не удалось сжать фотографию для локального хранения.", "Сүрөттү жергиликтүү сактоо үчүн кысуу мүмкүн болгон жок."));
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(message("Не удалось обработать фотографию.", "Сүрөттү иштетүү мүмкүн болгон жок."));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
