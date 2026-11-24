# ST-02 — Управление облачными версиями в Template Manager

Приоритет `P1`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Дать автору безопасный просмотр истории, append, restore и явную публикацию.

## Текущее состояние

Локальный менеджер поддерживает версии и restore; облачная панель читает список и открывает копию последней версии.

## Зависимости

[ST-01](ST-01-studio-capability-audit.md), [TPL-02](TPL-02-append-template-version.md)

## Scope

Серверные действия с версией и контекстом workspace через имеющийся API.

## Non-goals

Массовое удаление, автоматический reimport, дублирование локального менеджера.

## Архитектурные требования

Явно различать локальный ready, авторский head и публичную версию; применять CAS, права и audit.

## План реализации

Подключить version history/preview; выбрать отдельные действия для append и publish; restore как новую версию при наличии полномочий.

## Acceptance Criteria

Version/status видны; stale editor получает понятный конфликт; просмотр не меняет public pin; чужой workspace изолирован.

## Обязательные тесты

Registry tests, PostgreSQL Workspace/CAS, Playwright actions with roles and validation.

## Миграции

Нет по умолчанию; используем TPL-02.

## Rollback Plan

Отозвать cloud actions, сохранив чтение, локальные workflows и историю.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
