import type { TemplateDefinition } from "@/features/invitations/template.types";

const sampleDate = "2027-06-20T18:00";

function birthdayContent(
  name: string,
  age: number,
  titleRu: string,
  titleKy: string,
  messageRu: string,
  messageKy: string,
): TemplateDefinition["defaultContent"] {
  return {
    name1: name,
    name2: "",
    age,
    title: { ru: titleRu, ky: titleKy },
    message: { ru: messageRu, ky: messageKy },
    venue: { ru: "Ресторан «Ала-Тоо»", ky: "«Ала-Тоо» рестораны" },
    city: { ru: "Бишкек", ky: "Бишкек" },
    dateTimeLocal: sampleDate,
    timezone: "Asia/Bishkek",
  };
}

export const birthdayTemplates: readonly TemplateDefinition[] = [
  {
    id: "midnight-aura", category: "birthday", theme: "birthday-midnight", premium: true,
    name: { ru: "Midnight Aura", ky: "Midnight Aura" },
    description: { ru: "Портрет, кинематографический свет и история на прокрутке", ky: "Портрет, кино сыяктуу жарык жана жылдырма баян" },
    accent: "#C59A64",
    defaultContent: birthdayContent("Азамат", 25, "Мой день рождения", "Менин туулган күнүм", "Приглашаю вас разделить со мной этот особенный вечер. Будем создавать воспоминания вместе.", "Ушул өзгөчө кечти мени менен бирге өткөрүүгө чакырам. Жакшы эскерүүлөрдү чогуу жаратабыз."),
  },
  {
    id: "soft-bloom", category: "birthday", theme: "birthday-bloom", premium: false,
    name: { ru: "Soft Bloom", ky: "Soft Bloom" },
    description: { ru: "Воздушный цветочный портрет и нежная история", ky: "Назик гүлдөр жана жылуу баяндоо" },
    accent: "#D88EA7",
    defaultContent: birthdayContent("Айпери", 23, "Мой день рождения", "Менин туулган күнүм", "Этот день будет ещё прекраснее, если рядом будете вы. Жду вас на своём празднике!", "Бул күн сиздер менен дагы да кооз болот. Майрамыма келип кубанычымды бөлүшүңүздөр!"),
  },
  {
    id: "golden-milestone", category: "anniversary", theme: "birthday-milestone", premium: true,
    name: { ru: "Golden Milestone", ky: "Golden Milestone" },
    description: { ru: "Золотой юбилей с крупной цифрой возраста и торжественным портретом", ky: "Чоң сан, алтын кооздук жана салтанаттуу портрет" },
    accent: "#C9A45B",
    defaultContent: birthdayContent("Бакытбек", 50, "Мой юбилей", "Менин мааракем", "Дорогие друзья и близкие! Приглашаю вас на праздничный вечер в честь моего юбилея.", "Кадырлуу туугандар жана достор! Сиздерди мааракеме арналган салтанаттуу кечеге чакырам."),
  },
];

export type BirthdayVariant = "midnight" | "bloom" | "milestone";

export function getBirthdayVariant(templateId: string): BirthdayVariant | null {
  if (templateId === "midnight-aura") return "midnight";
  if (templateId === "soft-bloom") return "bloom";
  if (templateId === "golden-milestone") return "milestone";
  return null;
}
