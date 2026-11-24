# Love Story — спецификация Eventiq / Codex

Статус: утверждённый дизайн + автономный HTML-прототип + проект контракта будущего Template Package. Не импортировать blueprint в API: новый виджет требует расширения схем. Код GitHub, production БД и опубликованные приглашения не изменены. Референс `design/references/love-story/full-reference.png`, четыре артборда по 390 × 1045 CSS px, DPR 1. Viewport 390 × 844. Высота 4180 px номинальная; длинный контент должен расширять секции. Координаты измерены по растру, это не исходные Figma-слои. Вырезки фотографий низкого разрешения, восстановить чистые самостоятельные ресурсы. Дата 29 мая 2027, 17:00 Бишкек; место, история и имена демонстрационные. Не использовать выдуманный адрес как реальную локацию.

## 1. Концепция

Фотоистория на плёнке: крупная типографика на фоне неба, три главы знакомства вместо стандартной галереи, свадебный билет с добавлением в календарь, RSVP в виде почтовой открытки. Не добавлять countdown, календарную сетку, stackedMosaic или новый редактор. Прямой шрифт без курсива. Использовать текущую тему только внутри приглашения; не менять shell каталога, desktop, Studio или customer chrome. Сначала читать актуальные DESIGN.md, UX-CONTRACT.md, схемы и изменения Italian Romance. Новые возможности включаются только по параметрам пакета.

## 2. Токены

| Токен | HEX | Назначение |
|---|---|---|
| paper | #F6F0E7 | Бумага, открытка |
| sky | #B8CAD4 | Голубая обложка, акценты |
| ink | #302824 | Основной текст |
| wine | #791F35 | Дата, линия истории, CTA |
| line | #A99B8D | Границы полей |
| white | #FFF9F1 | Фоторамки и билет |
| muted | #6E625A | Подписи |

Display: существующий Noto Serif Display или Noto Serif normal, 400/600; body: Onest или актуальный sans normal, 400/600; проверить Ө Ү Ң. Целевые размеры: имена 82/88, трекинг −2 px, перенос двух имён; дата обложки 26/32, трекинг 4 px; заголовки 32/38, трекинг 3 px; дата истории 24/28; заголовок главы 16/20 semibold; текст главы 14/18; дата билета 40/48; время 20/25; подписи 12/16 с трекингом 1.5; поля 16/22; кнопки 15/20 semibold. Все значения px, адаптировать под локали и текущие единицы схемы. Контраст WCAG AA, видимый focus, touch target минимум 44×44. Декор: скругление артборда только в презентации макета, не делать рамку телефона. Лёгкие тени физических фотокарточек, без теней на контролах. Отдельные SVG-орнаменты/фактура, не запекать текст в изображения.

## 3. Геометрия

X/Y относительно верхнего левого угла соответствующего артборда. Внутренние layout/input/radio/button не являются дублирующими самостоятельными виджетами. Размеры в JSON — целевые, допуск 4 px для крупных блоков в baseline; минимум touch 44 важнее геометрии. При необходимости увеличивать высоту строки и сдвигать последующие блоки, не обрезать контент. Чистые фотографии в production должны быть заново подготовлены, не использовать весь референс как фон.

### cover — 390 × 1045

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| coverSky | background | 0 | 0 | 390 | 468 |
| eyebrow | text | 36 | 43 | 208 | 36 |
| eyebrowRule | decoration | 37 | 102 | 46 | 3 |
| names | text | 34 | 144 | 335 | 171 |
| date | text | 40 | 348 | 302 | 33 |
| coverPhoto | image | 0 | 394 | 390 | 650 |
| storyLink | button | 107 | 928 | 216 | 85 |
| scrollIcon | button | 184 | 963 | 46 | 46 |

### story — 390 × 1045

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| storyRule | decoration | 44 | 50 | 45 | 3 |
| storyTitle | text | 43 | 75 | 295 | 69 |
| storySubtitle | text | 45 | 162 | 295 | 36 |
| storyTimeline | widget | 24 | 219 | 358 | 691 |
| storyLine | decoration | 30 | 272 | 2 | 602 |
| meetingDate | text | 54 | 263 | 128 | 28 |
| meetingTitle | text | 55 | 300 | 130 | 38 |
| meetingText | text | 55 | 352 | 130 | 78 |
| meetingPhoto | image | 195 | 224 | 188 | 227 |
| tripDate | text | 54 | 498 | 132 | 28 |
| tripTitle | text | 56 | 531 | 132 | 45 |
| tripText | text | 56 | 583 | 128 | 76 |
| tripPhoto | image | 193 | 472 | 191 | 223 |
| proposalDate | text | 55 | 725 | 129 | 28 |
| proposalTitle | text | 56 | 760 | 129 | 44 |
| proposalText | text | 56 | 813 | 129 | 63 |
| proposalPhoto | image | 201 | 711 | 182 | 198 |
| landscapeFooter | decoration | 0 | 917 | 390 | 124 |

### details — 390 × 1045

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| ticket | layout | 22 | 37 | 350 | 315 |
| ticketEyebrow | text | 67 | 70 | 264 | 40 |
| ticketDate | text | 66 | 129 | 283 | 52 |
| ticketDay | text | 71 | 207 | 110 | 26 |
| ticketTime | text | 210 | 197 | 108 | 33 |
| calendarAction | button | 141 | 262 | 210 | 46 |
| dayHeading | text | 97 | 394 | 209 | 33 |
| program | widget | 26 | 441 | 338 | 189 |
| event1 | layout | 37 | 446 | 317 | 43 |
| event2 | layout | 37 | 494 | 317 | 43 |
| event3 | layout | 37 | 542 | 317 | 43 |
| event4 | layout | 37 | 590 | 317 | 43 |
| venuePhoto | image | 10 | 652 | 368 | 188 |
| venueName | text | 71 | 853 | 289 | 30 |
| venueAddress | text | 71 | 882 | 289 | 24 |
| mapAction | button | 27 | 921 | 336 | 54 |

### rsvpPage — 390 × 1045

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| airmailBorder | decoration | 1 | 0 | 389 | 47 |
| stamp | decoration | 275 | 38 | 94 | 92 |
| rsvpHeading | text | 43 | 72 | 229 | 58 |
| rsvpIntro | text | 44 | 156 | 312 | 40 |
| rsvpWidget | widget | 32 | 216 | 336 | 400 |
| nameLabel | text | 39 | 216 | 209 | 16 |
| nameInput | input | 37 | 236 | 328 | 43 |
| attendanceLabel | text | 39 | 299 | 328 | 18 |
| attendanceYes | radio | 38 | 322 | 143 | 42 |
| attendanceNo | radio | 191 | 322 | 174 | 42 |
| guestLabel | text | 38 | 395 | 174 | 16 |
| guestStepper | control | 225 | 382 | 140 | 42 |
| wishLabel | text | 38 | 438 | 282 | 16 |
| wishInput | textarea | 37 | 457 | 328 | 81 |
| wishCounter | text | 315 | 544 | 49 | 16 |
| submit | button | 35 | 568 | 332 | 48 |
| music | widget | 35 | 644 | 332 | 75 |
| closingPhoto | image | 15 | 733 | 370 | 250 |
| footerPaper | decoration | 0 | 954 | 390 | 91 |

## 4. Контролы и состояния

- Поле имени: 326 px в baseline, 46 px min-height, padding 12px 16px, radius 12px, border 1px #A99B8D, background transparent/cream, text #302824. Placeholder #6E625A. Font 16px, autocomplete name, trim, max 120. Ошибка под полем; aria-invalid, aria-describedby.
- Radio: две строки/колонки в зависимости от длины локали, gap 10px, 44px min-height, radius 12px, padding 10px; selected border #791F35, fill #F3E2DC, radio 20px. На 320 px и длинной KY строке переносить целиком. Семантическая группа, клавиатура.
- Stepper: 140×44 минимум, border 1px #A99B8D, radius 12, отдельные minus/plus по 44×44, счётчик 16px tabular. min 1, max из опубликованного rsvp.maxGuests; если attendance=no, скрыть, отправить 0. Не создавать второй state в payload.
- Textarea пожелания: 326×80 минимум, 16/22, padding 12px, radius 12px, 1px border, resize none, auto-grow до разумного предела; 500 символов max (одинаковая семантика подсчёта в frontend/backend). Counter 12/16 справа. Не терять введённый текст при ошибке.
- Primary: 332×48 минимум, wine фон, white текст 15/20 semibold uppercase, radius 15px, padding 12px 18px, стрелка справа. Hover чуть темнее, active #601527, disabled визуально приглушён, focus-visible outline 2px и offset 3px. Во время запроса сохранить размеры, блокировать повторный submit, показывать текст статуса. Не считать успехом локальную валидацию.
- Calendar: 210×46 min, wine border 1px, radius 14px, иконка 20px. Map: 336×52, ink border 1px, radius 12px, icon 22px. Оба действия реально работают; карта только после заданного места, демонстрационная ссылка подписана.
- Music: компактная карточка с обложкой 54×54, play/pause 44×44, название и автор из каталога; прогресс только при реальном аудио, обработка ошибок/загрузки, без самопроизвольного autoplay. Отсутствующий трек не подменять известной композицией или фальшивой кнопкой.
- Фото: открывать по тапу в существующем lightbox, swipe + кнопки 44px + Escape + клавиатура; восстановить фокус, корректный alt, предсказуемый z-index. Не включать заблокированный декор в фотоцели.

## 5. Новый переиспользуемый StoryTimeline

Предлагаемый discriminant `kind: story`, layout `filmstrip`. Использовать общие Zod schemas и versioned Template Package v1, schemaVersion 2; расширить все исчерпывающие switch/Record, BLOCK_NAMES, factory, property inspector, render, validation, persistence, remote import, public snapshots, media reference collection, personalization, asset verification, export, responsive layout. Проверить актуальный main, имена в blueprint — план, а не подтверждённый контракт. Не вводить параллельный API/редактор.

Предлагаемый item: `{id, date: YYYY-MM-DD, title:{ru,ky}, description:{ru,ky}, assetId}`. ID стабильный; дата календарная без преобразования в UTC; проверять реальную дату (включая високосные), не просто regex. 1–6 глав (default 3); уникальные IDs; заголовок <=80, описание <=300, обе локали. Проверять ссылку на существующий/разрешённый asset; порядок отображения определяется порядком массива (допускается ручная перестановка), дата не сортирует автоматически. Декор/film frame отдельно. Фотографии глав входят в общий asset ownership и upload pipeline, нельзя обойти права через вложенные ID. Применение patch атомарно; сохранение/undo/redo; удаление главы не удаляет оригинал из хранилища без существующей безопасной GC. Длинная история растит артборд. В мобильном редакторе использовать существующий bottom sheet: список глав, добавить/удалить, сменить порядок, дата, RU/KY title/description, заменить фото. Нужны кнопки вверх/вниз как альтернатива drag. Ограничить добавление по maxItems; сохранить прежнюю запись, если загрузка завершилась ошибкой. Для фото переиспользовать prepareCustomerPhoto, HEIC, R2 и существующую авторизацию; не требовать разрешения от пользователя. Не дублировать gallery maxPhotos ради истории.

## 6. CalendarAction

Переиспользовать блок, если его уже реализовал Italian Romance. Дата берётся из `ceremonyDate` (единый source of truth), не отдельный day/month/year. Кнопка скачивает валидный UTF-8 `.ics` с VCALENDAR, VEVENT, UID стабильным для приглашения, DTSTAMP текущим, DTSTART и DTEND UTC; TZ Asia/Bishkek для демо. Длительность настраивается (default 300 минут), не менять дату в процессе. Экранировать `\`, запятую, точку с запятой и переносы, CRLF, folding строк по RFC 5545 с учётом UTF-8; исключить инъекцию дополнительных свойств. Заголовок и место берутся из локализованных переменных; дату окончания рассчитать. При невалидной дате отключить кнопку с понятной подсказкой. Тестировать смену даты, переход суток, RU/KY, фактическое скачивание и содержимое файла.

## 7. RSVP / backend

Переиспользовать расширенный RSVP и compact music из Italian Romance, если уже появились. Не создавать второе поле wish/вторую миграцию, если оно уже существует. Если нет — optional `wishEnabled`, `guestCountControl: stepper` у виджета, optional wish в общей frontend/backend strict Zod schema. Проверить CustomerRsvpResponse, Prisma migration с nullable wish, DTO/OpenAPI, select/owner dashboard, legacy и customer endpoints и поведение idempotency: одинаковый requestId+payload повторно не создаёт ответ, изменение wish при том же requestId считается конфликтом. Ограничение 500 символов на сервере, strip/trim; plain text, React escaping, никакого HTML. Пожелания не раскрывать публично, только проверенному владельцу. Не отменять Turnstile, throttle, deadline, maxGuests, owner guards. Отправка в preview ничего не пишет. Демо HTML не имитирует production delivery. Проверять existing publication versions без новых полей, старые drafts и schema defaults.

## 8. Файлы и реализация

- `templates/packages/love-story.v1.json` (валидный после расширения схем); slug `love-story`; blueprint содержит 11 полей-проектов, а не готовую импортируемую схему.
- `public/images/love-story/` — чистые WebP и отдельные SVG, размер metadata в байтах после финального сохранения; SVG canonical LF; существующий trusted static registry. 6 редактируемых фото: cover, 3 story, venue, closing. landscape и текстура заблокированы. Демо crops находятся в prototype/assets; заменить в production качественными самостоятельными файлами без надписей/номеров.
- `docs/studio-v2/LOVE-STORY.md`, `npm run test:love-story`. Reuse `scripts/import-eventiq-mobile.mjs <workspaceId> love-story` после готовности схемы. Не публиковать в рабочую БД без отдельного действия пользователя.
- Ветка `feat/love-story-template`, актуальный main, проверить параллельные изменения, no force push. В main только после успешных проверок; если конфликт — разрешить сохраняя другие шаблоны.

## 9. Обязательная QA

Browser/Playwright: 390×844 DPR 1, отдельные снимки всех четырёх артбордов, сопоставить `01–04-artboard.png`; повторить после правок. 320/360/375/390/412/430, RU/KY, длинные имена и описания, 1/3/6 глав, перестановка, добавление/удаление, смена всех фото (HEIC/JPEG/PNG/WebP), ошибка загрузки и восстановление черновика, swipe/keyboard/focus, календарь ICS, карта, play/pause, RSVP idle/loading/error/success/decline/wish. 200% zoom, reduced motion, отсутствие горизонтального скролла и обрезки, размеры touch targets. Backend/frontend typecheck, build, regression suites, отдельная disposable PostgreSQL и тестовое object storage для E2E; не использовать production database. Проверить импорт, повторный импорт, сохранение, публикацию, RSVP idempotency, доступ к wishes только владельцу. Отчёт с фактическими командами, ограничениями, скриншотами и итоговым SHA. Не объявлять тесты пройденными без выполнения.

## 10. Автономный прототип

`prototype/index.html` и `prototype/assets/` — независимая HTML/CSS/JS демонстрация композиции. Она не является новым клиентским редактором или альтернативным движком. Событие .ics действительно скачивается по коду обработчика, просмотр фото, переключение RU/KY, шаговый счётчик, валидация и локальный выбор аудио реализованы. Данные не сохраняются/не отправляются в backend. В этой среде Chromium заблокировал переходы к file:// и localhost политикой администратора; визуальная проверка и интерактивные тесты не завершены. Выполнена статическая проверка JS и файлов; требуется реальная проверка Codex. Фото, размеры и фактура прототипа отличаются от исходного растра; authoritative visual target — full-reference и artboards, не прототип.
