import type { TemplateDefinition } from "@/features/invitations/template.types";

/** Exact reference art direction: editable text and date, fixed photo collage geometry. */
export const rivieraTemplate: TemplateDefinition = {
  id: "editorial-riviera-wedding",
  category: "wedding",
  theme: "editorial-riviera",
  premium: true,
  name: { ru: "Editorial Riviera Wedding", ky: "Editorial Riviera Wedding" },
  description: {
    ru: "Свадебная редакционная композиция: крупные имена, фото пары, дата, вилла и программа вечера",
    ky: "Чоң ысымдар, түгөйлөрдүн сүрөтү, күн, ресторан жана той программасы",
  },
  accent: "#B4A084",
  defaultContent: {
    name1: "Анна",
    name2: "Михаил",
    title: { ru: "Приглашаем на нашу свадьбу", ky: "Үйлөнүү тоюбузга чакырабыз" },
    message: {
      ru: "Дорогие наши!\n\nС огромной радостью приглашаем вас разделить с нами важный и счастливый день — нашу свадьбу!",
      ky: "Урматтуу жакындарыбыз!\n\nБиздин эң бактылуу күнүбүздү бирге бөлүшүүгө чакырабыз!",
    },
    venue: { ru: "Villa Riviera", ky: "Villa Riviera" },
    city: { ru: "МО, Одинцовский р-н, пос. Николина Гора, д. 17", ky: "Николина Гора, Одинцово району, 17" },
    dateTimeLocal: "2025-06-14T16:00",
    timezone: "Asia/Bishkek",
  },
  defaultProgram: [
    { id: "rv-1", time: "16:00", title: { ru: "Сбор гостей", ky: "Конокторду тосуу" }, description: { ru: "Приветственные напитки, фотозона", ky: "Суусундуктар, сүрөткө түшүү" } },
    { id: "rv-2", time: "17:00", title: { ru: "Церемония", ky: "Үйлөнүү аземи" }, description: { ru: "Самый трогательный момент", ky: "Эң таасирдүү ирмем" } },
    { id: "rv-3", time: "18:00", title: { ru: "Праздничный ужин", ky: "Майрамдык кечки тамак" }, description: { ru: "Банкет, тосты и тёплые слова", ky: "Дасторкон, каалоо-тилектер" } },
    { id: "rv-4", time: "22:00", title: { ru: "Вечеринка", ky: "Кеченин уландысы" }, description: { ru: "Танцы, музыка и много эмоций", ky: "Бий, музыка жана жагымдуу көз ирмемдер" } },
  ],
};
