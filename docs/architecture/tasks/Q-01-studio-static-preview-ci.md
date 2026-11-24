# Q-01 — Восстановление статического превью Studio в CI

Приоритет `P0`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Проверить и восстановить честный export-only gate для Admin Studio.

## Текущее состояние

Два workflow базового SHA остановились на /manifest.webmanifest и output: export. Production build 4.0 имеет отдельное доказательство.

## Зависимости

[000](000-eventiq-4-1-foundation.md)

## Scope

Изолированный export entrypoint, совместимый manifest/route set и проверка basePath /invito.

## Non-goals

Изменение публичного deployment, удаление маршрутов из основной сборки и отключение браузерных тестов.

## Архитектурные требования

Запускать destructive preview script только в отдельной рабочей копии/CI. Runtime OAuth/customer routes сохраняются.

## План реализации

Снять failing CI; привести static input allowlist в соответствие с Next.js; собрать и открыть RU/KY Studio с корректным basePath; повторить оба workflow.

## Acceptance Criteria

Оба static gates доходят до browser suite; production app собирается и сохраняет SSR/API маршруты.

## Обязательные тесты

Staged static export, Playwright stress/real Studio route, compiled Next app route smoke.

## Миграции

Нет.

## Rollback Plan

Вернуть предыдущий CI-скрипт, сохранить отдельную app-сборку и отчёт о сбое export.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
