# Italian Romance — VF-03

Владелец принял все четыре артборда 27 ноября 2026 года на [`c3683a35725536d0520d95d24804e17700f93741`](https://github.com/akkunov/invito/commit/c3683a35725536d0520d95d24804e17700f93741). Код [`33be652429623c6d9c599cf787d944e44e14db74`](https://github.com/akkunov/invito/commit/33be652429623c6d9c599cf787d944e44e14db74). [PR #83](https://github.com/akkunov/invito/pull/83) База сравнения — [`d30d8a3e7dc59be4468884cf5d40157dc8a5cdff`](https://github.com/akkunov/invito/commit/d30d8a3e7dc59be4468884cf5d40157dc8a5cdff). [Карточка VF-03](../architecture/tasks/VF-03-italian-romance.md)

## Локальная проверка в Windows PowerShell

Нужны Git и Node.js 22.18+ с npm. В PowerShell откройте корень репозитория, переключитесь на ветку VF-03 и установите зависимости. Команды `npm.cmd` работают и при политике PowerShell, запрещающей запуск `npm.ps1`.

```powershell
git fetch origin
git switch feat/eventiq-4-1-vf-03-italian-romance
npm.cmd ci
```

В первом окне PowerShell из корня проекта запустите API fixture. Он слушает только `127.0.0.1:4285`, читает пакет из файла и отвечает синтетическими данными.

```powershell
node .\scripts\fixtures\italian-romance.mjs
```

Во втором окне PowerShell из корня проекта задайте локальные адреса до сборки. Ключ — тестовая строка для мок-сессии Playwright.

```powershell
$env:NEXT_PUBLIC_API_URL = 'http://127.0.0.1:4285/api/v1'
$env:API_INTERNAL_URL = $env:NEXT_PUBLIC_API_URL
$env:NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:4285'
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'fixture-test-key'
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Eventiq build failed' }
npm.cmd run start -- --hostname 127.0.0.1 --port 4286
```

Откройте [приглашение RU](http://127.0.0.1:4286/ru/c/italian-romance), [приглашение KY](http://127.0.0.1:4286/ky/c/italian-romance) или [редактор](http://127.0.0.1:4286/ru/editor?template=italian-romance). При имени `Сбой` fixture возвращает ошибку RSVP. Суффиксы `-long`, `-leap`, `-gallery-1`, `-gallery-2`, `-gallery-4`, `-silent`, `-closed` и `-unavailable` показывают дополнительные состояния. Режим `--owner` выдаёт браузеру мок-сессию и обрабатывает загрузки в памяти.

Для автоматической проверки в третьем окне из корня проекта установите Chromium Playwright в отдельной временной папке.

```powershell
$BrowserDir = Join-Path $env:TEMP 'eventiq-vf-03-browser'
$Artifacts = Join-Path $env:TEMP 'eventiq-vf-03-artifacts'
npm.cmd install --prefix $BrowserDir playwright@1.56.1
& (Join-Path $BrowserDir 'node_modules\.bin\playwright.cmd') install --only-shell chromium
$env:STUDIO_BROWSER_PREFIX = $BrowserDir
node .\scripts\fixtures\capture-italian-romance.mjs $Artifacts --owner
```

## Визуальные доказательства

Reference, Before, After и RGB diff Reference / After идут слева направо. Для всех сравнений использованы Chromium, RU, viewport 390 × 1058 CSS px, DPR 1, календарь мая 2027 года и исходное состояние RSVP. В обоих рендерах выбран один тестовый аудиофайл. Before снят с пакетом из базового SHA. Секции Before, у которых содержимое превышало 1058 px, также сохранены целиком в PNG-архиве.

| Артборд | Исправлено | Оставшиеся различия | Сравнение |
| --- | --- | --- | --- |
| 01 · Обложка | Восстановлены непрерывная арка, нижняя часть открытки, кадр пары и двухстрочная композиция с терракотовым амперсандом. Имена, площадка и дата живые. | Гарнитура и прямое начертание амперсанда отличаются от каллиграфии на референсе. Переход к неподвижной арке при замене фото зависит от нового кадра. | [01 · Reference / Before / After / Diff](template-collection-qa/vf-03/01.webp) |
| 02 · Приглашение | Вернулись иллюстрация виллы, сетка календаря с выделенной датой, расписание с разделителями, отметками и пейзаж. | Шрифт вводного текста и подписи под календарём прямой по спецификации. Иконки программы отрисованы Lucide. | [02 · Reference / Before / After / Diff](template-collection-qa/vf-03/02.webp) |
| 03 · Галерея и площадка | Полароиды с независимыми фото, открываемый альбом, два разных кадра виллы и растущая по содержимому карточка карты. | Передний кадр площадки восстановлен в области нарисованной кнопки. Спецификация предусматривает кнопку только с реальным видео. Фотографии и тени рамок немного отличаются от оригинала. | [03 · Reference / Before / After / Diff](template-collection-qa/vf-03/03.webp) |
| 04 · RSVP | Оливковый фон, отдельно конверт и печать, кремовые контролы, шаговый счётчик, пожелание, компактный плеер и закрывающая композиция. | Печать очищена от фиксированных инициалов, `Grazie!` в прямом начертании. Демонстрационный трек синтетический. Фактура оливкового фона восстановлена отдельными декоративными ресурсами. | [04 · Reference / Before / After / Diff](template-collection-qa/vf-03/04.webp) |

[Приглашение целиком RU](template-collection-qa/vf-03/full.webp) · [Приглашение целиком KY](template-collection-qa/vf-03/ky-full.webp) · [Состояния RSVP](template-collection-qa/vf-03/rsvp-states.webp) · [Календарь после смены месяца](template-collection-qa/vf-03/calendar-next.webp) · [Замена галереи](template-collection-qa/vf-03/editor-gallery-replaced.webp) · [Воспроизведение музыки](template-collection-qa/vf-03/music-playing.webp)

## Совместимость и выпуск

Опциональное оформление `postcard` использует текущие виджеты Studio v2. Полароиды работают с существующей галереей 1–4 фото. Календарь и обложка используют одну дату. Карточка берёт имя и адрес из общих переменных и открывает карту. Для музыки используется общий плеер и подтверждённый источник, пустая гостевая карточка скрывается. Синтетический аудиофайл доступен только в fixture. Новый набор WebP расположен под `/images/collection/italian-romance/vf-03/`. Чистые мастер-файлы фотографий в архиве отсутствовали. Демо-кадры подготовлены из вырезок и отдельных областей эталона, а текст, календарь, форма, карта и управление музыкой остаются интерактивными.

Slug, идентификаторы разрешённых полей и старые публичные URL сохранены. Пакет использует прежний формат v1. Новая опубликованная версия и операции с рабочей базой относятся к отдельному выпуску через TPL-02/04. [Исходная спецификация](../../tamplates_codex/eventiq-10-templates-codex/design/Italian-Romance-Codex-Spec.md) · [TPL-02](../architecture/tasks/TPL-02-append-template-version.md) · [TPL-04](../architecture/tasks/TPL-04-template-version-rollout.md)


## Измерения и проверки

Доля пикселей с максимальным отклонением RGB более 24 из 255. Используйте метрику вместе с визуальным сравнением исходных элементов.

| Артборд | Before | After |
| --- | ---: | ---: |
| 01 · Обложка | 42,3% | 5,3% |
| 02 · Приглашение и программа | 13,0% | 11,9% |
| 03 · Галерея и площадка | 50,0% | 16,5% |
| 04 · RSVP | 82,5% | 15,8% |

- В Chromium при 390 × 1058 DPR 1 сняты все четыре артборда. Playwright проверил RU/KY на 320×568, 360×800, 375×812, 390×844, 412×915 и 430×932. Повтор на Chromium 141 из инструкции также прошёл. Проверены отсутствие горизонтального скролла, длинные имена, положение цитаты относительно полароидов и интерактивные цели формы и календаря от 44 px.
- Проверены перелистывание календаря с клавиатуры, возврат к месяцу свадьбы, 29 февраля 2028 года, альбом с 1–4 фото, переключение кадров и Escape, адрес карты и Play/Pause. Проверены пустое имя и фокус, ожидание, ошибка с сохранением пожелания, отказ с нулём гостей, успешная отправка, закрытие и недоступность RSVP.
- В UniversalMobileEditor изменены имя, площадка, приглашение, цитата, адрес и вступление к форме. Изменение даты в календаре обновляет связанную дату, изменены время программы, лимит и срок RSVP, заменены все шесть фото. Подтверждено восстановление черновика после перезагрузки. API и объектное хранилище в этом сценарии эмулируются.
- Frontend/backend typecheck и production build, 13 локальных наборов регрессий, 19 backend unit-тестов и браузерная проверка прежнего редактора прошли. `test:template-assets` 20/20, `test:template-collection` 16/16, `test:mobile-editor-v3` 16/16. [GitHub Actions PR #83](https://github.com/akkunov/invito/pull/83/checks)
- Полный lint показал прежние 52 ошибки и 52 предупреждения. Vercel Preview остаётся заблокированным. Команды запуска проверены на Linux в эквивалентном окружении Node/Chromium. Запуск на Windows и физических мобильных устройствах остаётся частью ручной проверки. [Q-04](../architecture/tasks/Q-04-vercel-preview-blocked.md)
