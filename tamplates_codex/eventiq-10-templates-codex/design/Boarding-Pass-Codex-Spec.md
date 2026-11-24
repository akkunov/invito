# Boarding Pass — Eventiq / Codex

Статус: Последний выбранный визуальный концепт. Реализация в GitHub не выполнялась. Slug `boarding-pass`, пакет `templates/packages/boarding-pass.v1.json`, ветка `feat/boarding-pass-template`.

## 1. Источник и цель

Свадебный рейс, иллюминатор, персонализированный билет, маршрут и регистрация гостей.

Источник: `design/references/boarding-pass/full-reference.png`; отдельные `01-artboard.png` … `04-artboard.png`, `geometry.json`, `template-blueprint.json`. `design/COMMON-IMPLEMENTATION.md` обязателен и имеет приоритет над ранними ограничениями ширины. Viewport 430×932, вся ширина телефона, DPR 1. Геометрия оценена по растру и нормализована по ширине без растяжения; исходные Figma-слои отсутствуют. Высоты ниже не фиксировать при изменении текста/ошибках. Внешняя рамка и радиусы демонстрационного смартфона не являются частью сайта.

## 2. Дизайн-токены

| Токен | HEX |
|---|---|
| paper | #F5E9D8 |
| ink | #241A17 |
| surface | #F8F1E6 |
| accent | #722721 |
| border | #C58C56 |
| ivory | #FFF4DF |

Display: Noto Serif Display / Noto Serif normal, 400–600; body: канонический Onest / Inter normal 400–600. Поддержка RU/KY. Никакого курсива. Не подменять шрифт растровым текстом. Целевой размер имён 64–82 px, line-height 1.02–1.12; heading 28–44/1.15; body 16/23; caption 13/18; label 15/20, weight 600; title case/uppercase по референсу. Трекинг имён −1…0 px, верхние подписи 1.5–3 px. При длинных именах перенос или умеренное уменьшение; не scaleX.

## 3. Геометрия всех основных элементов

Координаты X/Y от верхнего левого угла каждого артборда, в CSS px. Вложенные строки виджета — визуальные части, не отдельные дублирующие бизнес-компоненты.

### cover — Обложка · 430 × 1144

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| windowHero | image | 0 | 0 | 430 | 1144 |
| header | text | 43 | 34 | 344 | 69 |
| eyebrow | text | 77 | 249 | 275 | 46 |
| names | text | 60 | 510 | 310 | 183 |
| date | badge | 90 | 716 | 254 | 43 |
| venue | text | 77 | 774 | 275 | 27 |
| luggage | decoration | 0 | 852 | 430 | 292 |
| next | button | 194 | 1056 | 52 | 57 |

### ticket — Билет и маршрут · 430 × 1147

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| boardingTicket | frame | 13 | 21 | 404 | 390 |
| title | text | 90 | 69 | 280 | 52 |
| barcode | decoration | 301 | 69 | 103 | 46 |
| flight | text | 43 | 154 | 181 | 52 |
| date | text | 215 | 154 | 194 | 52 |
| route | text | 43 | 229 | 361 | 57 |
| departureArrival | text | 26 | 303 | 378 | 92 |
| perforation | decoration | 13 | 411 | 404 | 5 |
| heading | text | 77 | 436 | 275 | 40 |
| chapter1Photo | image | 64 | 491 | 181 | 126 |
| chapter1Text | text | 258 | 493 | 150 | 132 |
| chapter2Photo | image | 64 | 631 | 181 | 143 |
| chapter2Text | text | 258 | 631 | 150 | 143 |
| chapter3Photo | image | 64 | 786 | 181 | 138 |
| chapter3Text | text | 258 | 786 | 150 | 143 |
| stamp | decoration | 11 | 946 | 408 | 184 |

### event — Дата, программа и место · 430 × 1144

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| venuePhoto | image | 0 | 0 | 430 | 263 |
| destination | text | 34 | 269 | 361 | 32 |
| venueTitle | text | 26 | 301 | 378 | 46 |
| venueAddress | text | 39 | 355 | 353 | 29 |
| map | button | 47 | 384 | 335 | 51 |
| heading | text | 39 | 478 | 353 | 41 |
| program | schedule | 32 | 526 | 374 | 332 |
| calendar | button | 22 | 877 | 387 | 76 |
| passport | decoration | 0 | 972 | 430 | 172 |

### rsvp — Ответ гостя · 430 × 1147

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| mapDecor | decoration | 0 | 0 | 430 | 161 |
| heading | text | 43 | 173 | 344 | 77 |
| intro | text | 56 | 257 | 318 | 48 |
| nameLabel | text | 32 | 319 | 366 | 23 |
| name | input | 32 | 348 | 366 | 46 |
| attendanceLabel | text | 32 | 407 | 366 | 23 |
| yes | radio | 32 | 434 | 172 | 48 |
| no | radio | 215 | 434 | 183 | 48 |
| guestsLabel | text | 32 | 502 | 366 | 26 |
| stepper | stepper | 236 | 516 | 161 | 46 |
| wishLabel | text | 32 | 585 | 366 | 23 |
| wish | textarea | 32 | 608 | 366 | 76 |
| counter | text | 331 | 694 | 67 | 18 |
| submit | button | 30 | 719 | 370 | 60 |
| music | music | 22 | 809 | 387 | 86 |
| closing | decoration | 0 | 941 | 430 | 206 |

## 4. Стили контролов и состояния

- Input: ширина по geometry, min-height 48, border 1px #C58C56, radius 12px, padding 12–14px, font 16/22. Тёмная секция: прозрачное поле, светлый текст и контур, проверять контраст.
- Radio: высота ≥48, radius 12px, gap 10, circle 22px. Активное состояние — контрастная заливка/рамка accent и видимая отметка.
- Stepper: высота ≥48, +/- ≥44×44, табличные цифры 18px, disabled на границах.
- Textarea: высота по geometry, min-height 88, border и radius как input, 500 символов, счётчик.
- Submit: ширина по geometry, min-height 52, radius 12px, font 16/22 weight 600, фон ivory, ink текст. Map/calendar outline 1px, min-height 48. Для узкого viewport контролы растут, не уменьшаются.
- Music: общий compact player, min-height 72, play/pause ≥44×44. Пустой source: не показывать фальшивый play.
- Hover (только pointer), focus-visible 2px с отступом 3px, active, disabled, pending, error, success по COMMON-IMPLEMENTATION. Никаких неработающих кнопок/иконок.

## 5. Общие новые возможности

- **ticket** — derived wedding flight number/date/venue and decorative non-scannable barcode; no invented real flight.
- **story** — route layout with editable travel chapters.
- **calendar** — existing ICS action.
- **rsvp** — check-in visual variant; ordinary RSVP semantics.

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

Команда `npm run test:boarding-pass` — добавить, если отсутствует. Документация `docs/studio-v2/BOARDING-PASS.md`. Ветка `feat/boarding-pass-template`. Не сливать до проверки актуального main.

Визуальная поправка: RSVP на винном фоне #722721, submit тёплый золотой #EBC38D с тёмным текстом, radius 999px. Билет — перфорация отдельным SVG; декоративный штрихкод не имитирует рабочий посадочный документ.
