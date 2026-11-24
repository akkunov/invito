# Digital Envelope — Eventiq / Codex

Статус: Последний выбранный визуальный концепт. Реализация в GitHub не выполнялась. Slug `digital-envelope`, пакет `templates/packages/digital-envelope.v1.json`, ветка `feat/digital-envelope-template`.

## 1. Источник и цель

Физическая метафора письма: сургучная печать, раскрытие клапана и выдвижение карточки.

Источник: `design/references/digital-envelope/full-reference.png`; отдельные `01-artboard.png` … `04-artboard.png`, `geometry.json`, `template-blueprint.json`. `design/COMMON-IMPLEMENTATION.md` обязателен и имеет приоритет над ранними ограничениями ширины. Viewport 430×932, вся ширина телефона, DPR 1. Геометрия оценена по растру и нормализована по ширине без растяжения; исходные Figma-слои отсутствуют. Высоты ниже не фиксировать при изменении текста/ошибках. Внешняя рамка и радиусы демонстрационного смартфона не являются частью сайта.

## 2. Дизайн-токены

| Токен | HEX |
|---|---|
| paper | #F4E4CC |
| ink | #29301B |
| surface | #FBF1E2 |
| accent | #9B612D |
| border | #AE8F5B |
| ivory | #FFF8E9 |

Display: Noto Serif Display / Noto Serif normal, 400–600; body: канонический Onest / Inter normal 400–600. Поддержка RU/KY. Никакого курсива. Не подменять шрифт растровым текстом. Целевой размер имён 64–82 px, line-height 1.02–1.12; heading 28–44/1.15; body 16/23; caption 13/18; label 15/20, weight 600; title case/uppercase по референсу. Трекинг имён −1…0 px, верхние подписи 1.5–3 px. При длинных именах перенос или умеренное уменьшение; не scaleX.

## 3. Геометрия всех основных элементов

Координаты X/Y от верхнего левого угла каждого артборда, в CSS px. Вложенные строки виджета — визуальные части, не отдельные дублирующие бизнес-компоненты.

### envelope — Закрытый конверт · 430 × 1138

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| background | background | 0 | 0 | 430 | 1138 |
| header | text | 86 | 40 | 258 | 85 |
| envelopeBack | decoration | 45 | 180 | 340 | 444 |
| envelopeFlap | decoration | 45 | 180 | 340 | 284 |
| seal | decoration | 150 | 353 | 129 | 125 |
| eyebrow | text | 60 | 637 | 310 | 51 |
| names | text | 56 | 728 | 318 | 165 |
| date | text | 69 | 918 | 292 | 39 |
| venue | text | 77 | 967 | 275 | 28 |
| open | button | 54 | 1006 | 322 | 57 |

### invitation — Раскрытое письмо · 430 × 1162

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| envelopeBack | decoration | 9 | 40 | 413 | 1075 |
| card | frame | 10 | 128 | 409 | 889 |
| leaves | decoration | 9 | 137 | 413 | 163 |
| greeting | text | 77 | 238 | 275 | 56 |
| intro | text | 39 | 325 | 353 | 76 |
| names | text | 52 | 416 | 327 | 163 |
| date | text | 56 | 587 | 318 | 87 |
| villa | image | 15 | 732 | 400 | 250 |
| envelopeFront | decoration | 9 | 813 | 413 | 320 |

### event — Дата, программа и место · 430 × 1150

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| heading | text | 52 | 52 | 327 | 46 |
| gallery | gallery | 17 | 115 | 396 | 178 |
| programHeading | text | 34 | 316 | 361 | 46 |
| program | schedule | 30 | 380 | 370 | 316 |
| venueHeading | text | 30 | 736 | 370 | 46 |
| venuePhoto | image | 22 | 782 | 387 | 155 |
| venueCard | location | 26 | 949 | 378 | 63 |
| map | button | 43 | 1012 | 344 | 46 |

### rsvp — Ответ гостя · 430 × 1147

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| leaves | decoration | 280 | 0 | 150 | 115 |
| heading | text | 34 | 126 | 361 | 85 |
| intro | text | 52 | 239 | 327 | 52 |
| nameLabel | text | 34 | 305 | 361 | 23 |
| name | input | 34 | 329 | 361 | 46 |
| attendanceLabel | text | 34 | 395 | 361 | 23 |
| yes | radio | 34 | 420 | 172 | 46 |
| no | radio | 215 | 420 | 181 | 46 |
| guestsLabel | text | 34 | 487 | 361 | 23 |
| stepper | stepper | 34 | 513 | 361 | 45 |
| wishLabel | text | 34 | 577 | 361 | 23 |
| wish | textarea | 34 | 602 | 361 | 80 |
| counter | text | 335 | 694 | 60 | 18 |
| submit | button | 30 | 721 | 370 | 69 |
| music | music | 32 | 820 | 366 | 87 |
| landscape | decoration | 0 | 958 | 430 | 189 |

## 4. Стили контролов и состояния

- Input: ширина по geometry, min-height 48, border 1px #AE8F5B, radius 12px, padding 12–14px, font 16/22. Тёмная секция: прозрачное поле, светлый текст и контур, проверять контраст.
- Radio: высота ≥48, radius 12px, gap 10, circle 22px. Активное состояние — контрастная заливка/рамка accent и видимая отметка.
- Stepper: высота ≥48, +/- ≥44×44, табличные цифры 18px, disabled на границах.
- Textarea: высота по geometry, min-height 88, border и radius как input, 500 символов, счётчик.
- Submit: ширина по geometry, min-height 52, radius 12px, font 16/22 weight 600, фон ivory, ink текст. Map/calendar outline 1px, min-height 48. Для узкого viewport контролы растут, не уменьшаются.
- Music: общий compact player, min-height 72, play/pause ≥44×44. Пустой source: не показывать фальшивый play.
- Hover (только pointer), focus-visible 2px с отступом 3px, active, disabled, pending, error, success по COMMON-IMPLEMENTATION. Никаких неработающих кнопок/иконок.

## 5. Общие новые возможности

- **reveal** — envelope front/flap/seal/card; animate transform, reveal once, direct link/skip and reduced motion; open button real.
- **gallery** — three polaroid cards or shared polaroid variant, max 4.
- **date** — derive day/month/year from ceremonyDate.
- **rsvp** — reply card visual variant.

Указанные имена — целевой дизайн-контракт, не обязательные имена классов/схем. Сначала проверить актуальную реализацию (Italian Romance, Love Story и параллельные ветки), повторно использовать существующий блок и добавить опциональный variant только при необходимости.

## 6. Персонализация

| ID | Тип (проект) | Target | Раздел |
|---|---|---|---|
| names | text | coupleNames | main |
| invitation | text | invitationText | main |
| date | date | ceremonyDate | date |
| venueName | text | venueName | location |
| address | text | venueAddress | location |
| venuePhoto | image | venuePhoto | photos |
| program | schedule | program | schedule |
| response | rsvp | rsvp | rsvp |
| musicTrack | music | music | music |
| galleryPhotos | gallery | gallery | photos |

Редактируемые заголовки/подписи/текст — RU/KY. Связать все даты с ceremonyDate; фото — отдельные assets с cover/contain, не растр целого артборда. Список полей blueprint — проект, сверить реальные nodeId/key и ограничения Zod. Включить загрузку и замену каждого пользовательского фото, даже если демонстрационная галерея заполнена. Декор заблокирован.

## 7. Реализация и тестирование

1. Прочитать общий контракт и проверить существующий движок; определить, какие виды уже реализованы.
2. Восстановить самостоятельные фотографии и декоративные SVG; reference не является готовой фотографией или background всей секции. Не копировать логотипы сторонних брендов, не обещать музыку/видео без прав и реальных файлов.
3. Добавить типизированные опциональные возможности и тесты, создать пакет, обновить registry/allowlist только необходимыми assets.
4. Проверить visual QA: четыре скриншота на ширине 430, дополнительные 390 и 320–430, обе локали, длинный текст, корректное изменение высоты.
5. Полноценный функциональный E2E на отдельной БД, frontend/backend typecheck и build. Отчёт, скриншоты, известные ограничения.

Команда `npm run test:digital-envelope` — добавить, если отсутствует. Документация `docs/studio-v2/DIGITAL-ENVELOPE.md`. Ветка `feat/digital-envelope-template`. Не сливать до проверки актуального main.

Визуальная поправка: золотой CTA #EBC38D на тёмной оливе, radius 999px; закрытая карточка — не блокирующий обязательный splash, при reduced motion раскрывать без анимации.
