import { nationalDesigns, type NationalDesign } from "@/features/invitations/national-templates";
import type { TemplateDefinition } from "@/features/invitations/template.types";

export const collectionDesigns = [
  {
    "id": "collection-fashion-editorial",
    "name": {
      "ru": "Fashion Editorial",
      "ky": "Журнал стилиндеги"
    },
    "category": "wedding",
    "theme": "fashion-editorial",
    "paper": "#F8F6F2",
    "ink": "#151516",
    "accent": "#9D8A7B",
    "image": "/images/birthday/bloom-demo.jpg",
    "description": {
      "ru": "Фотография пары и журнальная типографика",
      "ky": "Жуптун сүрөтү жана журнал стили"
    },
    "isHeritage": false
  },
  {
    "id": "collection-romantic-floral",
    "name": {
      "ru": "Romantic Floral",
      "ky": "Гүлдүү романтика"
    },
    "category": "wedding",
    "theme": "romantic-floral",
    "paper": "#FFF2F2",
    "ink": "#50383F",
    "accent": "#C18491",
    "image": "/images/birthday/bloom-demo.jpg",
    "description": {
      "ru": "Акварельные цветы и утончённая каллиграфия",
      "ky": "Акварель гүлдөр жана каллиграфия"
    },
    "isHeritage": false
  },
  {
    "id": "collection-classic-ivory-gold",
    "name": {
      "ru": "Ivory & Gold",
      "ky": "Ак жана алтын"
    },
    "category": "wedding",
    "theme": "classic-ivory-gold",
    "paper": "#F8F0DD",
    "ink": "#483427",
    "accent": "#B18A43",
    "image": "/images/birthday/milestone-demo.jpg",
    "description": {
      "ru": "Нежная классика и золотая геометрия",
      "ky": "Назик классика жана алтын"
    },
    "isHeritage": false
  },
  {
    "id": "collection-dark-luxury",
    "name": {
      "ru": "Dark Luxury",
      "ky": "Кара люкс"
    },
    "category": "wedding",
    "theme": "dark-luxury",
    "paper": "#151211",
    "ink": "#E8D8BD",
    "accent": "#C39B58",
    "image": "/images/birthday/milestone-demo.jpg",
    "description": {
      "ru": "Бархат, золото и торжественный характер",
      "ky": "Баркыт, алтын жана салтанат"
    },
    "isHeritage": false
  },
  {
    "id": "collection-mono-typography",
    "name": {
      "ru": "Modern Monochrome",
      "ky": "Ак-кара типография"
    },
    "category": "wedding",
    "theme": "mono-typography",
    "paper": "#FFFFFF",
    "ink": "#141414",
    "accent": "#565656",
    "image": "/images/birthday/midnight-demo.jpg",
    "description": {
      "ru": "Графичный контраст и крупные заголовки",
      "ky": "Контраст жана чоң тамгалар"
    },
    "isHeritage": false
  },
  {
    "id": "collection-botanical-natural",
    "name": {
      "ru": "Botanical Nature",
      "ky": "Табигый гүлдөр"
    },
    "category": "wedding",
    "theme": "botanical-natural",
    "paper": "#F2F0E5",
    "ink": "#44533B",
    "accent": "#8E9E6F",
    "image": "/images/birthday/bloom-demo.jpg",
    "description": {
      "ru": "Ботанические ветви и бумажные фактуры",
      "ky": "Өсүмдүктөр жана табигый текстура"
    },
    "isHeritage": false
  },
  {
    "id": "collection-photo-story",
    "name": {
      "ru": "Photo Story",
      "ky": "Сүрөт баяны"
    },
    "category": "birthday",
    "theme": "photo-story",
    "paper": "#E8DFD3",
    "ink": "#2F2C2C",
    "accent": "#AE8163",
    "image": "/images/birthday/bloom-demo.jpg",
    "description": {
      "ru": "Фотоистория и коллажи воспоминаний",
      "ky": "Сүрөттөр жана эстеликтер"
    },
    "isHeritage": false
  },
  {
    "id": "collection-destination-travel",
    "name": {
      "ru": "Destination Travel",
      "ky": "Саякат чакыруусу"
    },
    "category": "wedding",
    "theme": "destination-travel",
    "paper": "#E9F0ED",
    "ink": "#24495A",
    "accent": "#C48D53",
    "image": "/images/birthday/midnight-demo.jpg",
    "description": {
      "ru": "Море, путешествия и маршрутная карта",
      "ky": "Деңиз, саякат жана багыт"
    },
    "isHeritage": false
  },
  {
    "id": "collection-modern-heritage",
    "name": {
      "ru": "Modern Heritage",
      "ky": "Заманбап мурас"
    },
    "category": "kyz-uzatuu",
    "theme": "modern-heritage",
    "paper": "#F2E7DE",
    "ink": "#6A2927",
    "accent": "#B88759",
    "image": "/images/birthday/bloom-demo.jpg",
    "description": {
      "ru": "Современная эстетика национальных мотивов",
      "ky": "Улуттук оймолордун заманбап көркү"
    },
    "isHeritage": false
  },
  {
    "id": "collection-playful-celebration",
    "name": {
      "ru": "Playful Celebration",
      "ky": "Жаркын майрам"
    },
    "category": "birthday",
    "theme": "playful-celebration",
    "paper": "#FFF2D9",
    "ink": "#4D2458",
    "accent": "#FA477D",
    "image": "/images/birthday/bloom-demo.jpg",
    "description": {
      "ru": "Яркая графика для дня рождения",
      "ky": "Туулган күн үчүн жаркын графика"
    },
    "isHeritage": false
  },
  {
    "id": "collection-heritage-ak-shyrdak",
    "name": {
      "ru": "Ак Шырдак",
      "ky": "Ак шырдак"
    },
    "category": "kyz-uzatuu",
    "theme": "heritage",
    "paper": "#F3EADD",
    "ink": "#392A24",
    "accent": "#9B612F",
    "image": "/images/heritage/ak-shyrdak.webp",
    "coverId": "heritage-ak-shyrdak",
    "description": {
      "ru": "Национальная обложка с фиксированными узорами",
      "ky": "Оймолору сакталган улуттук мукаба"
    },
    "isHeritage": true
  },
  {
    "id": "collection-heritage-kyzyl-barkhat",
    "name": {
      "ru": "Кызыл Бархат",
      "ky": "Кызыл баркыт"
    },
    "category": "wedding",
    "theme": "heritage",
    "paper": "#F3EADD",
    "ink": "#392A24",
    "accent": "#C5A56C",
    "image": "/images/heritage/kyzyl-barkhat.webp",
    "coverId": "heritage-kyzyl-barkhat",
    "description": {
      "ru": "Национальная обложка с фиксированными узорами",
      "ky": "Оймолору сакталган улуттук мукаба"
    },
    "isHeritage": true
  },
  {
    "id": "collection-heritage-ak-oymo",
    "name": {
      "ru": "Ак Оймо",
      "ky": "Ак оймо"
    },
    "category": "wedding",
    "theme": "heritage",
    "paper": "#F3EADD",
    "ink": "#392A24",
    "accent": "#A17A48",
    "image": "/images/heritage/ak-oymo.webp",
    "coverId": "heritage-ak-oymo",
    "description": {
      "ru": "Национальная обложка с фиксированными узорами",
      "ky": "Оймолору сакталган улуттук мукаба"
    },
    "isHeritage": true
  },
  {
    "id": "collection-heritage-kok-muras",
    "name": {
      "ru": "Көк Мурас",
      "ky": "Көк мурас"
    },
    "category": "kyz-uzatuu",
    "theme": "heritage",
    "paper": "#F3EADD",
    "ink": "#392A24",
    "accent": "#C5A66F",
    "image": "/images/heritage/kok-muras.webp",
    "coverId": "heritage-kok-muras",
    "description": {
      "ru": "Национальная обложка с фиксированными узорами",
      "ky": "Оймолору сакталган улуттук мукаба"
    },
    "isHeritage": true
  },
  {
    "id": "collection-heritage-ak-orgo",
    "name": {
      "ru": "Ак Өргө",
      "ky": "Ак өргө"
    },
    "category": "wedding",
    "theme": "heritage",
    "paper": "#F3EADD",
    "ink": "#392A24",
    "accent": "#9F6E45",
    "image": "/images/heritage/ak-orgo.webp",
    "coverId": "heritage-ak-orgo",
    "description": {
      "ru": "Национальная обложка с фиксированными узорами",
      "ky": "Оймолору сакталган улуттук мукаба"
    },
    "isHeritage": true
  },
  {
    "id": "collection-heritage-gul-muras",
    "name": {
      "ru": "Гүл Мурас",
      "ky": "Гүл мурас"
    },
    "category": "wedding",
    "theme": "heritage",
    "paper": "#F3EADD",
    "ink": "#392A24",
    "accent": "#927357",
    "image": "/images/heritage/gul-muras.webp",
    "coverId": "heritage-gul-muras",
    "description": {
      "ru": "Национальная обложка с фиксированными узорами",
      "ky": "Оймолору сакталган улуттук мукаба"
    },
    "isHeritage": true
  },
  {
    "id": "collection-heritage-ala-too",
    "name": {
      "ru": "Ала-Тоо",
      "ky": "Ала-Тоо"
    },
    "category": "kyz-uzatuu",
    "theme": "heritage",
    "paper": "#F3EADD",
    "ink": "#392A24",
    "accent": "#AB8560",
    "image": "/images/heritage/ala-too.webp",
    "coverId": "heritage-ala-too",
    "description": {
      "ru": "Национальная обложка с фиксированными узорами",
      "ky": "Оймолору сакталган улуттук мукаба"
    },
    "isHeritage": true
  },
  {
    "id": "collection-heritage-keremet",
    "name": {
      "ru": "Керемет",
      "ky": "Керемет"
    },
    "category": "wedding",
    "theme": "heritage",
    "paper": "#F3EADD",
    "ink": "#392A24",
    "accent": "#9E7D54",
    "image": "/images/heritage/keremet.webp",
    "coverId": "heritage-keremet",
    "description": {
      "ru": "Национальная обложка с фиксированными узорами",
      "ky": "Оймолору сакталган улуттук мукаба"
    },
    "isHeritage": true
  },
  {
    "id": "collection-heritage-altyn-medallion",
    "name": {
      "ru": "Алтын Белги",
      "ky": "Алтын белги"
    },
    "category": "wedding",
    "theme": "heritage",
    "paper": "#F3EADD",
    "ink": "#392A24",
    "accent": "#94734F",
    "image": "/images/heritage/altyn-medallion.webp",
    "coverId": "heritage-altyn-medallion",
    "description": {
      "ru": "Национальная обложка с фиксированными узорами",
      "ky": "Оймолору сакталган улуттук мукаба"
    },
    "isHeritage": true
  },
  {
    "id": "collection-heritage-tulpar",
    "name": {
      "ru": "Тулпар",
      "ky": "Тулпар"
    },
    "category": "kyz-uzatuu",
    "theme": "heritage",
    "paper": "#F3EADD",
    "ink": "#392A24",
    "accent": "#A57B44",
    "image": "/images/heritage/tulpar.webp",
    "coverId": "heritage-tulpar",
    "description": {
      "ru": "Национальная обложка с фиксированными узорами",
      "ky": "Оймолору сакталган улуттук мукаба"
    },
    "isHeritage": true
  }
] as const;
export type CollectionDesign = typeof collectionDesigns[number];

export function getCollectionDesign(templateId: string): CollectionDesign | NationalDesign | null {
  return collectionDesigns.find((d) => d.id === templateId) ?? nationalDesigns.find((d) => d.id === templateId) ?? null;
}

const weddingMessage = {
  ru: "Дорогие друзья! Приглашаем вас разделить с нами этот особенный и счастливый день.",
  ky: "Урматтуу достор! Биздин кубанычтуу күнүбүздү чогуу өткөрүүгө чакырабыз.",
};
const celebrationMessage = {
  ru: "Приглашаю вас на мой праздник! Будем рады встрече и тёплым воспоминаниям.",
  ky: "Сиздерди майрамыма чакырам! Бирге кубанычтуу көз ирмемдерди өткөрөлү.",
};

export const collectionTemplates: readonly TemplateDefinition[] = collectionDesigns.map((design): TemplateDefinition => {
  const isBirthday = design.category === "birthday";
  const isKyz = design.category === "kyz-uzatuu";
  return {
    id: design.id,
    category: design.category,
    theme: `collection-${design.theme}`,
    premium: true,
    name: design.name,
    description: design.description,
    accent: design.accent,
    defaultContent: {
      name1: isKyz ? "Айпери" : isBirthday ? "Мария" : "Азамат",
      name2: isKyz || isBirthday ? "" : "Айжан",
      age: isBirthday ? 25 : undefined,
      title: isKyz ? { ru: "Кыз узатуу", ky: "Кыз узатуу" } : isBirthday ? {ru:"День рождения",ky:"Туулган күн"} : {ru:"Приглашение на свадьбу",ky:"Үйлөнүү тойго чакыруу"},
      message: isBirthday ? celebrationMessage : weddingMessage,
      venue: {ru:"Банкетный зал «Ала-Тоо»",ky:"«Ала-Тоо» банкет залы"},
      city: {ru:"Бишкек",ky:"Бишкек"},
      dateTimeLocal: "2027-06-20T18:00",
      timezone: "Asia/Bishkek",
      dressCode: {ru:"Праздничная одежда в спокойных оттенках",ky:"Жарашыктуу майрамдык кийим"},
      giftNote: {ru:"Ваше присутствие — лучший подарок",ky:"Сиздердин келишиңиздер — эң сонун белек"},
    },
  };
});
