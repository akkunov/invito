# WA-02 — Transactional outbox для принятого RSVP

Приоритет `P1`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Атомарно записывать максимум одно событие на принятый RSVP и версию контакта.

## Текущее состояние

Сейчас транзакция создаёт только ответ; активный guest path защищён существующим requestId.

## Зависимости

[RSVP-01](RSVP-01-rsvp-guest-regressions.md), [WA-01](WA-01-whatsapp-verified-contact.md)

## Scope

Схема outbox, запись в транзакции RSVP, аудит и сухие fixture.

## Non-goals

HTTP к Meta из гостевого запроса, повторная отправка исторических ответов.

## Архитектурные требования

Уникальность по response/channel/contact version, проверка контакта/opt-in, bounded data и явные состояния.

## План реализации

Добавить additive migration; в существующем сервисе enqueue после валидации и в одной транзакции; проверить rollback и retry.

## Acceptance Criteria

При ошибке атомарность соблюдена; повторы requestId не создают дополнительный job; без opt-in события нет.

## Обязательные тесты

Disposable PostgreSQL migration/E2E, concurrent retry/unpublish, opt-in, duplicate and rollback.

## Миграции

Да, additive outbox и idempotency/indexes.

## Rollback Plan

Выключить enqueue; оставить уже принятые RSVP и историю outbox.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
