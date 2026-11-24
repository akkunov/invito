# ED-03 — Порядок autosave, CAS и TTL для медиа

Приоритет `P1`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Избежать stale save, периодического лишнего трафика и неявной потери правок.

## Текущее состояние

Работают save/CAS и обновление signed URL, есть периодические refresh и несвязанные состояния.

## Зависимости

[ED-01](ED-01-draft-pinned-version.md), [ED-02](ED-02-scoped-draft-storage.md), [AUTH-02](AUTH-02-session-boundaries.md)

## Scope

Один state machine для debounced local/cloud autosave, abort generation, retry, конфликтов и обновления по TTL.

## Non-goals

Переписывание редактора, force overwrite, сокращение защиты медиа.

## Архитектурные требования

Сохранять expectedRevision, отменять/игнорировать старые операции, flush перед публикацией; временный отказ не стирает исходные данные.

## План реализации

Снять baseline; добавить последовательность запросов; разделить статусы local/cloud; TTL refresh только нужных ключей; проверить конфликты.

## Acceptance Criteria

Поздний ответ старой сессии не перезаписывает текущую, offline восстанавливается, publish видит актуальную ревизию.

## Обязательные тесты

Fake clock, race/retry tests, PostgreSQL CAS, Playwright offline/reconnect/expired URL and session switch.

## Миграции

Нет; локальные ключи из ED-02.

## Rollback Plan

Отключить autosave V2 и TTL scheduler, оставить ручное сохранение и прежние данные.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
