import type { TemplateDefinition } from "@/features/invitations/template.types";

export type EditorialVariant = "birthday" | "wedding" | "kyz";

export const editorialThemes = ["editorial-birthday", "editorial-wedding", "editorial-kyz"] as const;

/** Photo assets are demo imagery; the user's cover replaces the photo, never the decoration. */
export const editorialDesigns: Record<EditorialVariant, { image: string; paper: string; ink: string; accent: string }> = {
  birthday: { image: "/images/reference/burgundy-sample.webp", paper: "#F2EBE3", ink: "#292421", accent: "#A78B70" },
  wedding: { image: "/images/reference/blue-sample.webp", paper: "#F7F5F0", ink: "#303332", accent: "#867D6D" },
  kyz: { image: "/images/birthday/bloom-demo.jpg", paper: "#F4E7DE", ink: "#4C3638", accent: "#A25750" },
};

export function getEditorialVariant(templateId: string): EditorialVariant | null {
  if (templateId === "editorial-birthday") return "birthday";
  if (templateId === "editorial-wedding") return "wedding";
  if (templateId === "editorial-kyz-uzatuu") return "kyz";
  return null;
}

export const editorialTemplates: readonly TemplateDefinition[] = [
  {
    id: "editorial-birthday", category: "birthday", theme: "editorial-birthday", premium: true,
    name: { ru: "Editorial Birthday", ky: "Editorial Birthday" },
    description: { ru: "Журнальная композиция: крупный портрет, возраст и история вечера", ky: "Журнал стили: чоң портрет, жаш жана майрамдын баяны" },
    accent: editorialDesigns.birthday.accent,
    defaultContent: {
      name1: "Ксения", name2: "", age: 25,
      title: { ru: "Приглашение на день рождения", ky: "Туулган күнгө чакыруу" },
      message: { ru: "Дорогие друзья! Приглашаю вас разделить со мной мой день рождения. Буду счастлива видеть вас рядом в этот особенный вечер.", ky: "Кымбаттуу достор! Туулган күнүмдү мени менен бирге белгилөөгө чакырам. Бул өзгөчө кечте сиздерди көрүүгө кубанычтамын." },
      venue: { ru: "Банкетный зал «Sky»", ky: "«Sky» банкет залы" }, city: { ru: "Бишкек", ky: "Бишкек" },
      dateTimeLocal: "2027-08-20T18:00", timezone: "Asia/Bishkek",
      dressCode: { ru: "Элегантный casual в натуральных оттенках", ky: "Табигый түстөгү жарашыктуу кийим" },
      giftNote: { ru: "Ваше присутствие — главный подарок для меня!", ky: "Сиздердин келгениңиздер мен үчүн эң чоң белек!" },
    },
    defaultProgram: [
      { id: "ed-b-welcome", time: "17:30", title: { ru: "Сбор гостей", ky: "Конокторду тосуу" }, description: { ru: "Приветственные напитки и фотозона", ky: "Суусундуктар жана сүрөткө түшүү" } },
      { id: "ed-b-start", time: "18:00", title: { ru: "Начало праздника", ky: "Майрамдын башталышы" }, description: { ru: "Встреча и поздравления", ky: "Жолугушуу жана куттуктоо" } },
      { id: "ed-b-dinner", time: "19:00", title: { ru: "Праздничный ужин", ky: "Майрамдык кечки тамак" }, description: { ru: "Ужин и приятные разговоры", ky: "Тамак жана жылуу баарлашуу" } },
      { id: "ed-b-cake", time: "21:00", title: { ru: "Торт и танцы", ky: "Торт жана бий" }, description: { ru: "Самый сладкий момент вечера", ky: "Кеченин эң таттуу учуру" } },
    ],
  },
  {
    id: "editorial-wedding", category: "wedding", theme: "editorial-wedding", premium: true,
    name: { ru: "Editorial Wedding", ky: "Editorial Wedding" },
    description: { ru: "Свадьба как обложка журнала: фотография, типографика и спокойная элегантность", ky: "Журнал мукабасындай үйлөнүү тою: сүрөт жана назик типография" },
    accent: editorialDesigns.wedding.accent,
    defaultContent: {
      name1: "Азамат", name2: "Айпери",
      title: { ru: "Приглашение на нашу свадьбу", ky: "Үйлөнүү тоюбузга чакыруу" },
      message: { ru: "Дорогие родные и друзья! Мы будем счастливы разделить с вами день, когда начнётся наша семейная история.", ky: "Кадырлуу туугандар жана достор! Үй-бүлөлүк тарыхыбыз башталган өзгөчө күндү сиздер менен бирге өткөрүүгө кубанычтабыз." },
      venue: { ru: "Ресторан «Ала-Тоо»", ky: "«Ала-Тоо» рестораны" }, city: { ru: "Бишкек", ky: "Бишкек" },
      dateTimeLocal: "2027-06-20T17:00", timezone: "Asia/Bishkek",
      dressCode: { ru: "Вечерние образы в спокойных оттенках", ky: "Тынч түстөгү кечки кийимдер" },
      giftNote: { ru: "Самый ценный подарок — ваше присутствие рядом с нами", ky: "Эң баалуу белек — сиздердин биз менен бирге болгонуңуздар" },
    },
    defaultProgram: [
      { id: "ed-welcome", time: "16:30", title: { ru: "Встреча гостей", ky: "Конокторду тосуу" }, description: { ru: "Фотографии и приветственные напитки", ky: "Сүрөткө түшүү жана суусундуктар" } },
      { id: "ed-ceremony", time: "17:00", title: { ru: "Церемония", ky: "Нике аземи" }, description: { ru: "Наш особенный момент", ky: "Биздин өзгөчө ирмем" } },
      { id: "ed-banquet", time: "18:00", title: { ru: "Свадебный банкет", ky: "Той дасторкону" }, description: { ru: "Ужин, тосты и поздравления", ky: "Тамак, каалоо-тилектер жана куттуктоолор" } },
      { id: "ed-dance", time: "20:30", title: { ru: "Первый танец", ky: "Алгачкы бий" }, description: { ru: "Танцы и праздничный вечер", ky: "Бий жана майрамдык кече" } },
    ],
  },
  {
    id: "editorial-kyz-uzatuu", category: "kyz-uzatuu", theme: "editorial-kyz", premium: true,
    name: { ru: "Editorial Кыз узатуу", ky: "Editorial Кыз узатуу" },
    description: { ru: "Современный журнальный дизайн с портретом невесты и кыргызским орнаментом", ky: "Кыздын портрети жана кыргыз оймосу менен заманбап журнал стили" },
    accent: editorialDesigns.kyz.accent,
    defaultContent: {
      name1: "Айпери", name2: "",
      title: { ru: "Кыз узатуу", ky: "Кыз узатуу" },
      message: { ru: "Дорогие родные и близкие! Приглашаем вас разделить с нашей семьёй особенный вечер проводов дочери в новую жизнь.", ky: "Урматтуу туугандар жана жакындар! Кызыбызды узатуу салтанатына келип, үй-бүлөбүздүн кубанычын тең бөлүшүңүздөр." },
      venue: { ru: "Банкетный зал «Ак Сарай»", ky: "«Ак Сарай» банкет залы" }, city: { ru: "Ош", ky: "Ош" },
      dateTimeLocal: "2027-09-12T17:00", timezone: "Asia/Bishkek",
      dressCode: { ru: "Праздничные образы; национальные элементы приветствуются", ky: "Майрамдык кийим; улуттук элементтер жарашат" },
      giftNote: { ru: "Ваши благословения и добрые пожелания бесценны", ky: "Сиздердин батаңыздар жана ак тилектериңиздер биз үчүн баалуу" },
    },
    defaultProgram: [
      { id: "ed-k-welcome", time: "16:30", title: { ru: "Сбор гостей", ky: "Конокторду тосуу" }, description: { ru: "Встреча родных и близких", ky: "Туугандар менен жолугушуу" } },
      { id: "ed-k-start", time: "17:00", title: { ru: "Начало торжества", ky: "Салтанаттын башталышы" }, description: { ru: "Тёплые слова и поздравления", ky: "Жылуу сөздөр жана куттуктоолор" } },
      { id: "ed-k-bata", time: "19:00", title: { ru: "Бата и пожелания", ky: "Бата жана ак тилектер" }, description: { ru: "Напутствия новой семье", ky: "Жаңы үй-бүлөгө каалоолор" } },
      { id: "ed-k-farewell", time: "20:00", title: { ru: "Кыз узатуу", ky: "Кыз узатуу" }, description: { ru: "Торжественное провожание невесты", ky: "Кызды салтанаттуу узатуу" } },
    ],
  },
];
