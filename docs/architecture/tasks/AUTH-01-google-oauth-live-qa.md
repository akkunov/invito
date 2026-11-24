# AUTH-01 — Живая приёмка Google OAuth на тестовом Supabase

Приоритет `P0`. [Реестр задач](../PROJECT-STATUS.md)

## Цель

Подтвердить PKCE и возврат на настоящий Google provider.

## Текущее состояние

Callback и Google flag присутствуют. unit и прежний mock-browser прошли; живой провайдер и доставка почты не подтверждены.

## Зависимости

[000](000-eventiq-4-1-foundation.md)

## Scope

Настроенный тестовый проект, redirect allowlist RU/KY, вход/выход и возврат к draft.

## Non-goals

Production OAuth, секреты в репозитории, объединение аккаунтов по email.

## Архитектурные требования

Использовать прежние AuthIdentity и session subject, проверяемый return path и сохранение гостевых правок.

## План реализации

Получить тестовые credentials через разрешённый канал; проверить точные callback URL и consent; выполнить RU/KY success/cancel/expired и email fallback.

## Acceptance Criteria

Указаны проверенные окружение и redirect, Google/OTP имеют отдельные результаты, приватный черновик сохраняется и читается своим владельцем.

## Обязательные тесты

test:google-auth, mock + реальный Playwright/manual с синтетическим аккаунтом, отказ для внешнего return path.

## Миграции

Нет.

## Rollback Plan

Выключить NEXT_PUBLIC_SUPABASE_GOOGLE_ENABLED и вернуть email вход; сохранить auth identities.

## Definition of Done

Acceptance Criteria закрыты воспроизводимыми проверками. В реестре указаны SHA, PR, проверенная среда, результаты, ручная приёмка или основание «не применимо» и ограничения. Откат проверен в объёме задачи.
