# MUS-01 — Доменный контракт источников музыки

Приоритет `P1`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Подготовить единый MusicProvider и ссылку на трек со старой совместимостью.

## Текущее состояние

GET /catalog/music читает локальную конфигурацию, старые источники и проигрыватели в нескольких местах.

## Зависимости

[000](000-eventiq-4-1-foundation.md)

## Scope

Provider interface, normalized metadata/capabilities, старый adapter, stable ID и DTO API.

## Non-goals

Включение внешних источников, экраны поиска и смена старых релизов.

## Архитектурные требования

Общий строгий Zod, storage ссылки без аудиобайтов, несовместимые состояния явно typed; старые пакеты читаются прежним способом.

## План реализации

Инвентаризировать contract; описать local/provider discriminated source; добавить reader/adapter; сделать fixtures старых релизов.

## Acceptance Criteria

Старый локальный и static source сохраняют поведение; неизвестный формат отказоустойчив; external track идентифицируется стабильно.

## Обязательные тесты

Contract tests, fixtures old/new invitation snapshots, typecheck both apps.

## Миграции

Аддитивные JSON-поля; БД без миграции по умолчанию.

## Rollback Plan

Скрыть новые options, оставить legacy reader и исходные snapshots.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
