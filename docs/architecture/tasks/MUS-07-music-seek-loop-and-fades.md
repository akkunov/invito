# MUS-07 — Timeline и реализация расширенного playback

Приоритет `P1`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Редактировать и воспроизводить in/out, громкость, fade и loop на проверенных источниках.

## Текущее состояние

Музыкальный picker и рендерер используют простой playback; расширенное состояние добавляет MUS-06.

## Зависимости

[MUS-04](MUS-04-editor-music-library.md), [MUS-06](MUS-06-music-playback-schema.md)

## Scope

Time inputs с шагом 1 сек, кнопки ±5 с, отрезок, loop, плавные fades, waveform только при доступных разрешённых данных.

## Non-goals

Реальные audio bytes processing, обязательный waveform, автозапуск и browser hacks.

## Архитектурные требования

Ждать metadata и seekable; ограничить диапазон и повтор; признак ограничения браузера виден пользователю; нет резких артефактов при смене источника.

## План реализации

Добавить общие контролы в editor; согласовать preview/release controller; проверить отказ Range и неподдерживаемое управление громкостью.

## Acceptance Criteria

Итоговый релиз играет нужный фрагмент, редактор не обещает отключённые возможности, гостевой экран работает без музыки при сбое.

## Обязательные тесты

Виртуальные часы и media capability tests, Playback UI mobile/desktop keyboard, persist/rollback scenarios.

## Миграции

Нет сверх MUS-06.

## Rollback Plan

Скрыть advanced UI/controller, сохранить ссылку и optional settings.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
