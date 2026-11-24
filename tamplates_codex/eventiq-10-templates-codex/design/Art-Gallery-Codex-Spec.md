# Art Gallery — Eventiq / Codex

Статус: Новый концепт, требует подтверждения. Реализация в GitHub не выполнялась. Slug `art-gallery`, пакет `templates/packages/art-gallery.v1.json`, ветка `feat/art-gallery-template`.

## 1. Источник и цель

Светлая персональная выставка: активная фотография с подписью, контактный лист, запись на открытие.

Источник: `design/references/art-gallery/full-reference.png`; отдельные `01-artboard.png` … `04-artboard.png`, `geometry.json`, `template-blueprint.json`. `design/COMMON-IMPLEMENTATION.md` обязателен и имеет приоритет над ранними ограничениями ширины. Viewport 430×932, вся ширина телефона, DPR 1. Геометрия задана при построении Art Gallery; исходные Figma-слои отсутствуют. Высоты ниже не фиксировать при изменении текста/ошибках. Внешняя рамка и радиусы демонстрационного смартфона не являются частью сайта.

## 2. Дизайн-токены

| Токен | HEX |
|---|---|
| paper | #F8F8F6 |
| ink | #17191C |
| surface | #FFFFFF |
| accent | #173DDE |
| border | #C9CCD1 |
| ivory | #555B65 |

Display: Onest / Inter Tight или канонический sans normal, 600–700; body: канонический Onest / Inter normal 400–600. Поддержка RU/KY. Никакого курсива. Не подменять шрифт растровым текстом. Целевой размер имён 58–76 px, line-height 1.02–1.12; heading 28–44/1.15; body 16/23; caption 13/18; label 15/20, weight 600; title case/uppercase по референсу. Трекинг имён −1…0 px, верхние подписи 1.5–3 px. При длинных именах перенос или умеренное уменьшение; не scaleX.

## 3. Геометрия всех основных элементов

Координаты X/Y от верхнего левого угла каждого артборда, в CSS px. Вложенные строки виджета — визуальные части, не отдельные дублирующие бизнес-компоненты.

### cover — Обложка · 430 × 1050

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| label | text | 24 | 26 | 382 | 22 |
| rule | decoration | 24 | 70 | 382 | 1 |
| heading | text | 24 | 96 | 385 | 200 |
| names | text | 24 | 306 | 382 | 38 |
| cover | image | 24 | 366 | 382 | 446 |
| date | text | 24 | 830 | 382 | 32 |
| caption | text | 24 | 873 | 382 | 50 |
| open | button | 24 | 958 | 382 | 56 |

### exhibition — Фотовыставка · 430 × 1050

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| label | text | 24 | 24 | 382 | 25 |
| heading | text | 24 | 62 | 382 | 110 |
| activePhoto | image | 24 | 204 | 382 | 450 |
| caption | text | 24 | 671 | 310 | 30 |
| count | text | 350 | 675 | 56 | 25 |
| description | text | 24 | 710 | 382 | 26 |
| previous | button | 24 | 755 | 56 | 48 |
| next | button | 350 | 755 | 56 | 48 |
| thumbnail1 | image | 24 | 828 | 88 | 110 |
| thumbnail2 | image | 122 | 828 | 88 | 110 |
| thumbnail3 | image | 220 | 828 | 88 | 110 |
| thumbnail4 | image | 318 | 828 | 88 | 110 |
| fullscreen | button | 24 | 958 | 382 | 56 |

### event — Дата, программа и место · 430 × 1050

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| label | text | 24 | 24 | 382 | 25 |
| heading | text | 24 | 62 | 382 | 112 |
| line0 | decoration | 24 | 270 | 382 | 1 |
| time0 | text | 24 | 204 | 110 | 34 |
| event0 | text | 152 | 209 | 254 | 38 |
| line1 | decoration | 24 | 346 | 382 | 1 |
| time1 | text | 24 | 280 | 110 | 34 |
| event1 | text | 152 | 285 | 254 | 38 |
| line2 | decoration | 24 | 422 | 382 | 1 |
| time2 | text | 24 | 356 | 110 | 34 |
| event2 | text | 152 | 361 | 254 | 38 |
| line3 | decoration | 24 | 498 | 382 | 1 |
| time3 | text | 24 | 432 | 110 | 34 |
| event3 | text | 152 | 437 | 254 | 38 |
| venuePhoto | image | 24 | 520 | 382 | 250 |
| venueTitle | text | 24 | 785 | 382 | 30 |
| venue | text | 24 | 828 | 382 | 28 |
| map | button | 24 | 878 | 382 | 50 |
| calendar | button | 24 | 946 | 382 | 50 |

### rsvp — Ответ гостя · 430 × 1050

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| label | text | 24 | 24 | 382 | 25 |
| heading | text | 24 | 68 | 382 | 70 |
| intro | text | 24 | 150 | 382 | 55 |
| nameLabel | text | 24 | 240 | 382 | 24 |
| name | input | 24 | 272 | 382 | 54 |
| placeholder | text | 38 | 287 | 354 | 24 |
| attendanceLabel | text | 24 | 352 | 382 | 24 |
| yes | button | 24 | 384 | 180 | 52 |
| no | button | 216 | 384 | 190 | 52 |
| guestsLabel | text | 24 | 462 | 382 | 24 |
| stepper | stepper | 24 | 494 | 382 | 52 |
| minus | text | 44 | 507 | 44 | 32 |
| number | text | 208 | 508 | 36 | 30 |
| plus | text | 365 | 507 | 40 | 30 |
| wishLabel | text | 24 | 573 | 382 | 24 |
| wish | textarea | 24 | 605 | 382 | 104 |
| wishPlaceholder | text | 38 | 620 | 354 | 24 |
| count | text | 341 | 718 | 65 | 22 |
| submit | button | 24 | 764 | 382 | 56 |
| music | music | 24 | 852 | 382 | 72 |
| musicTitle | text | 43 | 868 | 240 | 25 |
| musicSubtitle | text | 43 | 892 | 270 | 23 |
| play | button | 345 | 864 | 48 | 48 |
| closing | text | 24 | 964 | 382 | 56 |

## 4. Стили контролов и состояния

- Input: ширина по geometry, min-height 48, border 1px #C9CCD1, radius 0px, padding 12–14px, font 16/22. Светлая секция: paper/surface, ink, приглушённый placeholder.
- Radio: высота ≥48, radius 0px, gap 10, circle 22px. Активное состояние — контрастная заливка/рамка accent и видимая отметка.
- Stepper: высота ≥48, +/- ≥44×44, табличные цифры 18px, disabled на границах.
- Textarea: высота по geometry, min-height 88, border и radius как input, 500 символов, счётчик.
- Submit: ширина по geometry, min-height 52, radius 0px, font 16/22 weight 600, фон accent, контрастный белый текст. Map/calendar outline 1px, min-height 48. Для узкого viewport контролы растут, не уменьшаются.
- Music: общий compact player, min-height 72, play/pause ≥44×44. Пустой source: не показывать фальшивый play.
- Hover (только pointer), focus-visible 2px с отступом 3px, active, disabled, pending, error, success по COMMON-IMPLEMENTATION. Никаких неработающих кнопок/иконок.

## 5. Общие новые возможности

- **gallery** — exhibition layout: active photo, caption, ordinal, thumbnails, next/previous, full screen; 1–4 photos with optional RU/KY caption per asset.
- **schedule** — minimal time/title rows.
- **calendar** — existing ICS action.
- **rsvp** — opening registration appearance, shared backend.

Указанные имена — целевой дизайн-контракт, не обязательные имена классов/схем. Сначала проверить актуальную реализацию (Italian Romance, Love Story и параллельные ветки), повторно использовать существующий блок и добавить опциональный variant только при необходимости.

## 6. Персонализация

| ID | Тип (проект) | Target | Раздел |
|---|---|---|---|
| names | text | coupleNames | main |
| invitation | text | invitationText | main |
| date | date | ceremonyDate | date |
| venueName | text | venueName | location |
| address | text | venueAddress | location |
| coverPhoto | image | cover | photos |
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

Команда `npm run test:art-gallery` — добавить, если отсутствует. Документация `docs/studio-v2/ART-GALLERY.md`. Ветка `feat/art-gallery-template`. Не сливать до проверки актуального main.

Примечание: этот Art Gallery собран как новый отдельный графический референс вручную, с использованием фрагментов других доступных фотографий, поскольку предыдущее изображение Art Gallery ошибочно показывало Cinema Wedding. Референс не был утверждён пользователем; сначала согласовать, не называть копией предыдущего.
