# Cinema Wedding — Eventiq / Codex

Статус: Последний выбранный визуальный концепт. Реализация в GitHub не выполнялась. Slug `cinema-wedding`, пакет `templates/packages/cinema-wedding.v1.json`, ветка `feat/cinema-wedding-template`.

## 1. Источник и цель

Кинопремьера: видеообложка, эпизоды истории, титры и билет на премьеру.

Источник: `design/references/cinema-wedding/full-reference.png`; отдельные `01-artboard.png` … `04-artboard.png`, `geometry.json`, `template-blueprint.json`. `design/COMMON-IMPLEMENTATION.md` обязателен и имеет приоритет над ранними ограничениями ширины. Viewport 430×932, вся ширина телефона, DPR 1. Геометрия оценена по растру и нормализована по ширине без растяжения; исходные Figma-слои отсутствуют. Высоты ниже не фиксировать при изменении текста/ошибках. Внешняя рамка и радиусы демонстрационного смартфона не являются частью сайта.

## 2. Дизайн-токены

| Токен | HEX |
|---|---|
| paper | #201914 |
| ink | #F3E7D7 |
| surface | #F9EFE4 |
| accent | #A52825 |
| border | #90745A |
| ivory | #F8F1E7 |

Display: Noto Serif Display / Noto Serif normal, 400–600; body: канонический Onest / Inter normal 400–600. Поддержка RU/KY. Никакого курсива. Не подменять шрифт растровым текстом. Целевой размер имён 64–82 px, line-height 1.02–1.12; heading 28–44/1.15; body 16/23; caption 13/18; label 15/20, weight 600; title case/uppercase по референсу. Трекинг имён −1…0 px, верхние подписи 1.5–3 px. При длинных именах перенос или умеренное уменьшение; не scaleX.

## 3. Геометрия всех основных элементов

Координаты X/Y от верхнего левого угла каждого артборда, в CSS px. Вложенные строки виджета — визуальные части, не отдельные дублирующие бизнес-компоненты.

### cover — Обложка · 430 × 1741

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| header | text | 30 | 44 | 370 | 87 |
| heroPoster | image | 0 | 0 | 430 | 888 |
| trailerPlay | button | 160 | 557 | 110 | 113 |
| trailerLabel | text | 60 | 740 | 310 | 78 |
| eyebrow | text | 47 | 844 | 335 | 78 |
| names | text | 43 | 975 | 344 | 235 |
| date | text | 47 | 1236 | 335 | 56 |
| venue | text | 52 | 1288 | 327 | 45 |
| landscape | decoration | 0 | 1323 | 430 | 418 |
| next | button | 163 | 1602 | 103 | 96 |

### story — История пары · 430 × 1782

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| filmTrim | decoration | 0 | 0 | 138 | 160 |
| heading | text | 52 | 107 | 327 | 160 |
| intro | text | 47 | 258 | 335 | 98 |
| storyVideo | video | 24 | 374 | 383 | 303 |
| episode1 | image | 22 | 722 | 185 | 241 |
| episode1Copy | text | 219 | 748 | 189 | 214 |
| episode2 | image | 22 | 980 | 185 | 241 |
| episode2Copy | text | 219 | 1007 | 189 | 214 |
| episode3 | image | 22 | 1247 | 185 | 241 |
| episode3Copy | text | 219 | 1274 | 189 | 205 |
| reel | decoration | 0 | 1515 | 430 | 267 |

### event — Дата, программа и место · 430 × 1770

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| venueHero | image | 0 | 0 | 430 | 336 |
| dateHeading | text | 43 | 327 | 344 | 53 |
| date | text | 47 | 381 | 335 | 71 |
| calendar | button | 30 | 474 | 370 | 58 |
| divider | decoration | 129 | 558 | 172 | 5 |
| programHeading | text | 43 | 588 | 344 | 57 |
| program | schedule | 24 | 664 | 383 | 381 |
| venueHeading | text | 26 | 1115 | 378 | 53 |
| venuePhoto | image | 17 | 1177 | 396 | 257 |
| venueText | text | 41 | 1451 | 366 | 74 |
| map | button | 22 | 1531 | 387 | 58 |
| foliage | decoration | 206 | 1628 | 224 | 142 |

### rsvp — Ответ гостя · 430 × 1782

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| clapper | decoration | 0 | 0 | 430 | 339 |
| heading | text | 30 | 347 | 370 | 107 |
| intro | text | 37 | 463 | 357 | 71 |
| nameLabel | text | 28 | 536 | 374 | 32 |
| name | input | 28 | 570 | 374 | 61 |
| attendanceLabel | text | 28 | 650 | 374 | 32 |
| yes | radio | 28 | 684 | 374 | 55 |
| no | radio | 28 | 748 | 374 | 55 |
| guestsLabel | text | 28 | 823 | 374 | 32 |
| stepper | stepper | 28 | 857 | 374 | 59 |
| wishLabel | text | 28 | 939 | 374 | 32 |
| wish | textarea | 28 | 980 | 374 | 110 |
| counter | text | 327 | 1101 | 75 | 27 |
| submit | button | 26 | 1140 | 378 | 75 |
| music | music | 26 | 1256 | 378 | 121 |
| closing | decoration | 0 | 1417 | 430 | 365 |

## 4. Стили контролов и состояния

- Input: ширина по geometry, min-height 48, border 1px #90745A, radius 12px, padding 12–14px, font 16/22. Тёмная секция: прозрачное поле, светлый текст и контур, проверять контраст.
- Radio: высота ≥48, radius 12px, gap 10, circle 22px. Активное состояние — контрастная заливка/рамка accent и видимая отметка.
- Stepper: высота ≥48, +/- ≥44×44, табличные цифры 18px, disabled на границах.
- Textarea: высота по geometry, min-height 88, border и radius как input, 500 символов, счётчик.
- Submit: ширина по geometry, min-height 52, radius 12px, font 16/22 weight 600, фон ivory, ink текст. Map/calendar outline 1px, min-height 48. Для узкого viewport контролы растут, не уменьшаются.
- Music: общий compact player, min-height 72, play/pause ≥44×44. Пустой source: не показывать фальшивый play.
- Hover (только pointer), focus-visible 2px с отступом 3px, active, disabled, pending, error, success по COMMON-IMPLEMENTATION. Никаких неработающих кнопок/иконок.

## 5. Общие новые возможности

- **video** — media asset: verified poster + optional video asset, controls, captions, fallback image; no autoplay audio.
- **story** — 1–6 episodes, filmstrip layout; date/title/description/photo via shared story widget.
- **calendar** — existing calendar action / ICS.
- **rsvp** — extended existing RSVP, cinematic appearance.

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
| trailer | proposed-video | storyVideo | photos |

Редактируемые заголовки/подписи/текст — RU/KY. Связать все даты с ceremonyDate; фото — отдельные assets с cover/contain, не растр целого артборда. Список полей blueprint — проект, сверить реальные nodeId/key и ограничения Zod. Включить загрузку и замену каждого пользовательского фото, даже если демонстрационная галерея заполнена. Декор заблокирован.

## 7. Реализация и тестирование

1. Прочитать общий контракт и проверить существующий движок; определить, какие виды уже реализованы.
2. Восстановить самостоятельные фотографии и декоративные SVG; reference не является готовой фотографией или background всей секции. Не копировать логотипы сторонних брендов, не обещать музыку/видео без прав и реальных файлов.
3. Добавить типизированные опциональные возможности и тесты, создать пакет, обновить registry/allowlist только необходимыми assets.
4. Проверить visual QA: четыре скриншота на ширине 430, дополнительные 390 и 320–430, обе локали, длинный текст, корректное изменение высоты.
5. Полноценный функциональный E2E на отдельной БД, frontend/backend typecheck и build. Отчёт, скриншоты, известные ограничения.

Команда `npm run test:cinema-wedding` — добавить, если отсутствует. Документация `docs/studio-v2/CINEMA-WEDDING.md`. Ветка `feat/cinema-wedding-template`. Не сливать до проверки актуального main.

Визуальная поправка: главная кнопка красная #A52825, белый текст, radius 999px, min-height 56; светлые акценты #F9EFE4. Плеер 16:9 с нативными контролами, без фиктивной длительности.
