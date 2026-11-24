# Minimal Architecture — Eventiq / Codex

Статус: Новый концепт, требует подтверждения. Реализация в GitHub не выполнялась. Slug `minimal-architecture`, пакет `templates/packages/minimal-architecture.v1.json`, ветка `feat/minimal-architecture-template`.

## 1. Источник и цель

Архитектурный план дня: интерактивные зоны, чёткий гротеск, бетонные фотографии и кобальт.

Источник: `design/references/minimal-architecture/full-reference.png`; отдельные `01-artboard.png` … `04-artboard.png`, `geometry.json`, `template-blueprint.json`. `design/COMMON-IMPLEMENTATION.md` обязателен и имеет приоритет над ранними ограничениями ширины. Viewport 430×932, вся ширина телефона, DPR 1. Геометрия оценена по растру и нормализована по ширине без растяжения; исходные Figma-слои отсутствуют. Высоты ниже не фиксировать при изменении текста/ошибках. Внешняя рамка и радиусы демонстрационного смартфона не являются частью сайта.

## 2. Дизайн-токены

| Токен | HEX |
|---|---|
| paper | #F5F5F3 |
| ink | #111315 |
| surface | #E5E1D8 |
| accent | #1430E5 |
| border | #A0A0A0 |
| ivory | #FFFFFF |

Display: Onest / Inter Tight или канонический sans normal, 600–700; body: канонический Onest / Inter normal 400–600. Поддержка RU/KY. Никакого курсива. Не подменять шрифт растровым текстом. Целевой размер имён 58–76 px, line-height 1.02–1.12; heading 28–44/1.15; body 16/23; caption 13/18; label 15/20, weight 600; title case/uppercase по референсу. Трекинг имён −1…0 px, верхние подписи 1.5–3 px. При длинных именах перенос или умеренное уменьшение; не scaleX.

## 3. Геометрия всех основных элементов

Координаты X/Y от верхнего левого угла каждого артборда, в CSS px. Вложенные строки виджета — визуальные части, не отдельные дублирующие бизнес-компоненты.

### cover — Обложка · 430 × 1142

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| hero | image | 0 | 0 | 430 | 1142 |
| header | text | 47 | 39 | 335 | 40 |
| eyebrow | text | 47 | 130 | 335 | 53 |
| rule | decoration | 47 | 199 | 61 | 3 |
| names | text | 39 | 240 | 348 | 139 |
| date | text | 47 | 410 | 335 | 39 |
| submitLink | button | 37 | 983 | 357 | 57 |
| next | button | 185 | 1077 | 60 | 50 |

### plan — План дня · 430 × 1151

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| heading | text | 37 | 35 | 357 | 104 |
| rule | decoration | 39 | 153 | 62 | 3 |
| plan | floorPlan | 24 | 196 | 383 | 403 |
| zone1 | button | 52 | 213 | 150 | 173 |
| zone2 | button | 206 | 253 | 172 | 173 |
| zone3 | button | 52 | 391 | 163 | 161 |
| zone4 | button | 219 | 397 | 172 | 173 |
| detail | frame | 17 | 642 | 396 | 196 |
| detailTitle | text | 43 | 669 | 344 | 66 |
| detailDescription | text | 43 | 746 | 327 | 73 |
| zoneTabs | buttons | 17 | 863 | 396 | 122 |
| buildingSketch | decoration | 0 | 1024 | 430 | 127 |

### venue — Место и дресс-код · 430 × 1157

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| portrait1 | image | 26 | 34 | 262 | 359 |
| blueSquare | decoration | 288 | 101 | 60 | 74 |
| portrait2 | image | 219 | 172 | 189 | 278 |
| venuePhoto | image | 0 | 411 | 430 | 255 |
| heading | text | 33 | 687 | 366 | 46 |
| venueName | text | 75 | 738 | 322 | 37 |
| venueAddress | text | 75 | 775 | 322 | 29 |
| map | button | 27 | 810 | 376 | 56 |
| rule | decoration | 34 | 891 | 366 | 1 |
| dressHeading | text | 33 | 908 | 366 | 37 |
| dressCopy | text | 33 | 943 | 366 | 46 |
| palette | dressCode | 33 | 1007 | 366 | 93 |

### rsvp — Ответ гостя · 430 × 1148

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| heading | text | 37 | 52 | 357 | 103 |
| rule | decoration | 39 | 173 | 60 | 3 |
| intro | text | 39 | 193 | 353 | 55 |
| nameLabel | text | 34 | 278 | 361 | 23 |
| name | input | 34 | 315 | 361 | 55 |
| attendanceLabel | text | 34 | 391 | 361 | 23 |
| yes | radio | 34 | 429 | 168 | 56 |
| no | radio | 215 | 429 | 189 | 56 |
| guestsLabel | text | 34 | 509 | 361 | 23 |
| stepper | stepper | 34 | 540 | 361 | 54 |
| wishLabel | text | 34 | 615 | 361 | 23 |
| wish | textarea | 34 | 645 | 361 | 104 |
| counter | text | 335 | 761 | 64 | 21 |
| submit | button | 28 | 808 | 378 | 57 |
| music | music | 22 | 906 | 396 | 96 |
| concrete | decoration | 0 | 1016 | 430 | 132 |

## 4. Стили контролов и состояния

- Input: ширина по geometry, min-height 48, border 1px #A0A0A0, radius 12px, padding 12–14px, font 16/22. Светлая секция: paper/surface, ink, приглушённый placeholder.
- Radio: высота ≥48, radius 12px, gap 10, circle 22px. Активное состояние — контрастная заливка/рамка accent и видимая отметка.
- Stepper: высота ≥48, +/- ≥44×44, табличные цифры 18px, disabled на границах.
- Textarea: высота по geometry, min-height 88, border и radius как input, 500 символов, счётчик.
- Submit: ширина по geometry, min-height 52, radius 12px, font 16/22 weight 600, фон accent, контрастный белый текст. Map/calendar outline 1px, min-height 48. Для узкого viewport контролы растут, не уменьшаются.
- Music: общий compact player, min-height 72, play/pause ≥44×44. Пустой source: не показывать фальшивый play.
- Hover (только pointer), focus-visible 2px с отступом 3px, active, disabled, pending, error, success по COMMON-IMPLEMENTATION. Никаких неработающих кнопок/иконок.

## 5. Общие новые возможности

- **schedule** — floorPlan layout: 4 optional event zones with stable IDs; zone selection syncs detail and tabs; diagram is schematic, not navigation map.
- **dressCode** — 3–5 swatches with names RU/KY and HEX, optional, accessible labels.
- **location** — existing map link with real host address.
- **rsvp** — minimal cobalt variant.

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
| response | rsvp | rsvp | rsvp |
| musicTrack | music | music | music |
| plan | schedule | plan | schedule |
| portrait1 | image | portrait1 | photos |
| portrait2 | image | portrait2 | photos |
| dressCode | proposed-dress-code | palette | appearance |

Редактируемые заголовки/подписи/текст — RU/KY. Связать все даты с ceremonyDate; фото — отдельные assets с cover/contain, не растр целого артборда. Список полей blueprint — проект, сверить реальные nodeId/key и ограничения Zod. Включить загрузку и замену каждого пользовательского фото, даже если демонстрационная галерея заполнена. Декор заблокирован.

## 7. Реализация и тестирование

1. Прочитать общий контракт и проверить существующий движок; определить, какие виды уже реализованы.
2. Восстановить самостоятельные фотографии и декоративные SVG; reference не является готовой фотографией или background всей секции. Не копировать логотипы сторонних брендов, не обещать музыку/видео без прав и реальных файлов.
3. Добавить типизированные опциональные возможности и тесты, создать пакет, обновить registry/allowlist только необходимыми assets.
4. Проверить visual QA: четыре скриншота на ширине 430, дополнительные 390 и 320–430, обе локали, длинный текст, корректное изменение высоты.
5. Полноценный функциональный E2E на отдельной БД, frontend/backend typecheck и build. Отчёт, скриншоты, известные ограничения.

Команда `npm run test:minimal-architecture` — добавить, если отсутствует. Документация `docs/studio-v2/MINIMAL-ARCHITECTURE.md`. Ветка `feat/minimal-architecture-template`. Не сливать до проверки актуального main.

Особенность: четыре зоны на плане отображают последовательность событий, не реальные комнаты; нажатие переключает карточку подробностей и выделение соответствующего пункта. Для клавиатуры дублирующие кнопки, для narrow viewport — список. Не заявлять точную схему площадки.
