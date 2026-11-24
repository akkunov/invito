# MUS-06 — Сохранение Advanced Playback и совместимость релизов

Приоритет `P1`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Выразить относительные настройки фрагмента в одном типизированном контракте.

## Текущее состояние

Хранятся ссылки и простой playback; in/out, fades, loop range не закреплены в контракте.

## Зависимости

[MUS-01](MUS-01-music-provider-contract.md), [MUS-05](MUS-05-shared-music-player.md)

## Scope

Optional MusicPlaybackSettings в draft/patch/release, capability gate и строгая серверная проверка.

## Non-goals

Обрезка аудиофайла, перезапись release и расшифровка чужого аудио.

## Архитектурные требования

Проверять 0 ≤ start < end ≤ duration, громкость 0–1, fades в доступном диапазоне и capability источника. Legacy defaults стабильны.

## План реализации

Добавить optional schema и serialization; связать save/publish/restore; создать old/new read/write scenarios и boundary tests.

## Acceptance Criteria

Некорректные настройки отклоняются; точные значения переживают save/reload/publish; релиз до изменения по-прежнему читается.

## Обязательные тесты

Zod+core tests, PostgreSQL draft/release/hash, источник без seek и отсутствующая duration.

## Миграции

Аддитивно к JSON; переписывание старых данных не требуется.

## Rollback Plan

Выключить новые настройки на записи; reader не теряет ранее сохранённые поля.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
