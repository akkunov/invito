# REL-01 — Интеграционная репетиция Eventiq 4.1

Приоритет `P1`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Собрать доказательства end-to-end на тестовом стенде перед рабочим выпуском.

## Текущее состояние

Компоненты 4.0 подтверждены на main частично; release 4.1 ещё не сформирован.

## Зависимости

[TPL-03](TPL-03-template-update-rehearsal.md), [VF-01](VF-01-love-story.md), [VF-02](VF-02-vogue-wedding.md), [VF-03](VF-03-italian-romance.md), [VF-04](VF-04-cinema-wedding.md), [VF-05](VF-05-secret-garden.md), [VF-06](VF-06-boarding-pass.md), [VF-07](VF-07-wedding-newspaper.md), [VF-08](VF-08-digital-envelope.md), [VF-09](VF-09-art-gallery.md), [VF-10](VF-10-minimal-architecture.md), [CAT-04](CAT-04-catalog-cards-and-editor.md), [ED-05](ED-05-editor-publish-review.md), [ST-02](ST-02-studio-cloud-version-actions.md), [ST-03](ST-03-studio-scale-and-regressions.md), [AUTH-01](AUTH-01-google-oauth-live-qa.md), [ACC-02](ACC-02-account-share-and-qr.md), [WA-05](WA-05-whatsapp-sandbox-qa.md), [MUS-08](MUS-08-music-live-device-qa.md), [Q-02](Q-02-lint-and-ci-baseline.md), [Q-03](Q-03-catalog-and-studio-scale.md), [SEC-01](SEC-01-security-boundaries-review.md)

## Scope

Временная интеграционная среда, типы, migrations up/compatibility, browsers/providers, backup/restore, нагрузка и отчёт.

## Non-goals

Запуск production, скрытие известных отказов или редактирование старых releases.

## Архитектурные требования

Проверки на одном SHA и известных конфигурациях. Продвижение по verified artifacts. Feature flags с release notes и планом отключения.

## План реализации

Прогнать базу с нуля и upgrade, повтор/restore, матрицу RU/KY и внешних provider; собрать diff и журнал ручной приёмки.

## Acceptance Criteria

Критические сценарии и выбранная матрица зелёные, остатки/исключения согласованы и привязаны к версии.

## Обязательные тесты

Полный scoped typecheck/lint/build, contract/E2E, Playwright/device/manual, synthetic DB+R2 restore smoke.

## Миграции

Только миграции принятых задач на disposable/staging.

## Rollback Plan

Отключить флаги, вернуть тестовый код на baseline, восстановить backup в отдельную БД и проверить доступ.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
