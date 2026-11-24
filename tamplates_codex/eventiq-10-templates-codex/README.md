# Eventiq — последние 10 шаблонов, комплект для Codex

Распаковать в корень invito (или отдельный каталог и скопировать design/). Это дизайн-handoff, а не готовые импортируемые пакеты и не результат тестирования приложения. Три ранее подготовленных ТЗ сохранены без изменения; семь новых добавлены. Art Gallery — новый вручную собранный референс, потому что предыдущая генерация вместо него показала Cinema Wedding. Minimal Architecture — первый новый бетонно-кобальтовый макет с планом; последующие обзорные коллажи не использовать. Оба ещё требуют утверждения.

Сначала прочитать `design/COMMON-IMPLEMENTATION.md`. Он уточняет ширину для всех десяти (430 px, fluid 100% на телефоне, без масштабирования живых элементов). Источник пропорций — отдельные PNG, геометрия оценочная для растровых макетов; у Art Gallery координаты заданы при построении.

| № | Шаблон | ТЗ | Референс |
|---|---|---|---|
| 1 | Vogue Wedding | [design/Vogue-Wedding-Codex-Spec.md](design/Vogue-Wedding-Codex-Spec.md) | [PNG](design/references/vogue-wedding/full-reference.png) |
| 2 | Italian Romance | [design/Italian-Romance-Codex-Spec.md](design/Italian-Romance-Codex-Spec.md) | [PNG](design/references/italian-romance/full-reference.png) |
| 3 | Love Story | [design/Love-Story-Codex-Spec.md](design/Love-Story-Codex-Spec.md) | [PNG](design/references/love-story/full-reference.png) |
| 4 | Cinema Wedding | [design/Cinema-Wedding-Codex-Spec.md](design/Cinema-Wedding-Codex-Spec.md) | [PNG](design/references/cinema-wedding/full-reference.png) |
| 5 | Secret Garden | [design/Secret-Garden-Codex-Spec.md](design/Secret-Garden-Codex-Spec.md) | [PNG](design/references/secret-garden/full-reference.png) |
| 6 | Boarding Pass | [design/Boarding-Pass-Codex-Spec.md](design/Boarding-Pass-Codex-Spec.md) | [PNG](design/references/boarding-pass/full-reference.png) |
| 7 | Wedding Newspaper | [design/Wedding-Newspaper-Codex-Spec.md](design/Wedding-Newspaper-Codex-Spec.md) | [PNG](design/references/wedding-newspaper/full-reference.png) |
| 8 | Digital Envelope | [design/Digital-Envelope-Codex-Spec.md](design/Digital-Envelope-Codex-Spec.md) | [PNG](design/references/digital-envelope/full-reference.png) |
| 9 | Art Gallery | [design/Art-Gallery-Codex-Spec.md](design/Art-Gallery-Codex-Spec.md) | [PNG](design/references/art-gallery/full-reference.png) |
| 10 | Minimal Architecture | [design/Minimal-Architecture-Codex-Spec.md](design/Minimal-Architecture-Codex-Spec.md) | [PNG](design/references/minimal-architecture/full-reference.png) |

## Общая задача для Codex

Реализуй десять новых шаблонов Eventiq по templates-index.json и каждому индивидуальному Markdown. Сначала сравни slug и текущие файлы main: уже существующие и опубликованные версии не перезаписывать, при необходимости подготовить новую immutable версию отдельно. Проверь общий движок, определи совместно используемые Calendar, Story, RSVP wish/stepper, Music compact, ICS, Gallery, Reveal, Video, DressCode и Schedule floorPlan. Вначале реализуй и протестируй недостающие общие блоки в одной согласованной ветке, затем подключай пакеты последовательно или в независимых ветках без конфликтов. Не дублируй миграции и общий editor. Обязательны реальные скриншоты Browser/Playwright, тесты на 320–430 px, RU/KY, реальные upload/RSVP/publish в тестовой среде, отчёт по каждому шаблону. Только после проверок merge в main без force push. Никаких изменений рабочей БД; импорт и публикация в пользовательскую Supabase отдельным шагом.

## Порядок

1. Аудит main и единый контракт новых виджетов; переиспользовать уже созданное.
2. Vogue, Italian Romance, Love Story (если не готово), затем Cinema, Secret Garden, Boarding Pass, Newspaper, Envelope.
3. Утвердить новые Art Gallery и Minimal Architecture, после чего реализовать.
4. Общие регрессии и проверка каждой версии каталога.

Фото-вырезки — визуальные референсы, не все чистые production assets. Видео не предоставлены; для Cinema необходим реальный лицензированный ролик либо корректный статический fallback. HTML-прототип Love Story сохранён, не выдавать его за проверенную интеграцию.
