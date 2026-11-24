# WA-03 — Worker и адаптер WhatsApp Cloud API

Приоритет `P1`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Доставлять уведомления владельцу независимо от latency гостевого API.

## Текущее состояние

Worker и Meta provider отсутствуют; outbox определяет WA-02.

## Зависимости

[WA-02](WA-02-rsvp-whatsapp-outbox.md)

## Scope

Атомарный claim/lease, bounded concurrency, Retry-After/backoff, redacted telemetry и тестовый Meta adapter.

## Non-goals

Реальная доставка в рабочую среду, webhook reconciliation и guest marketing.

## Архитектурные требования

Ещё раз проверять активный контакт, согласие и владельца перед send. Брать approved utility template; шаблон включает имя гостя, ответ, количество и разрешённый URL. Хранить secrets на backend.

## План реализации

Ввести transport и worker; различать accepted, failed, unknown, skipped и temporary error; тестировать crash/reclaim, лимиты и dead-letter.

## Acceptance Criteria

Сбой/дубль не добавляет RSVPs и не даёт ложный delivered; retry ограничен; opt-out предотвращает отправку.

## Обязательные тесты

Fixture HTTP, timeouts 429/5xx, retry jitter, duplicate/lease recovery and safe logs.

## Миграции

Только additive indexing/delivery metadata при необходимости.

## Rollback Plan

Выключить worker и не трогать принятые RSVP и результаты доставки.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
