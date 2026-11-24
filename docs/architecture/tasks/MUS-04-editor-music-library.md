# MUS-04 — Библиотека и выбор трека в редакторе

Приоритет `P1`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Дать пользователю управляемый поиск, прослушивание и выбор.

## Текущее состояние

MusicLibraryPicker фильтрует локальный список на клиенте, external search отсутствует.

## Зависимости

[MUS-03](MUS-03-audius-search-adapter.md), [MUS-05](MUS-05-shared-music-player.md)

## Scope

Debounce 400 мс, abort, страницы/фильтры по capabilities, избранное, loading/empty/error и атрибуция.

## Non-goals

Новый редактор по шаблону и автозапуск звука; продовый Audius без MUS-02.

## Архитектурные требования

Переиспользовать общий editor shell и player, сохранять approved source, отменять stale search/preview при смене выбора или закрытии.

## План реализации

Типизировать UI DTO; добавить controlled query state и favorites; связать player selection; проверять offline/унаследованный источник.

## Acceptance Criteria

Смена запроса на слабой сети не показывает устаревший результат, игра прекращается при закрытии, права и credit видны.

## Обязательные тесты

Fake timers + Playwright search/abort/favorites/loading, RU/KY keyboard, local fallback.

## Миграции

Локальный format избранного при необходимости, backfill БД не требуется по умолчанию.

## Rollback Plan

Вернуть старый picker и остановить новый preview, выбранная ссылка сохранится.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
