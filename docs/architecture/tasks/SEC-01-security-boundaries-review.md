# SEC-01 — Границы безопасности API, R2 и интеграций

Приоритет `P0`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Подтвердить tenant isolation, защёлки на загрузках, privacy и установленные ограничения webhook/музыки.

## Текущее состояние

Есть owner/workspace проверки, R2 staging→verified и Zod. Новые поверхности 4.1 расширят сетевые границы.

## Зависимости

[000](000-eventiq-4-1-foundation.md)

## Scope

Дефензивный аудит и изолированные проверки известных границ; отдельные корректировки по подтверждённым случаям.

## Non-goals

Тестирование на production, полное перепроектирование auth/медиа и раскрытие credentials.

## Архитектурные требования

Проверить access scopes, SSR cache, URL normalization, redaction, quotas, upload and content length. Соотнести с OpenAPI и областями релизов.

## План реализации

Зафиксировать матрицу trust boundaries; проверить negative fixtures and stale access; разложить реальные баги по приоритету и узким PR.

## Acceptance Criteria

Результаты воспроизводимы вне production, отсутствует смешивание tenant, критические случаи имеют доказательства закрытия.

## Обязательные тесты

Disposable PostgreSQL authorization, typed input/asset tests, R2 signing fixture, redaction and provider availability.

## Миграции

Нет по умолчанию; у каждой защиты своя аддитивная стратегия, если требуется.

## Rollback Plan

Вернуть scoped изменение только с сохранением прежних ролей и ограничений; изолировать новый вход при отказе.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
