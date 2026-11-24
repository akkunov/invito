# Wedding Newspaper — Eventiq / Codex

Статус: Последний выбранный визуальный концепт. Реализация в GitHub не выполнялась. Slug `wedding-newspaper`, пакет `templates/packages/wedding-newspaper.v1.json`, ветка `feat/wedding-newspaper-template`.

## 1. Источник и цель

Свадебная газета: первая полоса, фотографии и колонки, отрывной купон ответа.

Источник: `design/references/wedding-newspaper/full-reference.png`; отдельные `01-artboard.png` … `04-artboard.png`, `geometry.json`, `template-blueprint.json`. `design/COMMON-IMPLEMENTATION.md` обязателен и имеет приоритет над ранними ограничениями ширины. Viewport 430×932, вся ширина телефона, DPR 1. Геометрия оценена по растру и нормализована по ширине без растяжения; исходные Figma-слои отсутствуют. Высоты ниже не фиксировать при изменении текста/ошибках. Внешняя рамка и радиусы демонстрационного смартфона не являются частью сайта.

## 2. Дизайн-токены

| Токен | HEX |
|---|---|
| paper | #F3E8DC |
| ink | #161412 |
| surface | #F9F1E5 |
| accent | #941D24 |
| border | #8B7763 |
| ivory | #FFF8ED |

Display: Noto Serif Display / Noto Serif normal, 400–600; body: канонический Onest / Inter normal 400–600. Поддержка RU/KY. Никакого курсива. Не подменять шрифт растровым текстом. Целевой размер имён 64–82 px, line-height 1.02–1.12; heading 28–44/1.15; body 16/23; caption 13/18; label 15/20, weight 600; title case/uppercase по референсу. Трекинг имён −1…0 px, верхние подписи 1.5–3 px. При длинных именах перенос или умеренное уменьшение; не scaleX.

## 3. Геометрия всех основных элементов

Координаты X/Y от верхнего левого угла каждого артборда, в CSS px. Вложенные строки виджета — визуальные части, не отдельные дублирующие бизнес-компоненты.

### cover — Обложка · 430 × 1147

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| masthead | text | 77 | 21 | 275 | 63 |
| edition | text | 15 | 114 | 400 | 30 |
| names | text | 37 | 161 | 357 | 189 |
| dateVenue | text | 17 | 373 | 396 | 39 |
| coverPhoto | image | 11 | 427 | 408 | 510 |
| headline | text | 39 | 895 | 353 | 99 |
| intro | text | 82 | 1002 | 267 | 69 |
| next | button | 194 | 1084 | 47 | 53 |

### story — История пары · 430 × 1147

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| heading | text | 39 | 29 | 353 | 72 |
| subtitle | text | 77 | 101 | 275 | 40 |
| chapter1Photo | image | 22 | 170 | 211 | 218 |
| chapter1Text | text | 245 | 166 | 168 | 216 |
| chapter2Text | text | 32 | 407 | 168 | 206 |
| chapter2Photo | image | 215 | 396 | 194 | 218 |
| chapter3Photo | image | 22 | 619 | 211 | 235 |
| chapter3Text | text | 247 | 637 | 168 | 218 |
| quote | text | 32 | 883 | 366 | 109 |
| landscape | decoration | 0 | 998 | 430 | 149 |

### event — Дата, программа и место · 430 × 1153

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| heading | text | 30 | 31 | 370 | 67 |
| subtitle | text | 60 | 95 | 310 | 37 |
| program | schedule | 34 | 138 | 370 | 306 |
| venueHeading | text | 34 | 484 | 361 | 44 |
| venuePhoto | image | 15 | 542 | 401 | 219 |
| venueCard | location | 24 | 767 | 383 | 69 |
| calendar | button | 34 | 853 | 361 | 55 |
| fact | frame | 22 | 945 | 280 | 179 |
| camera | decoration | 292 | 945 | 138 | 208 |

### rsvp — Ответ гостя · 430 × 1144

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| newspaperDecor | decoration | 0 | 0 | 430 | 257 |
| heading | text | 30 | 271 | 370 | 87 |
| intro | text | 47 | 366 | 335 | 55 |
| nameLabel | text | 32 | 437 | 366 | 22 |
| name | input | 32 | 463 | 366 | 48 |
| attendanceLabel | text | 32 | 526 | 366 | 22 |
| yes | radio | 32 | 553 | 166 | 40 |
| no | radio | 206 | 553 | 191 | 40 |
| guestsLabel | text | 32 | 612 | 366 | 22 |
| stepper | stepper | 32 | 638 | 366 | 49 |
| wishLabel | text | 32 | 709 | 366 | 22 |
| wish | textarea | 32 | 734 | 366 | 95 |
| counter | text | 335 | 837 | 62 | 18 |
| submit | button | 32 | 869 | 366 | 55 |
| music | music | 32 | 955 | 366 | 92 |

## 4. Стили контролов и состояния

- Input: ширина по geometry, min-height 48, border 1px #8B7763, radius 8px, padding 12–14px, font 16/22. Светлая секция: paper/surface, ink, приглушённый placeholder.
- Radio: высота ≥48, radius 8px, gap 10, circle 22px. Активное состояние — контрастная заливка/рамка accent и видимая отметка.
- Stepper: высота ≥48, +/- ≥44×44, табличные цифры 18px, disabled на границах.
- Textarea: высота по geometry, min-height 88, border и radius как input, 500 символов, счётчик.
- Submit: ширина по geometry, min-height 52, radius 8px, font 16/22 weight 600, фон accent, контрастный белый текст. Map/calendar outline 1px, min-height 48. Для узкого viewport контролы растут, не уменьшаются.
- Music: общий compact player, min-height 72, play/pause ≥44×44. Пустой source: не показывать фальшивый play.
- Hover (только pointer), focus-visible 2px с отступом 3px, active, disabled, pending, error, success по COMMON-IMPLEMENTATION. Никаких неработающих кнопок/иконок.

## 5. Общие новые возможности

- **story** — newspaper alternating photo/text editorial layout.
- **countdown** — days-only dynamic fact, derive ceremonyDate; after event show localized completed message.
- **rsvp** — coupon visual variant; real backend.
- **calendar** — existing ICS action.

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
| chapters | proposed-story | story | photos |

Редактируемые заголовки/подписи/текст — RU/KY. Связать все даты с ceremonyDate; фото — отдельные assets с cover/contain, не растр целого артборда. Список полей blueprint — проект, сверить реальные nodeId/key и ограничения Zod. Включить загрузку и замену каждого пользовательского фото, даже если демонстрационная галерея заполнена. Декор заблокирован.

## 7. Реализация и тестирование

1. Прочитать общий контракт и проверить существующий движок; определить, какие виды уже реализованы.
2. Восстановить самостоятельные фотографии и декоративные SVG; reference не является готовой фотографией или background всей секции. Не копировать логотипы сторонних брендов, не обещать музыку/видео без прав и реальных файлов.
3. Добавить типизированные опциональные возможности и тесты, создать пакет, обновить registry/allowlist только необходимыми assets.
4. Проверить visual QA: четыре скриншота на ширине 430, дополнительные 390 и 320–430, обе локали, длинный текст, корректное изменение высоты.
5. Полноценный функциональный E2E на отдельной БД, frontend/backend typecheck и build. Отчёт, скриншоты, известные ограничения.

Команда `npm run test:wedding-newspaper` — добавить, если отсутствует. Документация `docs/studio-v2/WEDDING-NEWSPAPER.md`. Ветка `feat/wedding-newspaper-template`. Не сливать до проверки актуального main.
