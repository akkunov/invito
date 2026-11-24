# CAT-03 — Хранение обложек и безопасный backfill

Приоритет `P1`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Хранить и обслуживать обложки по pinned version при 100+ шаблонах.

## Текущее состояние

Artifact/job lifecycle в main отсутствует; R2 trusted media и CAS уже есть.

## Зависимости

[CAT-02](CAT-02-catalog-rendered-cover.md)

## Scope

Фоновая генерация, ограниченная конкуренция, повтор, R2 metadata и backfill для опубликованных версий.

## Non-goals

Передача raw private keys и историческая правка public snapshots.

## Архитектурные требования

Использовать scoped R2 и один идемпотентный ключ на версию/локаль/revision; устаревший job не заменяет новую обложку.

## План реализации

Добавить минимальную схему артефакта; поставить job при явной публикации; реализовать lease/retry/backfill; измерить SQL, подписывание и size.

## Acceptance Criteria

Гонка publish и worker не меняет чужую/новую обложку; после сбоя доступен placeholder и повтор.

## Обязательные тесты

Disposable PostgreSQL migration/E2E, R2 signing/fixtures, concurrent backfill и replica retry.

## Миграции

Предполагается additive artifact/job metadata; проверить downgrade к старому читателю и повторный backfill.

## Rollback Plan

Отключить enqueue/worker и публичное чтение производных; готовые WebP и записи сохраняются.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
