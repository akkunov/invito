/** Fixed designer ornaments: independent from uploaded event portraits. */
export const heritageCovers = [
  {
    "id": "heritage-ak-shyrdak",
    "name": {
      "ru": "Ак Шырдак",
      "ky": "Ак шырдак"
    },
    "image": "/images/heritage/ak-shyrdak.webp",
    "category": "kyz-uzatuu",
    "accent": "#9B612F"
  },
  {
    "id": "heritage-kyzyl-barkhat",
    "name": {
      "ru": "Кызыл Бархат",
      "ky": "Кызыл баркыт"
    },
    "image": "/images/heritage/kyzyl-barkhat.webp",
    "category": "wedding",
    "accent": "#C5A56C"
  },
  {
    "id": "heritage-ak-oymo",
    "name": {
      "ru": "Ак Оймо",
      "ky": "Ак оймо"
    },
    "image": "/images/heritage/ak-oymo.webp",
    "category": "wedding",
    "accent": "#A17A48"
  },
  {
    "id": "heritage-kok-muras",
    "name": {
      "ru": "Көк Мурас",
      "ky": "Көк мурас"
    },
    "image": "/images/heritage/kok-muras.webp",
    "category": "kyz-uzatuu",
    "accent": "#C5A66F"
  },
  {
    "id": "heritage-ak-orgo",
    "name": {
      "ru": "Ак Өргө",
      "ky": "Ак өргө"
    },
    "image": "/images/heritage/ak-orgo.webp",
    "category": "wedding",
    "accent": "#9F6E45"
  },
  {
    "id": "heritage-gul-muras",
    "name": {
      "ru": "Гүл Мурас",
      "ky": "Гүл мурас"
    },
    "image": "/images/heritage/gul-muras.webp",
    "category": "wedding",
    "accent": "#927357"
  },
  {
    "id": "heritage-ala-too",
    "name": {
      "ru": "Ала-Тоо",
      "ky": "Ала-Тоо"
    },
    "image": "/images/heritage/ala-too.webp",
    "category": "kyz-uzatuu",
    "accent": "#AB8560"
  },
  {
    "id": "heritage-keremet",
    "name": {
      "ru": "Керемет",
      "ky": "Керемет"
    },
    "image": "/images/heritage/keremet.webp",
    "category": "wedding",
    "accent": "#9E7D54"
  },
  {
    "id": "heritage-altyn-medallion",
    "name": {
      "ru": "Алтын Белги",
      "ky": "Алтын белги"
    },
    "image": "/images/heritage/altyn-medallion.webp",
    "category": "wedding",
    "accent": "#94734F"
  },
  {
    "id": "heritage-tulpar",
    "name": {
      "ru": "Тулпар",
      "ky": "Тулпар"
    },
    "image": "/images/heritage/tulpar.webp",
    "category": "kyz-uzatuu",
    "accent": "#A57B44"
  }
] as const;

export type HeritageCoverId = typeof heritageCovers[number]["id"];

export function getHeritageCover(id: string | null | undefined) {
  return heritageCovers.find((cover) => cover.id === id) ?? null;
}
