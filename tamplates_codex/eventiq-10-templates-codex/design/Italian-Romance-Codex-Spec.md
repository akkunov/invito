# Italian Romance — техническое задание для Codex

Статус: утверждённый визуальный концепт, handoff для реализации, не готовый импортируемый пакет. Источник: `design/references/italian-romance/full-reference.png` (1536 × 1024). Четыре нормализованных артборда 390 × 1058 CSS px, основной viewport 390 × 844, DPR 1. Номинальная высота 4232 px; страницы могут расти при длинном тексте и ошибках формы. `geometry.json` содержит координаты 64 элементов; `template-blueprint.json` содержит план контракта, а не валидный Template Package. Подгонка растрового референса даёт целевые, а не исходные Figma-координаты. Приложенные crops — только референсы, включая текст/маски/рамки в отдельных вырезках; не публиковать их как чистые фото.

## 1. Цель и ограничения

Eventiq / Studio v2, свадебное приглашение для RU/KY, mobile first. Не менять публичную оболочку, админский Studio, UniversalMobileEditor, старые версии и черновики без необходимого совместимого расширения. Проверить актуальные DESIGN.md и схемы на момент начала. Новый пакет `templates/packages/italian-romance.v1.json`, slug `italian-romance`, manifest category WEDDING, presentation `italian` (предложенный новый opt-in вариант). Идентичность: открытка из Тосканы, фотоальбом Polaroid, календарь вместо countdown, конверт с печатью в RSVP. Никаких таймеров, мозаики 1–2–1 или отдельного React-редактора. Не переносить рукописные и наклонные шрифты из референса: имена, подписи и Grazie! — upright, эстетика сохраняется. Оливковая RSVP-секция сохраняется согласно последнему макету. Демо-место Villa Toscana; адрес уточняется пользователем, не утверждать существование ресторана по нарисованному адресу.

## 2. Токены и общий ритм

| Токен | Значение | Применение |
|---|---|---|
| paper | #F8EFE0 | светлые секции |
| ink | #34271C | текст на бумаге |
| olive | #383F24 | RSVP |
| cream | #F9EBD6 | текст и кнопка RSVP |
| terracotta | #B84220 | дата календаря, акценты |
| line | #A99374 | разделители, карточка места |
| gold | #846022 | иконки программы |

Шрифт display: существующий локальный Noto Serif Display / Noto Serif, normal, с проверкой Ө, Ү, Ң; body: существующий Onest / sans normal. Не загружать внешние шрифты без необходимости. Преобразовать lineHeightPx в единицы, которые принимает текущая схема. Размеры из geometry.json задают базовое состояние; реальные строки могут переноситься. Не масштабировать интерактивные контролы ниже 44×44 CSS px. Боковые отступы 16–36 px в зависимости от артборда. Без теней у обычных полей; лёгкая тень допустима у физических фотокарточек и конверта. Для текстуры — отдельный лёгкий декоративный ресурс, не скриншот страницы. Не использовать градиенты как замену фотографии, не добавлять глобальные CSS-правила. Контраст текста и контуров WCAG AA; проверять реальный фон.

## 3. Геометрия всех элементов

Все координаты X/Y относительно верхнего левого угла соответствующего артборда. Строки layout, input, radio, icon внутри виджета описывают его внутреннюю разметку, а не отдельные узлы поверх виджета. `geometry.json` — машинно-читаемые стили/размеры. Приоритет: корректное взаимодействие и отсутствие обрезки, затем совпадение с референсом. Допуск по геометрии главных блоков — 4 px при базовой ширине в нормальном состоянии, исключая явно документированные улучшения доступности. Не подгонять текст отрицательным масштабом или неестественным сжатием.

### cover — 390 × 1058

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| coverScene | image | 0 | 0 | 390 | 1058 |
| coverBrand | text | 149 | 131 | 117 | 41 |
| coverTopRule | decoration | 174 | 186 | 64 | 7 |
| coverEyebrow | text | 113 | 208 | 183 | 42 |
| coverNames | text | 77 | 275 | 256 | 174 |
| coverBottomPaper | decoration | 0 | 879 | 390 | 179 |
| coverDate | text | 90 | 915 | 237 | 36 |
| coverVenue | text | 112 | 958 | 200 | 21 |
| scrollNext | button | 183 | 988 | 46 | 46 |

- `coverScene`: Independent image of couple in arch; no baked words. Upper sky must remain clear.
- `coverNames`: Two names with upright ampersand in terracotta, or localized conjunction; long names fit/wrap.
- `coverBottomPaper`: Locked paper curve over photo, no text baked in.

### invitation — 390 × 1058

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| villaSketch | decoration | 27 | 43 | 332 | 85 |
| oliveTop | decoration | 261 | 0 | 129 | 137 |
| invitationCopy | text | 42 | 131 | 307 | 92 |
| ruleAboveCalendar | decoration | 77 | 236 | 239 | 10 |
| calendar | widget | 31 | 257 | 332 | 269 |
| calendarPrev | button | 31 | 258 | 28 | 29 |
| calendarMonth | text | 95 | 257 | 207 | 30 |
| calendarNext | button | 329 | 258 | 35 | 29 |
| calendarWeekdays | layout | 35 | 298 | 326 | 27 |
| calendarDays | layout | 35 | 327 | 326 | 196 |
| calendarNote | text | 102 | 524 | 233 | 40 |
| programHeading | text | 61 | 588 | 277 | 30 |
| program | widget | 31 | 640 | 336 | 281 |
| programRow1 | layout | 31 | 643 | 336 | 64 |
| programRow2 | layout | 31 | 712 | 336 | 64 |
| programRow3 | layout | 31 | 781 | 336 | 79 |
| programRow4 | layout | 31 | 864 | 336 | 58 |
| landscapeFooter | decoration | 0 | 933 | 390 | 125 |

- `calendar`: CalendarDate widget; local positions below.
- `calendarNote`: Replace handwritten annotation with upright text and small heart/arrow.
- `program`: Rows 16:00,17:00,18:30,22:00; icon at right, time left.

### gallery — 390 × 1058

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| storyQuote | text | 47 | 55 | 299 | 85 |
| quoteRule | decoration | 159 | 151 | 66 | 5 |
| polaroidGallery | widget | 7 | 183 | 375 | 253 |
| polaroidLeft | layout | 9 | 215 | 141 | 210 |
| polaroidCenter | layout | 113 | 184 | 187 | 251 |
| polaroidRight | layout | 253 | 232 | 136 | 200 |
| venueStoryPreview | image | 11 | 465 | 367 | 198 |
| videoPlayOptional | button | 170 | 543 | 49 | 49 |
| venueHeading | text | 23 | 697 | 342 | 28 |
| venueCard | widget | 21 | 745 | 347 | 88 |
| venueCardPin | icon | 38 | 763 | 24 | 28 |
| venueName | text | 81 | 761 | 242 | 22 |
| venueAddress | text | 80 | 785 | 243 | 36 |
| venueMapIcon | icon | 325 | 777 | 26 | 29 |
| venuePhoto | image | 12 | 858 | 365 | 173 |

- `storyQuote`: Upright quote; ornamental quote marks separately.
- `polaroidGallery`: Three photos; left/right behind central card, full screen on tap.
- `venueStoryPreview`: Optional video poster if actual validated video exists; otherwise normal photo with no play icon.
- `videoPlayOptional`: Only rendered with real video source and controls; not required for v1.

### rsvpPage — 390 × 1058

| ID | Тип | X | Y | W | H |
|---|---|---:|---:|---:|---:|
| envelope | decoration | 21 | 0 | 352 | 154 |
| rsvpHeading | text | 53 | 167 | 290 | 70 |
| rsvpIntro | text | 55 | 257 | 290 | 42 |
| rsvpWidget | widget | 26 | 316 | 340 | 399 |
| nameLabel | text | 36 | 317 | 321 | 20 |
| nameInput | input | 36 | 342 | 322 | 43 |
| attendanceLabel | text | 36 | 402 | 327 | 19 |
| attendanceYes | radio | 36 | 428 | 150 | 42 |
| attendanceNo | radio | 200 | 428 | 165 | 42 |
| guestsLabel | text | 36 | 491 | 203 | 20 |
| guestsStepper | stepper | 247 | 493 | 118 | 41 |
| wishLabel | text | 36 | 546 | 329 | 18 |
| wishInput | textarea | 36 | 569 | 329 | 68 |
| submit | button | 26 | 663 | 340 | 51 |
| musicCard | widget | 21 | 747 | 350 | 81 |
| musicArtwork | image | 35 | 761 | 56 | 51 |
| musicTitle | text | 104 | 771 | 126 | 36 |
| musicPlay | button | 235 | 769 | 39 | 40 |
| musicWave | decoration | 287 | 773 | 73 | 34 |
| thanksOlive | decoration | 150 | 858 | 80 | 34 |
| thanksText | text | 94 | 888 | 198 | 97 |
| thanksRule | decoration | 164 | 995 | 63 | 7 |

- `envelope`: Wax seal is locked artwork; no fixed initials A&A unless bound to names.
- `rsvpWidget`: Natural height; expand on errors or locale wrapping.
- `guestsStepper`: Increase width to at least 132 CSS px to fit two 44 px targets and value; stack label on narrow screens.
- `musicArtwork`: Optional reuse of venue photo; no separate upload required.
- `musicWave`: Decorative waveform only, not a fake progress bar.
- `thanksText`: Grazie! upright, no script; static closing independent of submission success.

## 4. Контракты новых возможностей (проектные, не существующие API)

На момент проверки main `invitationBlockSchema` разрешает rsvp/countdown/location/gallery/music/schedule. Gallery layout разрешает carousel/mosaic/stackedMosaic, max 4 фото. `rsvpInputSchema` принимает name, attendance, guests, а `CustomerRsvpResponse` не содержит пожелания. Не пытаться импортировать blueprint напрямую. Использовать строгие Zod-схемы; все дополнения backward-compatible, optional или новый discriminant. Не принимать произвольный CSS, HTML, JS или URL в персонализации. Не дублировать рендереры.

### CalendarDateBlock

Предложенный тип `{kind:"calendar", title:{ru,ky}, target: ISODateTime, targetKey:"ceremonyDate"}`. Расширить union, `BLOCK_NAMES`, фабрику виджетов, инспектор Studio, binding/reference validation, preview/live renderer и semantic validation. Использовать тот же `ceremonyDate`, что и на обложке; timezone `Asia/Bishkek` для демонстрационного события. Не добавлять три независимых переменных day/month/year. Изменение даты в редакторе атомарно обновляет обложку и календарь; открытие сразу показывает месяц события. Неделя понедельник–воскресенье, 7 колонок, до 6 строк, пустые ячейки не являются кнопками. Для мая 2027: 1 мая суббота, 29 мая суббота, 31 мая понедельник. Выделить 29 кругом #B84220, белая цифра и accessible label. Размер цифр 16, выделение около 36 px; кнопки месяца 44×44, допустимо расширить область виджета. Стрелки перелистывают месяц только в локальном состоянии гостя, не редактируют дату свадьбы; при просмотре другого месяца показывать понятный возврат к месяцу свадьбы. Дни информационные, не date picker. Подпись «День нашей свадьбы» / «Үйлөнүү тоюбуздун күнү». Опциональное действие «В календарь» — скачиваемый корректный .ics с DTSTART и локализованными summary/location, только если фактические дата и адрес известны; не обязательное для pixel-match. Если требуется duration, задать отдельно автором, не выдумывать время окончания. Тесты: високосный февраль, переход года, 28–31 число, timezone boundary, изменение даты, RU/KY, 320 px, клавиатура.

### StoryPolaroidGalleryBlock

Расширить существующий `kind:"gallery"`, `layout:"polaroid"` вместо нового отдельного хранилища. Три демонстрационных кадра, разрешено 1–4 фотографии. Боковые карточки наклонены примерно -10°/+12°, центральная +2° сверху; бумажная рамка 8 px и нижний кант 20–26 px. При 1 фото — центральная, при 2 — две без перекрытия интерактивных областей, при 4 — четвёртая отдельной строкой или отдельным кадром альбома с явной кнопкой, не скрывать фото. Все снимки доступны в существующем lightbox, swipe, Escape, стрелки, видимый счётчик, focus restoration. Декоративные тени не закрывают hit targets. `maxPhotos:4`, default 3; использовать текущий batch replace/append, автоконвертацию HEIC и signed URLs. Не менять исходники при повороте. Не создавать отдельные поля storyPhoto1..3: редактируется общий galleryPhotos. Цитата — связанный отдельный text node `quoteText`.

### VenueCardBlock и сюжетная фотография

Переиспользовать location widget с opt-in карточным видом в presentation italian; предложенное optional `nameKey` привязано к текстовой переменной `venueName`, адрес из существующего `addressKey`. Не дублировать адрес в несвязанных текстах. Карточка работает как ссылка открытия карты по валидному адресу, не фиктивная кнопка. Фото ресторана независимо заменяемое. Если адрес не задан — текст «Адрес уточняется» и недоступное действие с объяснением; не отправлять фиктивный адрес в карты. Верхний сюжетный кадр (venueStoryPreview) отдельное заменяемое фото. В эталоне поверх него play icon: в базовом пакете это обычное фото, без play. Видео — отдельное опциональное расширение только после реализации безопасного загрузчика/проверки формата, авторизации и storage policy, реального видеоресурса и управления воспроизведением. Не подменять видео статической картинкой или произвольным iframe. Никакого автозапуска видео со звуком.

### RSVP extended

Расширить существующий `rsvp` widget optional `wishEnabled:boolean`, `guestCountControl:"select"|"stepper"`; default сохраняет старые формы. Не включать редактирование этих флагов пользователем без отдельного контракта; для Italian Romance они задаются автором. Имя обязательное, 1–120 символов после trim; attendance yes/no; гостей 1..maxGuests при yes, 0 при no; шаг ±1, min 1 / max из разрешённой версии. При no скрыть stepper, отправлять 0. При yes восстановить разумное предыдущее значение в допустимых границах. Поле пожелания optional, plain text, trim, максимум 500 символов, пустое -> null; разрешено при обоих вариантах attendance. `textarea` минимум 68 px, 16 px шрифт, без ручного resize, auto-grow до разумной высоты; ошибки не перекрывают остальные элементы. Радио — нативные input внутри labels, двухколоночный layout в 390, при недостатке ширины переход в колонку. Кнопки -/+ минимум 44 px, stepper не меньше 132 px, значение доступно screen reader; кнопка submit 52 px или выше. Input 16 px во избежание автоматического увеличения iOS. Native noValidate, ошибки inline с aria-invalid и aria-describedby; focus first invalid, form live region. Busy блокирует повторную отправку без изменения размеров кнопки, ошибки сети сохраняют поля, retry с тем же requestId для того же payload. При успехе явное локализованное сообщение, не подменять его постоянным Grazie!.

**Обязательные backend изменения для пожеланий:** nullable поле `wish String? @db.VarChar(500)` в CustomerRsvpResponse и добавочная Prisma migration без reset/изменения существующих записей. Проверить также legacy publication endpoint: не расширять его неявно или без хранения. Если общий rsvpSchema используется в нескольких контроллерах, безопасно разделить схемы либо явно реализовать поддержку в каждом принимающем маршруте. Расширить frontend rsvpInputSchema, request serializer, customer RSVP schema/OpenAPI, сервис, idempotency comparison (нормализованное значение входит в сравнение payload), owner response DTO/select и dashboard. Проверить, что пожелание допустимо только для опубликованного rsvp node с wishEnabled, иначе reject непустое значение; старые клиенты без поля работают как прежде. Публичный ответ не раскрывает пожелание или другие данные гостей. Авторизованный владелец видит текст пожелания в «Мои приглашения». Не сохранять его в логах/URL. Сохранить Turnstile, rate-limit, ownership, дедлайн, honeypot и существующую защиту от дублей. Тесты: 500/501 символ, пробелы, disabled wish, старый payload, повтор requestId с тем же/изменённым wish, отсутствие утечки, разграничение владельцев. Никакой миграции production из среды тестов.

### MusicCardCompact

Переиспользовать существующий music widget и каталог GET /api/v1/catalog/music. Опциональный layout compact (или стиль presentation italian), обложка из безопасного ресурса/venue фото, фактические title/artist из каталога при наличии; иначе нейтральное локализованное «Музыка». Не показывать выдуманного исполнителя или «Our Song» как действующий трек. `source` только разрешённый контрактом; metadata не расширяет allowlist. При пустом источнике скрыть карточку либо показать честное состояние в редакторе. Воспроизведение по нажатию, play/pause, обработка отказа/ошибки, не создавать второй одновременно играющий audio. Волновой рисунок декоративный, если нет настоящей синхронизации прогресса. На гостевой странице реальный аудиоплеер, в Studio/preview соблюсти существующую политику. Сохранить лицензии и не встраивать коммерческие треки из референса.

## 5. JSON package и поля персонализации

`template-blueprint.json` описывает manifest, pages, значения/переменные, предлагаемые widget contracts и существующий personalization contract. Создать реальный `format:"eventiq-template",version:1,manifest,document,personalization` только после реализации расширений. `document.schemaVersion:2`, id, revision, locale, presentation, pages, nodes, assets, variables, values; root frame на каждый артборд, parentId/children согласованы, artboards на x=0,420,840,1260. Не копировать `documentPlan`, `status`, `photoAssets` и прочие planning keys в строгий production JSON. Заполнить узлы, стили и resource metadata по реальным файлам. Переиспользовать `validatedTemplateVersion`, `assertReadyAssets`, import script и общий renderer. Декор locked, не входит в editable image fields. Все значения текста — RU/KY; добавить статические текстовые bindings, где требует движок. Контракт разрешает только нужные поля и не допускает произвольных node patches.

| ID поля | kind | section | target |
|---|---|---|---|
| names | text | main | coupleNames |
| invitation | text | main | invitationText |
| quote | text | main | quoteText |
| date | date | date | ceremonyDate |
| venueName | text | location | venueName |
| address | text | location | venueAddress |
| coverPhoto | image | photos | coverScene |
| venueStoryPhoto | image | photos | venueStoryPreview |
| venuePhotoField | image | photos | venuePhoto |
| galleryPhotos | gallery | photos | polaroidGallery |
| programField | schedule | schedule | program |
| response | rsvp | rsvp | rsvpWidget |
| musicTrack | music | music | musicCard |

### Ресурсы

6 заменяемых фото в исходном состоянии: cover, story-left, story-center, story-right, venue-story, venue. Реконструировать самостоятельные чистые WebP, для cover желательно 1170×3174 либо соразмерный исходник в пределах политики загрузки; галерея минимум рекомендованных 800 px по длинной стороне, место 1200×700. Рекомендации предназначены для авторов деморесурсов, не ограничения пользователя: minWidth/minHeight=1, существующая автоматическая подготовка. Не выдавать crop с текстом/кнопкой/рамкой за чистую фотографию. Независимые SVG/растровые слои: иллюстрация виллы, ветви, конверт, печать, нижний пейзаж, разделители; печать без чужих фиксированных инициалов либо вычислять инициалы из имён безопасно. Обновить общий trusted asset registry и метаданные: MIME, реальная длина, ширина/высота. SVG канонический LF и безопасное содержимое, без скриптов, external references и произвольного пользовательского SVG. Не обходить existing verification. Использовать оптимизированные ассеты, фиксированные размеры медиа для CLS, lazy loading ниже fold, приоритет только hero. Никаких font/image hotlink без проверенного источника.

## 6. Контролы и адаптивность

Для RSVP border 1px cream, text cream, placeholder #E1D7C1, background transparent, radius 12px; selected radio cream fill и olive text; disabled opacity ~0.55 плюс семантика disabled; focus-visible 2px cream outline с отступом 2px и контрастной внешней границей на светлом фоне; error цвет #FFE0CD и текстовое объяснение, не только цвет. Submit cream #F9EBD6, dark text #34271C, pill radius, normal serif 18/24 600, icon 24px, active transform translateY(1px) с reduced-motion исключением. Card border #A99374, hover только enhancement; active/focus state эквивалентны touch/keyboard. Галерея, карта, calendar arrow и play не должны мешать scroll. Width 320–430: естественная вертикальная прокрутка, no horizontal overflow, reflow forms (не масштабировать страницу до нечитаемых input). Высоту root увеличивать при изменении контента; декор нижней части сдвигается вместе с содержимым, не покрывает форму. Учитывать safe area, экранную клавиатуру, 200% zoom, локализованные длинные строки. Motion только опциональное появление фотокарточек (160–320ms), disable при prefers-reduced-motion. Не делать scroll-jacking.

## 7. Этапы и критерии приёмки

1. Начать от актуального origin/main в отдельной ветке feat/italian-romance-template, не затрагивая параллельные работы. Прочитать DESIGN.md, UX-CONTRACT.md и текущие package/schema/runtime. Сначала написать тесты календарной логики и расширений схем.
2. Реализовать календарь, polaroid, карточку места, stepper и compact music как opt-in общие варианты. Проверить все исчерпывающие switch, export/import, preview, Studio, mobile editor и published renderer. Не создавать отдельный editor route.
3. Реализовать optional wish end-to-end с nullable migration и owner dashboard. Отдельно прогнать backward compatibility старых форм и сохранение прежних версий. Добавить OpenAPI описания изменений.
4. Создать чистые ресурсы, реальный JSON package; зарегистрировать trusted assets, протестировать metadata, SVG LF/CRLF, package import, RU/KY, персонализацию всех фото, immutable snapshot. Сценарий импорта `node scripts/import-eventiq-mobile.mjs <workspaceId> italian-romance` после проверки API. Не импортировать в рабочую базу автоматически.
5. Browser и Playwright: viewport 390×844 DPR1, полные screenshots четырёх артбордов и отдельно видимый viewport. Сравнить с 01–04-artboard.png. Зафиксировать снимки до/после существенных правок, список отклонений, отдельно подтвердить отсутствие курсива. Протестировать 320/360/375/412/430 px, RU/KY, длинные имена, календарь при смене месяца, все фото и галерею с 1/2/3/4 фото, клавиатуру, все состояния RSVP, музыку и карту. Рендеры со скриншотами хранить в docs/studio-v2/italian-romance-qa. Не утверждать pixel-perfect при отсутствии точных исходных фото.
6. Frontend/backend typecheck, build, существующие регрессионные тесты (особенно test:customer-photos, test:mobile-editor-v3, test:studio-v2-invitation и test:studio-v2-appearance — сверить имена в актуальном package.json), новый test:italian-romance, e2e на отдельной PostgreSQL. Проверить импорт/дубликат, сохранение, публикацию, реальные RSVP wish, защиту доступа, HEIC → WebP, подписанные URLs; если R2 mocked, явно указать. Не заявлять тесты, которые не запущены.
7. `docs/studio-v2/ITALIAN-ROMANCE.md` — архитектура, команды, миграция, visual diff, тесты и ограничения. Перед merge обновиться до origin/main, не потерять параллельные изменения, повторить проверки, no force push. Указать SHA и подтвердить файлы в origin/main. Реальная публикация шаблона в рабочем workspace — отдельная операция после deploy/migrate.

## 8. Готовый запрос Codex

Реализуй Italian Romance согласно `design/Italian-Romance-Codex-Spec.md`, `design/references/italian-romance/full-reference.png`, `geometry.json` и `template-blueprint.json`. Blueprint не импортируемый пакет: сначала расширь совместимые схемы и runtime, затем создай реальный пакет. Главный акцент — календарь вместо таймера, полароидный альбом вместо mosaic, карточка места, пожелание гостя с реальным сохранением, stepper и compact music. Следуй всем этапам и тестам; не меняй прежние шаблоны и не запускай миграции на рабочей базе. Не оставляй неработающего видео play. Верни SHA, скриншоты, отчёт и ограничения.
