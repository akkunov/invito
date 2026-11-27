# Vogue Wedding — VF-02

Кандидат на ручную приёмку. Код [`458eb6f9244fd7689a052422e8c4bee56fd1f350`](https://github.com/akkunov/invito/commit/458eb6f9244fd7689a052422e8c4bee56fd1f350). [PR #82](https://github.com/akkunov/invito/pull/82) База сравнения — merge-коммит [`f040ba24c1849728f772965fc8102a77048a1480`](https://github.com/akkunov/invito/commit/f040ba24c1849728f772965fc8102a77048a1480). [Карточка VF-02](../architecture/tasks/VF-02-vogue-wedding.md)

## Локальная проверка без базы

Выполните `npm ci` в корне репозитория. В первом терминале запустите fixture.

```bash
node scripts/fixtures/vogue-wedding.mjs
```

Во втором терминале соберите и запустите приложение с локальным API и тестовыми параметрами сессии.

```bash
export NEXT_PUBLIC_API_URL=http://127.0.0.1:4283/api/v1
export API_INTERNAL_URL="$NEXT_PUBLIC_API_URL"
export NEXT_PUBLIC_SUPABASE_URL=http://localhost:4283
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=fixture-test-key
npm run build
npm run start -- --hostname 127.0.0.1 --port 4282
```

Откройте [приглашение RU](http://127.0.0.1:4282/ru/c/vogue-wedding), [приглашение KY](http://127.0.0.1:4282/ky/c/vogue-wedding) или [редактор](http://127.0.0.1:4282/ru/editor?template=vogue-wedding). При имени `Сбой` fixture возвращает ошибку RSVP. Суффиксы `-long`, `-closed` и `-unavailable` показывают длинные имена, закрытый приём и временную недоступность. Сценарий `--owner` выдаёт тестовую сессию и обрабатывает загрузку в памяти через Playwright.

```bash
npm install --prefix /tmp/eventiq-vf-02-browser playwright@1.56.1
/tmp/eventiq-vf-02-browser/node_modules/.bin/playwright install --only-shell chromium
STUDIO_BROWSER_PREFIX=/tmp/eventiq-vf-02-browser \
  node scripts/fixtures/capture-vogue-wedding.mjs /tmp/eventiq-vf-02 --owner
```

Можно указать системный Chromium через `CHROMIUM_PATH`. Чтобы повторить Before, сохраните `git show f040ba2:templates/packages/vogue-wedding.v1.json > /tmp/vogue-before.json`, передайте этот путь первым аргументом fixture и используйте `--capture-only`. Для воспроизведения исторического кода запускайте приложение на `f040ba2`.

## Визуальные доказательства

В каждой полосе слева направо Reference, Before, After и RGB diff Reference / After. Chromium, 390 × 1048 CSS px, DPR 1, RU, фиксированные часы (`185:10:24:36` до события), гостевая форма в исходном состоянии. Оригиналы взяты из четырёх исходных PNG, снимки — с гостевого маршрута через `StudioV2ProjectRenderer`.

| Артборд | Исправлено | Осталось для проверки владельцем | Сравнение |
| --- | --- | --- | --- |
| 01 · Обложка | Узкая двухстрочная композиция имён, кадр пары с обеими открытыми лицами, светлая ткань под живой датой, круглая стрелка с переходом. | Noto Serif Display отличается рисунком отдельных букв от растра. При замене снимка форма светлой подложки сохраняется, её граница на фото зависит от кадра. | [01 · Reference / Before / After / Diff](template-collection-qa/vf-02/01.webp) |
| 02 · Приглашение и программа | Четыре строки приглашения, вертикали таймера, крупное время, тексты программы, красные акценты и горный край в исходных координатах. | Разница в засечках и оптических интервалах. Точное число строк зависит от локали и текста заказчика. | [02 · Reference / Before / After / Diff](template-collection-qa/vf-02/02.webp) |
| 03 · Галерея и площадка | Прямоугольная мозаика 1–2–1, исходные кадры и зазоры, живые номера 01–04, фото ресторана, пин, редактируемый адрес и карта. | Небольшие отличия в гарнитуре и контуре иконки карты. Адрес — демонстрационный из референса. | [03 · Reference / Before / After / Diff](template-collection-qa/vf-02/03.webp) |
| 04 · RSVP | Чёрное поле, крупный serif-заголовок, белые рамки и CTA, радиокнопки, локализованный список гостей, горный низ и рабочие состояния. | Мелкие отличия в начертании текста и скруглениях. Ошибки и подтверждение увеличивают высоту по содержимому. | [04 · Reference / Before / After / Diff](template-collection-qa/vf-02/04.webp) |

[Приглашение целиком RU](template-collection-qa/vf-02/full.webp) · [Приглашение целиком KY](template-collection-qa/vf-02/ky-full.webp) · [Кадры RSVP](template-collection-qa/vf-02/rsvp-states.webp) · [Замена галереи в редакторе](template-collection-qa/vf-02/editor-gallery-replaced.webp)

## Совместимость

Шесть фото заменяются через существующую персонализацию. Опциональная обработка `monochrome` применяется при рендеринге, исходный файл сохраняет цвет. Опциональное оформление `contact-sheet` использует общий таймер, программу, галерею, карту и RSVP. Нумерация фотокадров отрисовывается отдельно. Ткань, пин и горы — отдельные заблокированные слои. Исходные чистые мастер-файлы отсутствовали в handoff. Для демо использованы очищенные фрагменты отдельных русских артбордов, без масштабирования выше нативного размера.

Slug, локали, идентификаторы полей персонализации и ранее опубликованные URL сохранены. Новые изображения имеют отдельный префикс `/images/collection/vogue-wedding/vf-02/`. Изменения базы относятся к согласованному выпуску существующего шаблона через TPL-02/04. [Исходный дизайн](../../tamplates_codex/eventiq-10-templates-codex/design/references/vogue-wedding) · [TPL-02](../architecture/tasks/TPL-02-append-template-version.md) · [TPL-04](../architecture/tasks/TPL-04-template-version-rollout.md)


## Измерения и проверки

Доля пикселей с максимальным отклонением RGB более 24 из 255. Таблица помогает найти отличия при ручной сверке.

| Артборд | Before | After |
| --- | ---: | ---: |
| 01 · Обложка | 39,8% | 7,4% |
| 02 · Приглашение и программа | 12,9% | 9,6% |
| 03 · Галерея и площадка | 23,1% | 5,3% |
| 04 · RSVP | 19,2% | 11,3% |

- Playwright Chromium 156 проверил RU/KY на 320×568, 360×800, 375×812, 390×844, 412×915 и 430×932. Проверены длинные имена, отсутствие горизонтального скролла, размер интерактивных целей, таймер, навигация между секциями, галерея с клавиатуры и адрес карты.
- Гостевой сценарий проверил пустое имя и фокус, отправку, ошибку с сохранением данных, отказ с нулём гостей, успешную отправку, закрытие приёма и недоступность формы.
- Через UniversalMobileEditor проверены замена обложки, площадки и всех четырёх фото галереи, редактирование имён RU/KY, приглашения, площадки, адреса и вступления к RSVP, изменение даты и времени свадьбы, времени программы, лимита и срока RSVP, восстановление локального черновика после перезагрузки. API и объектное хранилище эмулировались для теста. Проверка нового дизайна и контракта в production относится к выпуску версии.
- Прошли frontend/backend typecheck и production build, 13 frontend и контрактных наборов и 19 backend unit-тестов. В том числе `test:template-assets` (20/20), `test:template-collection` (15/15), `test:mobile-editor-v3` (16/16).
- Браузерная регрессия прежнего редактора `test:customer-editor-browser` прошла на Chromium из CI. GitHub Actions подтвердил сборку, статический экспорт Studio, frontend-контракты и миграции с E2E на отдельной PostgreSQL. [Проверки PR #82](https://github.com/akkunov/invito/pull/82/checks)
- Полный lint завершился исходными 52 ошибками и 52 предупреждениями. Физические мобильные устройства не проверялись. Блокировка Vercel отслеживается отдельно. [Q-04](../architecture/tasks/Q-04-vercel-preview-blocked.md)
