# WA-05 — Приёмка на тестовом WABA

Приоритет `P1`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Подтвердить доставку на разрешённый тестовый номер.

## Текущее состояние

Рабочих WABA credentials и approved template в контексте TASK 000 нет.

## Зависимости

[WA-01](WA-01-whatsapp-verified-contact.md), [WA-02](WA-02-rsvp-whatsapp-outbox.md), [WA-03](WA-03-whatsapp-worker-and-provider.md), [WA-04](WA-04-whatsapp-webhook-delivery.md)

## Scope

Тестовая бизнес-учётка, разрешённый номер, шаблоны/локали, воспроизводимый журнал без PII.

## Non-goals

Production sends и перенос пользовательских телефонов.

## Архитектурные требования

Хранить доступы server-only, проверить актуальную Graph API version, opt-in, согласованный utility template и sandbox limits.

## План реализации

Подготовить подтверждённый набор условий; выполнить yes/no/opt-out, delay и проверенный callback; записать accepted и delivered по отдельности.

## Acceptance Criteria

Есть реальные тестовые статусы, sender и timestamp задокументированы безопасно; граница каждого трафика ясна.

## Обязательные тесты

Live test WABA + повтор mock suite, ручной просмотр UI настройки и статусов.

## Миграции

Только проверенные предыдущие миграции на тестовой БД.

## Rollback Plan

Отключить тестовый worker/callback, отозвать временные credentials.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
