# Secret Garden — Eventiq / Codex

Статус: Последний выбранный визуальный концепт. Реализация в GitHub не выполнялась. Slug `secret-garden`, пакет `templates/packages/secret-garden.v1.json`, ветка `feat/secret-garden-template`.

## 1. Источник и цель

Садовая калитка и цветы, раскрывающиеся при входе; ботаническая история, календарь и компактный план дня.

Источник: `design/references/secret-garden/full-reference.png`; отдельные `01-artboard.png` … `04-artboard.png`, `geometry.json`, `template-blueprint.json`. `design/COMMON-IMPLEMENTATION.md` обязателен и имеет приоритет над ранними ограничениями ширины. Viewport 430×932, вся ширина телефона, DPR 1. Геометрия оценена по растру и нормализована по ширине без растяжения; исходные Figma-слои отсутствуют. Высоты ниже не фиксировать при изменении текста/ошибках. Внешняя рамка и радиусы демонстрационного смартфона не являются частью сайта.

## 2. Дизайн-токены

| Токен | HEX |
|---|---|
| paper | #F7EBDD |
| ink | #28331C |
| surface | #E8DCC8 |
| accent | #9D302A |
| border | #817444 |
| ivory | #FFFAF0 |

Display: Noto Serif Display / Noto Serif normal, 400–600; body: канонический Onest / Inter normal 400–600. Поддержка RU/KY. Никакого курсива. Не подменять шрифт растровым текстом. Целевой размер имён 64–82 px, line-height 1.02–1.12; heading 28–44/1.15; body 16/23; caption 13/18; label 15/20, weight 600; title case/uppercase по референсу. Трекинг имён −1…0 px, верхние подписи 1.5–3 px. При длинных именах перенос или умеренное уменьшение; не scaleX.

## 3. Геометрия всех основных элементов

Координаты X/Y от верхнего левого угла каждого артборда, в CSS px. Вложенные строки виджета — визуальные части, не отдельные дублирующие бизнес-компоненты.

### cover — Обложка · 430 × 1114

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| gatePoster | image | 0 | 0 | 430 | 1114 |
| header | text | 43 | 22 | 344 | 84 |
| eyebrow | text | 77 | 568 | 275 | 56 |
| names | text | 54 | 635 | 322 | 150 |
| date | text | 43 | 854 | 344 | 39 |
| venue | text | 64 | 903 | 301 | 29 |
| openGate | button | 185 | 969 | 60 | 60 |

### story — История пары · 430 × 1230

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| flowers | decoration | 0 | 0 | 430 | 209 |
| heading | text | 60 | 123 | 310 | 86 |
| intro | text | 64 | 234 | 301 | 55 |
| storyLine | decoration | 28 | 381 | 3 | 443 |
| chapter1Photo | image | 54 | 314 | 144 | 191 |
| chapter1Text | text | 224 | 330 | 189 | 160 |
| chapter2Photo | image | 54 | 509 | 144 | 191 |
| chapter2Text | text | 224 | 517 | 189 | 166 |
| chapter3Photo | image | 54 | 707 | 144 | 203 |
| chapter3Text | text | 224 | 713 | 189 | 184 |
| letter | decoration | 17 | 922 | 396 | 271 |
| letterCopy | text | 86 | 996 | 284 | 111 |

### event — Дата, программа и место · 430 × 1100

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| heroPhoto | image | 0 | 0 | 430 | 220 |
| calendar | calendar | 10 | 220 | 409 | 280 |
| programHeading | text | 22 | 534 | 387 | 55 |
| program | schedule | 13 | 585 | 404 | 178 |
| venuePhoto | image | 11 | 781 | 408 | 192 |
| venueCard | location | 11 | 952 | 408 | 77 |

### rsvp — Ответ гостя · 430 × 1143

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| heroDecor | decoration | 0 | 0 | 430 | 200 |
| heading | text | 32 | 206 | 366 | 82 |
| intro | text | 34 | 309 | 361 | 51 |
| nameLabel | text | 34 | 377 | 361 | 21 |
| name | input | 34 | 401 | 361 | 43 |
| attendanceLabel | text | 34 | 459 | 361 | 21 |
| yes | radio | 34 | 486 | 163 | 42 |
| no | radio | 204 | 486 | 191 | 42 |
| guestsLabel | text | 34 | 542 | 361 | 23 |
| stepper | stepper | 34 | 567 | 361 | 42 |
| wishLabel | text | 34 | 624 | 361 | 23 |
| wish | textarea | 34 | 652 | 361 | 81 |
| counter | text | 331 | 741 | 64 | 17 |
| submit | button | 34 | 762 | 361 | 55 |
| music | music | 24 | 840 | 383 | 89 |
| thanks | text | 69 | 966 | 292 | 57 |
| flowers | decoration | 258 | 949 | 172 | 194 |

## 4. Стили контролов и состояния

- Input: ширина по geometry, min-height 48, border 1px #817444, radius 12px, padding 12–14px, font 16/22. Тёмная секция: прозрачное поле, светлый текст и контур, проверять контраст.
- Radio: высота ≥48, radius 12px, gap 10, circle 22px. Активное состояние — контрастная заливка/рамка accent и видимая отметка.
- Stepper: высота ≥48, +/- ≥44×44, табличные цифры 18px, disabled на границах.
- Textarea: высота по geometry, min-height 88, border и radius как input, 500 символов, счётчик.
- Submit: ширина по geometry, min-height 52, radius 12px, font 16/22 weight 600, фон ivory, ink текст. Map/calendar outline 1px, min-height 48. Для узкого viewport контролы растут, не уменьшаются.
- Music: общий compact player, min-height 72, play/pause ≥44×44. Пустой source: не показывать фальшивый play.
- Hover (только pointer), focus-visible 2px с отступом 3px, active, disabled, pending, error, success по COMMON-IMPLEMENTATION. Никаких неработающих кнопок/иконок.

## 5. Общие новые возможности

- **reveal** — optional gate opening, two SVG/image layers, pointer and keyboard trigger, skip/reduced motion; once per visit.
- **story** — botanical/arched layout variant, 1–6 chapters.
- **calendar** — existing date-driven month view.
- **schedule** — compact 2×2 at narrow widths, four columns only if readable.

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

Команда `npm run test:secret-garden` — добавить, если отсутствует. Документация `docs/studio-v2/SECRET-GARDEN.md`. Ветка `feat/secret-garden-template`. Не сливать до проверки актуального main.
