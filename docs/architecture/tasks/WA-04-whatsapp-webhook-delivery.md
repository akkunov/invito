# WA-04 — Webhook и сверка статуса доставки Meta

Приоритет `P1`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Получать проверенное подтверждение доставки и безопасно уточнять статус.

## Текущее состояние

Webhook и provider message persistence отсутствуют.

## Зависимости

[WA-03](WA-03-whatsapp-worker-and-provider.md)

## Scope

Verify challenge, подписанное raw body, дедупликация событий, up-to-date status и операционный просмотр.

## Non-goals

Использование HTTP 200 провайдера как доставленного сообщения и запись PII в логи.

## Архитектурные требования

Проверять X-Hub-Signature-256 constant time на исходном теле, сверять provider message ID и owner boundary; out-of-order не понижает итоговое состояние.

## План реализации

Реализовать verify/ingest; обработать повтор/старое событие и неизвестный ID; дописать OpenAPI, настройку и метрики.

## Acceptance Criteria

Неподписанный запрос не меняет состояние; accepted/delivered различаются; retries не множат записи.

## Обязательные тесты

Подписанные/неподписанные fixture, replay и out-of-order, PostgreSQL и log redaction.

## Миграции

Предполагается additive доставка/метаданные событий.

## Rollback Plan

Отключить callback/delivery flow и сохранить журнал состояния.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
