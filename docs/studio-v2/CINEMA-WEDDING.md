# Cinema Wedding — VF-04

Кандидат на ручную приёмку. Код [`5af2e8a1327e08fae8f0e195eb7beff461c6b7fa`](https://github.com/akkunov/invito/commit/5af2e8a1327e08fae8f0e195eb7beff461c6b7fa). [PR #84](https://github.com/akkunov/invito/pull/84) База сравнения — [`47ea61de646c399cc4cc97c9d3937b3f556c4361`](https://github.com/akkunov/invito/commit/47ea61de646c399cc4cc97c9d3937b3f556c4361). [Карточка VF-04](../architecture/tasks/VF-04-cinema-wedding.md)

## Локальная проверка в Windows PowerShell

Понадобятся Git и Node.js 22.18+ с npm. Команды выполняются из корня репозитория. `npm.cmd` подходит для PowerShell с ограничением запуска скриптов `.ps1`.

```powershell
git fetch origin
git switch feat/eventiq-4-1-vf-04-cinema-wedding
npm.cmd ci
```

В первом окне запустите fixture. Он слушает только `127.0.0.1:4287`, читает локальный пакет и обслуживает синтетические данные.

```powershell
node .\scripts\fixtures\cinema-wedding.mjs
```

Во втором окне задайте адреса до сборки. Ключ в примере предназначен для эмуляции сессии в Playwright.

```powershell
$env:NEXT_PUBLIC_API_URL = 'http://127.0.0.1:4287/api/v1'
$env:API_INTERNAL_URL = $env:NEXT_PUBLIC_API_URL
$env:NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:4287'
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'fixture-test-key'
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Eventiq build failed' }
npm.cmd run start -- --hostname 127.0.0.1 --port 4288
```

Откройте [приглашение RU](http://127.0.0.1:4288/ru/c/cinema-wedding), [приглашение KY](http://127.0.0.1:4288/ky/c/cinema-wedding) или [редактор](http://127.0.0.1:4288/ru/editor?template=cinema-wedding). Для ошибки RSVP введите имя `Сбой`. Суффиксы `-long`, `-silent`, `-closed` и `-unavailable` меняют тестовое состояние публичной страницы.

В третьем окне выполните проверку пакета и браузерный сценарий. `--owner` открывает редактор с тестовой сессией и имитацией загрузки в объектное хранилище.

```powershell
npm.cmd run test:cinema-wedding
$BrowserDir = Join-Path $env:TEMP 'eventiq-vf-04-browser'
$Artifacts = Join-Path $env:TEMP 'eventiq-vf-04-artifacts'
npm.cmd install --prefix $BrowserDir playwright@1.56.1
& (Join-Path $BrowserDir 'node_modules\.bin\playwright.cmd') install --only-shell chromium
$env:STUDIO_BROWSER_PREFIX = $BrowserDir
node .\scripts\fixtures\capture-cinema-wedding.mjs $Artifacts --owner
```

## Визуальные сравнения

Полосы показывают Reference, Before, After и RGB diff Reference / After. Использована локаль RU, DPR 1, исходное состояние формы, один тестовый трек и режим `prefers-reduced-motion: reduce`. Viewport исходного размера задан отдельно для каждого артборда. Если секция превышала референс, полный снимок также доступен в PNG-архиве.

| Артборд | Viewport CSS px | Что исправлено | Оставшиеся различия | Сравнение |
| --- | --- | --- | --- | --- |
| 01 · Обложка | 430 × 1741 | Восстановлены широкий кадр пары, тёплый переход к титрам, дата, лавры и нижняя панорама. | Отдельные контуры шрифта и обработанный участок платья отличаются. Постер показывает статичный кадр. | [01 · Reference / Before / After / Diff](template-collection-qa/vf-04/01.webp) |
| 02 · История | 430 × 1782 | Три заменяемых снимка в плёночных рамках, независимый постер, типографика дат и глав, катушка. | Постер использует чистую панораму из того же комплекта. У текста остаются отличия гарнитуры и переносов. | [02 · Reference / Before / After / Diff](template-collection-qa/vf-04/02.webp) |
| 03 · Дата, программа и место | 430 × 1770 | День, месяц и год связаны с датой приглашения. Восстановлены светлая панорама, календарь, программа, адрес и карта. | Иконки программы выполнены Lucide, состояние календаря использует существующий экспорт ICS. | [03 · Reference / Before / After / Diff](template-collection-qa/vf-04/03.webp) |
| 04 · Ответ гостя | 430 × 1782 | Восстановлены хлопушка, кремовые контурные поля, полноширинный счётчик, пожелание, красная CTA, плеер и финальный свет. | На хлопушке очищены фиксированные инициалы, фактура в этой области восстановлена. Финальная надпись набрана прямой гарнитурой. Трек в fixture синтетический. | [04 · Reference / Before / After / Diff](template-collection-qa/vf-04/04.webp) |

[Приглашение целиком RU](template-collection-qa/vf-04/full.webp) · [Приглашение целиком KY](template-collection-qa/vf-04/ky-full.webp) · [Состояния RSVP](template-collection-qa/vf-04/rsvp-states.webp) · [Замена кадра](template-collection-qa/vf-04/editor-replaced-episode.webp) · [Воспроизведение музыки](template-collection-qa/vf-04/music-playing.webp)

## Совместимость и выпуск

Опциональный стиль `film` оформляет существующие виджеты. Дата в обложке, компоненты даты и ICS используют единый `ceremonyDate`. Сохранились семь заменяемых фото, ID полей редактора, отдельные рамки и ссылка на предыдущие опубликованные изображения. Подтверждённого видео в handoff не найдено. Кадры работают как фотографии без длительности и фиктивных контролов. Для плеера источник выбирается через существующий музыкальный контракт.

WebP расположены под `/images/collection/cinema-wedding/vf-04/`. Исходные мастер-файлы фотографий отсутствовали. Демо-ресурсы восстановлены из отдельных вырезок, текст и контролы отрисовываются в реальном приложении. Выкладка версии в рабочую базу относится к TPL-02/04. [Спецификация](../../tamplates_codex/eventiq-10-templates-codex/design/Cinema-Wedding-Codex-Spec.md) · [TPL-02](../architecture/tasks/TPL-02-append-template-version.md) · [TPL-04](../architecture/tasks/TPL-04-template-version-rollout.md)


## Измерения и проверки

Доля пикселей с максимальным отклонением RGB более 24 из 255. Используйте метрику вместе с визуальной проверкой элементов.

| Артборд | Before | After |
| --- | ---: | ---: |
| 01 · Обложка | 76,2% | 5,7% |
| 02 · История | 40,5% | 19,9% |
| 03 · Дата, программа и место | 15,5% | 14,1% |
| 04 · Ответ гостя | 20,9% | 13,3% |

- Chromium 141 и 156. Четыре артборда при исходных viewport и 12 комбинаций RU/KY и мобильных размеров 320–430 px. Проверены длинные имена и главы, отсутствие горизонтальной прокрутки, минимальный размер контролов 44 px, режим reduced motion, клавиатура, экспорт ICS, карта и статичные постеры.
- Ответ гостя проверен с пустым именем, фокусом, отправкой, ошибкой с сохранением текста, отказом с нулём гостей, подтверждением, дедлайном и недоступностью формы. Проверены контраст красной кнопки, пауза и воспроизведение, отсутствие карточки при пустом треке и сохранение работы приглашения при 404 постера.
- UniversalMobileEditor на локальном API с эмуляцией объектного хранилища. Проверены семь замен фотографий, сохранение рамок, правки главы и текста, связь даты с календарём, время программы, лимит и срок RSVP, восстановление черновика после перезагрузки.
- Frontend/backend typecheck, production build, 14 локальных наборов и 19 backend unit-тестов прошли. Проверка старого редактора в Chromium прошла. `test:cinema-wedding` 2/2, `test:template-assets` 20/20, `test:template-collection` 17/17, `test:mobile-editor-v3` 16/16. [GitHub Actions PR #84](https://github.com/akkunov/invito/pull/84/checks)
- Полный lint сохраняет базовые 52 ошибки и 52 предупреждения. Vercel Preview остаётся заблокированным. Инструкция PowerShell соответствует прогону в Node/Chromium на Linux. Запуск на Windows и физических мобильных устройствах остаётся частью ручной проверки. [Q-04](../architecture/tasks/Q-04-vercel-preview-blocked.md)
