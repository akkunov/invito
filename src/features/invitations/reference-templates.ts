import type { TemplateDefinition } from "@/features/invitations/template.types";

/** Nine user-supplied visual references, rebuilt as editable invitations. */
export const referenceTemplateData = [
  { id: "wedding-bouquet-gold", theme: "reference-bouquet", category: "wedding", ru: "Золотые цветы", ky: "Алтын гүлдөр", descriptionRu: "Кремовая бумага, золотая каллиграфия, несменяемый графический букет", descriptionKy: "Ачык түстөгү кагаз жана алтын гүлдөр", accent: "#BD9400", paper: "#FCF6F1", ink: "#4D4B4B", decor: "/images/reference/bouquet-ornament.webp", image: null, premium: false },
  { id: "wedding-ink-monogram", theme: "reference-minimal", category: "wedding", ru: "Каллиграфия", ky: "Каллиграфия", descriptionRu: "Чёрно-белая монограмма с тонкой ботанической графикой", descriptionKy: "Ак-кара каллиграфия жана гүл", accent: "#353535", paper: "#FFFFFF", ink: "#353535", decor: "/images/reference/minimal-ornament.webp", image: null, premium: false },
  { id: "wedding-olive-contours", theme: "reference-contours", category: "wedding", ru: "Линии путешествия", ky: "Саякат сызыктары", descriptionRu: "Оливковый фон и топографический узор по краям", descriptionKy: "Зайтун түсү жана топографиялык кооздук", accent: "#EFEFAE", paper: "#656947", ink: "#F5F2D5", decor: "/images/reference/contours-ornament.webp", image: null, premium: true },
  { id: "wedding-rose-watercolor", theme: "reference-roses", category: "wedding", ru: "Акварельные розы", ky: "Акварель розалары", descriptionRu: "Розы и зелёная типографика на белой бумаге", descriptionKy: "Ак кагаздагы розалар", accent: "#7B8F68", paper: "#FFFFFF", ink: "#667F5D", decor: "/images/reference/roses-ornament.webp", image: null, premium: false },
  { id: "wedding-blue-arch", theme: "reference-blue", category: "wedding", ru: "Голубая арка", ky: "Көгүлтүр арка", descriptionRu: "Фотография пары в арке и белая растительная графика", descriptionKy: "Аркадагы жубайлардын сүрөтү", accent: "#FFFFFF", paper: "#89AACA", ink: "#FFFFFF", decor: "/images/reference/blue-ornament.webp", image: "/images/reference/blue-sample.webp", premium: true },
  { id: "bridal-burgundy-party", theme: "reference-burgundy", category: "kyz-uzatuu", ru: "Бордовый вечер", ky: "Күрөң кызыл кече", descriptionRu: "Смелый девичник: бордо, чёрно-белый портрет и крупный заголовок", descriptionKy: "Кыз-келиндер кечеси үчүн бордо дизайн", accent: "#F5D77A", paper: "#8A1D32", ink: "#FFE2A5", decor: null, image: "/images/reference/burgundy-sample.webp", premium: true },
  { id: "wedding-white-gold-leaves", theme: "reference-leaves", category: "wedding", ru: "Тонкие золотые листья", ky: "Алтын жалбырактар", descriptionRu: "Мягкое белое поле и золотые листья по краям", descriptionKy: "Ак талаадагы алтын жалбырактар", accent: "#C89C24", paper: "#FCFCFA", ink: "#111111", decor: "/images/reference/leaves-ornament.webp", image: null, premium: false },
  { id: "birthday-photo-editorial", theme: "reference-editorial", category: "birthday", ru: "Редакционный коллаж", ky: "Сүрөт коллажы", descriptionRu: "Песочный журнал и динамичная фотосетка ко дню рождения", descriptionKy: "Туулган күнгө фото-коллаж", accent: "#FFFCF1", paper: "#D3B66A", ink: "#FFFFFF", decor: null, image: "/images/reference/editorial-sample.webp", premium: true },
  { id: "wedding-gold-roundel", theme: "reference-roundel", category: "wedding", ru: "Золотая монограмма", ky: "Алтын монограмма", descriptionRu: "Кремовая бумага, круглая монограмма и фиксированные боковые ветви", descriptionKy: "Алтын монограмма жана гүл сабактары", accent: "#BC9200", paper: "#FFF9F4", ink: "#464646", decor: "/images/reference/monogram-ornament.webp", image: null, premium: false },
] as const;

export type ReferenceTemplateId = (typeof referenceTemplateData)[number]["id"];
export type ReferenceTheme = (typeof referenceTemplateData)[number]["theme"];
export type ReferenceTemplateArtwork = (typeof referenceTemplateData)[number];

export function getReferenceTemplate(id: string): ReferenceTemplateArtwork | undefined {
  return referenceTemplateData.find((item) => item.id === id);
}

function createContent(item: ReferenceTemplateArtwork): TemplateDefinition["defaultContent"] {
  const isBirthday = item.category === "birthday";
  const bridal = item.category === "kyz-uzatuu";
  const name1 = isBirthday ? "Ксения" : bridal ? "Марина" : "Мария";
  return {
    name1,
    name2: isBirthday || bridal ? "" : "Александр",
    age: isBirthday ? 25 : undefined,
    title: { ru: isBirthday ? "День рождения" : bridal ? "Девичник" : "Приглашение на свадьбу", ky: isBirthday ? "Туулган күн" : bridal ? "Кыз-келиндер кечеси" : "Үйлөнүү тоюна чакыруу" },
    message: { ru: isBirthday ? "Приглашаю тебя отпраздновать вместе со мной!" : bridal ? "Жду вас на незабываемом вечере с подругами!" : "Будем счастливы разделить с вами самый важный день нашей жизни.", ky: isBirthday ? "Туулган күнүмө чакырам!" : bridal ? "Кыздар кечебизге келиңиздер!" : "Биздин өзгөчө күнүбүздө сиздерди көрүүгө кубанычтабыз!" },
    venue: { ru: "Банкетный зал «Ала-Тоо»", ky: "«Ала-Тоо» банкет залы" },
    city: { ru: "Бишкек", ky: "Бишкек" },
    dateTimeLocal: "2027-08-20T18:00",
    timezone: "Asia/Bishkek",
  };
}

export const referenceTemplates: readonly TemplateDefinition[] = referenceTemplateData.map((item) => ({
  id: item.id, theme: item.theme, category: item.category, premium: item.premium,
  name: { ru: item.ru, ky: item.ky },
  description: { ru: item.descriptionRu, ky: item.descriptionKy },
  accent: item.accent,
  defaultContent: createContent(item),
}));
