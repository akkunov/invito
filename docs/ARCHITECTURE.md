# INVITO · архитектура и границы первой итерации

Версия: 0.1.0 (frontend foundation). Утверждённая визуальная система: `#0B0B0B`, `#F7F7F4`, `#FF4A0A`. Фирменная палитра не распространяется на пользовательские шаблоны.

## Техническое решение

- **Frontend:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4.
- **Публичные страницы:** server-rendered React Server Components, локализованные URL `/ru` и `/ky`, canonical и hreflang.
- **Редактор:** отдельный client-component boundary только в `/[locale]/editor`; `InvitationDocument` как Single Source of Truth; debounced persistence в localStorage временно до серверного хранения.
- **Данные шаблонов:** `TemplateDefinition[]` — структурированные конфигурации. 12 примеров в seed-коллекции для проверки движка; 60 уникальных дизайнов предусмотрено на запуск.
- **Публикация и RSVP:** намеренно **не включены** на этом шаге. Кнопка публикации отключена, RSVP в превью явно помечен как недоступный. Никаких имитаций оплаты или ответов гостей.
- **Следующий серверный этап:** NestJS + Prisma + PostgreSQL; REST API, объектное хранилище, JWT, RBAC, аудит и платежи. Axios/TanStack Query/Zustand/RHF/shadcn-ui будут подключаться **по факту внедрения соответствующих функций**, а не ради неиспользуемых зависимостей.

## Схема документов

`invitation.schema.ts` содержит общий Zod-контракт (черновик допускает временно пустые поля, отдельная `invitationPublishSchema` валидирует полноту данных перед публикацией) (schemaVersion=1):

- `templateId` — ID неизменяемого определения шаблона;
- `locale` — текущий язык содержимого `ru | ky`;
- `accent` — индивидуальный цвет оформления приглашения;
- `content` — имена, двуязычные название/текст/город/место, дата и часовой пояс;
- `blocks` — упорядоченная последовательность с флагами видимости.

У редактора и предпросмотра **один renderer — `InvitationCanvas`**. Следующий этап — вынести shared schema в workspace `packages/contracts`, добавить TemplateVersion, InvitationRevision и миграции JSON-схем.

## Будущие доменные сущности (Backend)

| Entity | Ключевые поля |
| --- | --- |
| User | id, email, passwordHash?, role, preferredLocale, createdAt |
| Template | id, slug, category, premium, status, publishedVersionId |
| TemplateVersion | id, templateId, schemaVersion, definition Json, createdAt |
| Invitation | id, ownerId, templateVersionId, slug, status, publishedRevisionId |
| InvitationRevision | id, invitationId, document Json, version, createdAt |
| MediaAsset | id, ownerId, key, type, sizeBytes, mimeType |
| RsvpResponse | id, invitationId, guestName, attendance, partySize, createdAt |
| Payment | id, userId, invitationId, amountKgs, status, provider, externalId |

Для публикуемых документов требуется immutable snapshot, чтобы обновление системного шаблона не меняло ранее опубликованные приглашения. Для записи использовать транзакции и оптимистическую блокировку по version; разрешения проверять на Backend, а не на клиенте. Временный `localStorage` нельзя использовать как единственную систему хранения реальных данных пользователей.

## План API (после Backend)

- `GET /api/v1/templates` — SSR каталог с фильтрами.
- `GET /api/v1/templates/:slug` — метаданные и версия шаблона.
- `POST /api/v1/invitations` — создание черновика.
- `GET /api/v1/invitations/:id` — получение при наличии прав.
- `PATCH /api/v1/invitations/:id` — сохранение документа + ревизия.
- `POST /api/v1/invitations/:id/publish` — публикация версии после авторизации и проверки entitlement.
- `GET /api/v1/public/invitations/:slug` — опубликованный документ.
- `POST /api/v1/public/invitations/:slug/rsvp` — защищённый rate-limit публичный RSVP.
- `POST /api/v1/assets/presign` — безопасная загрузка медиа.
- `POST /api/v1/payments/checkout` — заказ; финальный статус только после верификации webhook.
- `POST /api/v1/admin/templates` — создание администратором.

## Core Web Vitals и SEO

- Серверный HTML для landing/catalog/detail, без клиентского запроса, блокирующего контент.
- `next/font/google` для основного и display шрифта с `display: swap`; важно подключение и сборка с доступом к Google Fonts или замена на законно поставляемые локальные файлы.
- Hero — CSS/SVG-конструкция, не нужен network-critical image LCP; нет бессмысленной предзагрузки.
- Карточки выполнены CSS, без больших remote images. При подключении реальных обложек использовать `next/image` + `sizes` и размеры, для LCP в Next.js 16 — `preload`.
- `robots.ts`, `sitemap.ts`, `Metadata`, `canonical`, alternate locales; `/editor` закрыт от индексации.
- Редактор не включён в бандл SEO-страниц, потому что его import ограничен отдельным route segment.
- Уважение `prefers-reduced-motion`, явные focus-visible состояния, формальные кнопки/ссылки и подписи ввода.

## Риски и ограничения

1. Онлайн-зависимости пока не установлены в среде генерации: `npm install`, `npm run build` требуют проверки на машине с npm-доступом.
2. Уникальные шаблоны: сделано 12 конфигураций и 12 визуальных направлений, а не 60 финальных дизайнов.
3. Drag & Drop, загрузка фото/музыки, система оплаты, авторизация, публикация и приём RSVP ещё не реализованы. На данном шаге доступна перестановка блоков кнопками.
4. Время сейчас привязано к Asia/Bishkek; позднее редактируемые часовые пояса и формат ISO с offset.
5. Прототипное имя INVITO не является проверенным товарным знаком или доменом.

## Как проверять вручную

1. Открыть `/ru`, переключить `KY` — заголовки и меню локализованы.
2. Нажать сургучную печать на hero, убедиться в открытии/закрытии с анимацией.
3. Открыть `/ru/templates`, выбрать категорию и поиск, проверить SSR query string.
4. Открыть разные шаблоны и убедиться, что палитра/композиция отличаются.
5. В редакторе поменять имена, языковые тексты, дату, акцент и видимость блоков; проверить предпросмотр.
6. Обновить вкладку — локальный черновик должен сохраниться; проверить Undo/Redo и сброс.
7. Убедиться, что публикация и RSVP не вводят пользователя в заблуждение.

## Frontend v0.2 — birthday templates

Three photo-first template implementations (`midnight-aura`, `soft-bloom`, `golden-milestone`) now share the existing `InvitationDocument` model with optional `content.age` and `media.{portraitDataUrl,focalY,galleryDataUrls}`. Each design has independent CSS styling and its own scroll narrative while reusing a common renderer, birthday photo component, image pipeline, and editor hook. Image data remains local to the browser until media storage and authenticated APIs are built; see `docs/BIRTHDAY_TEMPLATES.md`.
