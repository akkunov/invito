# MUS-05 — Одна активная сессия воспроизведения

Приоритет `P1`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Переиспользовать audio controller в редакторе, каталоге и гостевом рендере.

## Текущее состояние

Есть отдельные play реализации у Studio и legacy; выбор источника и его ресурсы обрабатываются раздельно.

## Зависимости

[MUS-01](MUS-01-music-provider-contract.md)

## Scope

Общий жизненный цикл play/pause/unload/seek capability, отмена предыдущего source, управляемый autoplay.

## Non-goals

Интерфейс расширенного timeline, live provider approval, смена старого audio storage.

## Архитектурные требования

Один активный элемент в контексте страницы. Звук запускается с gesture при ограничении браузера. Временные signed URLs ограничены scope и TTL.

## План реализации

Выделить controller и мигрировать consumers малыми шагами; проверить состояние paused/failed/blocked; retain legacy defaults.

## Acceptance Criteria

Нельзя проиграть два источника от одного экрана; прежние файлы и live page работают при недоступности трека.

## Обязательные тесты

Audio mock/adapter tests, Playwright seek denied and repeated mount, manual devices follow MUS-08.

## Миграции

Нет.

## Rollback Plan

Выключить новый controller за scope каждого consumer, сохранить источники и настройки.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
