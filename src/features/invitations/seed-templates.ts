import { referenceTemplates } from "@/features/invitations/reference-templates";
import { birthdayTemplates } from "@/features/invitations/birthday-templates";
import type { TemplateDefinition, TemplateCategory } from "@/features/invitations/template.types";

const sampleDate = "2027-06-20T17:00";
const weddingMessage = { ru: "Приглашаем вас разделить с нами радость нашего особенного дня.", ky: "Биз сиздерди кубанычыбызды бөлүшүүгө чакырабыз!" };
const celebrationMessage = { ru: "Будем рады видеть вас на нашем празднике!", ky: "Сиздерди майрамыбыздан көрүүгө кубанычтабыз!" };

function content(
  titleRu: string,
  titleKy: string,
  message = weddingMessage,
  name1 = "Азамат",
  name2 = "Айпери",
): TemplateDefinition["defaultContent"] {
  return {
    name1,
    name2,
    title: { ru: titleRu, ky: titleKy },
    message,
    venue: { ru: "Ресторан «Ала-Тоо»", ky: "«Ала-Тоо» рестораны" },
    city: { ru: "Бишкек", ky: "Бишкек" },
    dateTimeLocal: sampleDate,
    timezone: "Asia/Bishkek",
  };
}

export const categories: readonly { id: TemplateCategory; name: { ru: string; ky: string } }[] = [
  { id: "wedding", name: { ru: "Свадьба", ky: "Үйлөнүү той" } },
  { id: "kyz-uzatuu", name: { ru: "Кыз узатуу", ky: "Кыз узатуу" } },
  { id: "beshik-toi", name: { ru: "Бешик той", ky: "Бешик той" } },
  { id: "birthday", name: { ru: "День рождения", ky: "Туулган күн" } },
  { id: "anniversary", name: { ru: "Юбилей", ky: "Маараке" } },
  { id: "nike", name: { ru: "Нике кыюу", ky: "Нике кыюу" } },
  { id: "tushoo", name: { ru: "Тушоо кесүү", ky: "Тушоо кесүү" } },
  { id: "sunnot", name: { ru: "Сүннөт той", ky: "Сүннөт той" } },
  { id: "corporate", name: { ru: "Корпоратив", ky: "Корпоратив" } },
];

export const templates: readonly TemplateDefinition[] = [
  { id: "mountain-vows", category: "wedding", theme: "sunset", premium: true, name: { ru: "Горная свадьба", ky: "Тоодогу үйлөнүү той" }, description: { ru: "Кинематографичный закат в горах", ky: "Тоодогу күн батышы" }, accent: "#E96C43", defaultContent: content("Наша свадьба", "Үйлөнүү той") },
  { id: "ivory-letter", category: "wedding", theme: "ivory", premium: false, name: { ru: "Элегантная классика", ky: "Классикалык назиктик" }, description: { ru: "Светлая бумага, тонкая рамка и цветы", ky: "Ак кагаз, жука алкак жана гүлдөр" }, accent: "#957B60", defaultContent: content("Наша свадьба", "Үйлөнүү той") },
  { id: "jade-heritage", category: "kyz-uzatuu", theme: "jade", premium: true, name: { ru: "Жашыл мурас", ky: "Жашыл мурас" }, description: { ru: "Изумрудная палитра и золотой орнамент", ky: "Жашыл түс жана алтын оймо" }, accent: "#D8B66A", defaultContent: content("Кыз узатуу", "Кыз узатуу", celebrationMessage, "Айпери", "") },
  { id: "sakura-farewell", category: "kyz-uzatuu", theme: "sakura", premium: false, name: { ru: "Розовый сад", ky: "Кызгылт бак" }, description: { ru: "Романтичные цветочные мотивы", ky: "Назик гүл мотивдери" }, accent: "#B85E83", defaultContent: content("Кыз узатуу", "Кыз узатуу", celebrationMessage, "Айпери", "") },
  { id: "cradle-light", category: "beshik-toi", theme: "honey", premium: false, name: { ru: "Бешик той — нежность", ky: "Бешик той — назиктик" }, description: { ru: "Тёплый уют и мягкие оттенки", ky: "Жылуу жана жумшак түстөр" }, accent: "#A87D4C", defaultContent: content("Бешик той", "Бешик той", celebrationMessage, "Бакыт", "") },
  { id: "midnight-vows", category: "nike", theme: "noir", premium: true, name: { ru: "Ночной никах", ky: "Түнкү нике" }, description: { ru: "Тёмный сдержанный дизайн", ky: "Караңгы жана салмактуу дизайн" }, accent: "#D6AD77", defaultContent: content("Нике кыюу", "Нике кыюу") },
  { id: "birthday-air", category: "birthday", theme: "sky", premium: false, name: { ru: "Праздник в облаках", ky: "Асмандагы майрам" }, description: { ru: "Воздушные шары и яркий праздник", ky: "Шарлар жана жарык маанай" }, accent: "#F28D70", defaultContent: content("День рождения", "Туулган күн", celebrationMessage, "Айдана", "") },
  { id: "golden-years", category: "anniversary", theme: "gold", premium: true, name: { ru: "Золотой юбилей", ky: "Алтын маараке" }, description: { ru: "Графит и эффект золотой фольги", ky: "Кара түс жана алтын кооздук" }, accent: "#D3A24D", defaultContent: content("Юбилей", "Маараке", celebrationMessage, "Аскар", "") },
  { id: "first-steps", category: "tushoo", theme: "mint", premium: false, name: { ru: "Первый шаг", ky: "Алгачкы кадам" }, description: { ru: "Мятные оттенки и детские детали", ky: "Жалбыз түсү жана балдар темасы" }, accent: "#5A967B", defaultContent: content("Тушоо кесүү", "Тушоо кесүү", celebrationMessage, "Бекзат", "") },
  { id: "sky-festival", category: "sunnot", theme: "azure", premium: true, name: { ru: "Сүннөт той — небо", ky: "Сүннөт той — асман" }, description: { ru: "Бирюзовый праздник с орнаментом", ky: "Көгүш түстөгү майрам" }, accent: "#49B9C6", defaultContent: content("Сүннөт той", "Сүннөт той", celebrationMessage, "Нурислам", "") },
  { id: "monochrome-union", category: "wedding", theme: "mono", premium: false, name: { ru: "Чёрно-белая история", ky: "Ак-кара окуя" }, description: { ru: "Редакционная типографика и минимализм", ky: "Минимализм жана типография" }, accent: "#1C1C1C", defaultContent: content("Наша свадьба", "Үйлөнүү той") },
  { id: "evening-garden", category: "corporate", theme: "garden", premium: true, name: { ru: "Вечер в саду", ky: "Бактагы кече" }, description: { ru: "Современная ботаническая графика", ky: "Заманбап ботаникалык графика" }, accent: "#809E66", defaultContent: content("Особенный вечер", "Өзгөчө кече", celebrationMessage, "Команда", "INVITO") },
  ...birthdayTemplates,
  ...referenceTemplates,
];

export function findTemplateById(id: string): TemplateDefinition | undefined {
  return templates.find((template) => template.id === id);
}
