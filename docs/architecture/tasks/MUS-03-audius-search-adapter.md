# MUS-03 — Серверный поиск и разрешение треков Audius

Приоритет `P1`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Дать структурированный серверный поиск и безопасное разрешение воспроизведения.

## Текущее состояние

Внешнего провайдера или endpoints /music/* в main нет.

## Зависимости

[MUS-01](MUS-01-music-provider-contract.md)

## Scope

Audius adapter за флагом, limit/offset или cursor, timeout/cache/rate limit, лицензия и проверенный URL. Использовать branch feat/external-music-library для этого шага.

## Non-goals

Первая выкладка Audius без MUS-02, proxy arbitrary URLs, загрузка внешнего аудио в R2 и реализация Jamendo/Openverse.

## Архитектурные требования

Не запрашивать host из клиентского URL; нормализовать метаданные/capabilities; отключённый провайдер имеет предсказуемое состояние; включение только после подтверждения прав.

## План реализации

Проверить актуальный официальный API; реализовать нормализацию и server-only секреты; открыть typed /search, /providers, /tracks и /playback; использовать mock responses.

## Acceptance Criteria

Кеш ограничен, 429/timeout/withdrawn обработаны, legacy /catalog/music совместим; аудиобайты не сохраняются и права проверяются.

## Обязательные тесты

Fixture provider network, pagination/cache/rate limit, Zod boundary and OpenAPI, no unauthorized playback URL.

## Миграции

Нет по умолчанию; moderation metadata — отдельная additive схема при доказанной необходимости.

## Rollback Plan

Отключить feature flag и сохранить локальный каталог.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
