# AUTH-01 / AUTH-02 — аудит входа и сессий Eventiq 4.1

Статус `REVIEW`. База аудита [47ea61d](https://github.com/akkunov/invito/commit/47ea61de646c399cc4cc97c9d3937b3f556c4361) после PR #83. Ветка `feat/eventiq-4-1-auth-sessions`. Тесты используют синтетические аккаунты и отдельную PostgreSQL. Рабочие Supabase, PostgreSQL и R2 не использовались.

## Матрица аудита

| Проверка | Что найдено и изменено | Граница доказательства |
| --- | --- | --- |
| 1. Google OAuth и PKCE | Общий Supabase SSR browser client с PKCE, feature flag, локализованная кнопка входа. Route handler использует cookie и обменивает code вместе с verifier. | Контролируемые authorize и token проверяют S256 и code verifier. Реальный Google consent ожидает staging. |
| 2. Callback и redirect URL | `authReturnPath` принимает только маршруты текущей локали и проверенные template/draft. Callback отвечает относительным 303, `private, no-store` и `no-referrer`. Сохранены redirect URL email OTP и Admin Studio. | Unit и Chromium проверяют сохранение draft, отклонение внешнего URL, отмену, некорректный code и прежний OTP redirect. Фактический allowlist Supabase проверяется в staging. |
| 3. Access и refresh tokens | SDK восстанавливает cookie-сессию и освежает access token. Nest получает только bearer access token. Browser transport теперь сверяет текущий subject и отменяет операции при выходе или смене subject. Studio тоже запрашивает токен для subject подключённого workspace. | Контролируемые refresh success/reject, ротация токена и следующий авторизованный запрос. Фактическая политика срока токенов и ротация ключей — настройка staging. |
| 4. Nest JWT | Глобальный `JwtAuthGuard`, JWKS того же HTTPS origin, проверка ES256/RS256, issuer, audience, `exp`, `iat`, role, subject и session ID. Identity берётся по provider + subject. | Unit проверяет Supabase claims и алгоритмы. PostgreSQL E2E проверяет реально подписанные тестовые JWT, включая отказ по `exp`. Production-код guard не менялся. |
| 5. Приватные маршруты и API | Кабинет и редактор отдают общую оболочку. Публичные каталог, приглашение, RSVP и гостевое редактирование работают без сессии. Данные кабинета, private draft/media, публикация владельца и workspace доступны после серверного guard. | Fixtures проверяют оболочку и переключение UI, Nest E2E проверяет приватные API и права. Next.js сейчас не рендерит приватные данные через SSR. |
| 6. Изоляция данных | Nest проверяет owner/workspace. Кабинет уже сбрасывал состояние по subject. Теперь весь редактор, история и подписанные URL меняются вместе с областью сессии. Локальный снимок v2 относится к subject, версии шаблона и draft; медиа, save/load и publish используют исходную область запроса. | Chromium проверяет A → выход в соседней вкладке → B, отмену незавершённого запроса и отсутствие снимка A в B. PostgreSQL E2E проверяет права другого владельца. |
| 7. Перезагрузка | `INITIAL_SESSION` восстанавливает сессию SDK, редактор ждёт известной области, затем открывает её локальный снимок. | Reload сохраняет сессию и правки. Отдельный Chromium-сценарий загружает страницу с истёкшим access token и проверяет refresh. |
| 8. Logout | Кабинет по-прежнему отзывает refresh текущей сессии через `signOut({scope:"local"})`. Сессия теряется и в соседних вкладках, запросы отменяются, приватный React state уничтожается. Studio сохраняет своё текущее поведение выхода. | Chromium проверяет запрос logout и отсутствие данных аккаунта в других вкладках. Уже выданный JWT Nest принимает до `exp` с допуском часов; активный отзыв каждого JWT на сервере не предусмотрен текущим контрактом. |
| 9. Возврат в редактор | Google callback сохраняет валидные `template` и `draft`. При отмене и ошибке панель входа редактора открывается автоматически. | Chromium проверяет точный URL редактора и видимость обратной связи по RU/KY. Привязку старого облачного черновика к опубликованной ранее версии доводит ED-01. |
| 10. Гостевой черновик | Перед переходом редактор синхронно пишет локальный снимок. Первый вход может восстановить гостевые правки для того же шаблона/черновика. Предыдущий account snapshot остаётся доступен этому аккаунту после повторного входа. | Chromium проверяет гостевые правки до входа, после callback и reload, а также отдельное состояние облачной копии. Старый общий ключ v1 сохранён, автоматически никому не назначается. |
| 11. Ошибки и повторный вход | Отмена и сбой callback локализованы. Просроченная refresh-сессия переводит оболочку в форму входа. При отказе Bearer кабинет даёт явный путь повторного входа. Мутации не повторяются автоматически. | Chromium проверяет отмену, invalid code, отказ refresh и повторный вход. Истечение настоящей сессии и доставка email требуют staging. |
| 12. Mobile и desktop | Используются те же формы входа, общий `UniversalMobileEditor` и renderer. Эталонные пакеты Love Story, Vogue Wedding и Italian Romance служат функциональными fixtures. | Chromium при 320, 390 и 1440 px, RU/KY. Живые iOS Safari, Android Chrome и desktop с Google ожидают ручной проверки. |

[Browser session](../../src/features/auth/browser/use-customer-session.ts) · [Callback](../../src/app/%5Blocale%5D/auth/callback/route.ts) · [Nest Auth](../../server/src/modules/auth/auth.service.ts) · [Граница клиентского API](../../src/features/invitations/customer-cloud.ts)

## Подтверждённые проблемы и последствия

1. **Один локальный ключ на всех владельцев.** До правки загруженный из облака снимок и правки владельца попадали в `eventiq:customer-draft:v1:<version>`. Редактор другой сессии на том же браузерном профиле мог восстановить эти значения и метаданные медиа. Новые записи используют `eventiq:customer-draft:v2:<subject-or-guest>:<template-version>:<draft-or-new>`. Редактор сбрасывается при смене ключа. V1 не удаляется и не переносится автоматически, поскольку в исторических данных отсутствует доказуемое происхождение. Сохранённые облачные копии открываются своим владельцем. Для старых локальных правок без облачной копии нужна процедура восстановления с проверкой происхождения в ED-02.
2. **Токен мог смениться между шагами операции.** Транспорт теперь читает токен для subject, который инициировал операцию, и передаёт сигнал сессии в private API и загрузку медиа. Отмена на клиенте не откатывает запрос, который сервер уже успел применить. Ревизии и разрешения сервера по-прежнему определяют фактический результат сохранения и публикации.
3. **При возврате с OAuth-ошибкой форма редактора скрывалась.** Действующий локализованный UI формы снова виден после возврата. Email сохраняет прежний прямой redirect и PKCE-обмен в браузере.
4. **Рабочая интеграция провайдера ещё не доказана.** В аудите не было отдельного согласованного Supabase-проекта с Google client, redirect allowlist, тестовыми владельцами и доставкой email. По этой причине AUTH-01 остаётся на ревью. Административные копии, которые автор явно открыл для локальной работы в Studio, хранятся на устройстве по действующему контракту Studio. Граница авторского офлайн-хранилища учитывается в ST-02/SEC-01.

## Воспроизведение на Windows PowerShell

### 1. Изолированная проверка Chromium

Используйте два терминала из корня ветки. Нужен Node.js 22.18 или новее. Порты 4000 и 4180 должны быть свободны. Тест сам запускает временный HTTP-fixture на 4000 и закрывает его. Настройки действуют в текущем окне PowerShell.

Терминал 1

```powershell
git fetch origin
git switch feat/eventiq-4-1-auth-sessions
npm ci
$env:NEXT_PUBLIC_API_URL = "http://127.0.0.1:4000/api/v1"
$env:NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:4000"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "local-browser-fixture"
$env:NEXT_PUBLIC_SUPABASE_GOOGLE_ENABLED = "true"
npm run typecheck
npm run test:google-auth
npm run build
npm run start -- --hostname 127.0.0.1 --port 4180
```

Терминал 2

```powershell
$env:STUDIO_BROWSER_PREFIX = Join-Path $env:TEMP "eventiq-auth-playwright"
npm install --prefix $env:STUDIO_BROWSER_PREFIX --no-save --package-lock=false playwright@1.56.1
$playwright = Join-Path $env:STUDIO_BROWSER_PREFIX "node_modules\.bin\playwright.cmd"
& $playwright install --only-shell chromium
$env:AUTH_QA_ARTIFACTS = Join-Path $PWD "studio-browser-artifacts\auth-sessions"
npm run test:auth-session-browser
```

Артефакты включают вход из редактора, кабинет второго аккаунта после смены сессии, отмену KY и состояние после отказа refresh. Для локальных API E2E используйте отдельную PostgreSQL, установите `DATABASE_URL` и `DIRECT_DATABASE_URL` только для этой базы и выполните `npm --prefix server run db:migrate:deploy` и `npm --prefix server run test:e2e`. [Backend CI с отдельной PostgreSQL](../../.github/workflows/backend-core.yml)

### 2. Живая приёмка на отдельном Supabase

Настройте Google provider, consent screen и синтетические аккаунты в тестовом проекте. Для тестового origin `http://localhost:4180` добавьте `/ru/auth/callback`, `/ky/auth/callback` и используемые прямые пути email/Studio. Оставьте `localhost` одинаковым при открытии сайта и подтверждении входа. В Google укажите callback тестового Supabase `https://<staging-ref>.supabase.co/auth/v1/callback`. [Настройка OAuth](../setup/GOOGLE-AUTH.md)

В новом окне PowerShell выполните сборку и запуск frontend с адресом согласованного тестового API и Supabase publishable key тестового проекта.

```powershell
$env:NEXT_PUBLIC_API_URL = "http://localhost:4000/api/v1"
$env:NEXT_PUBLIC_SUPABASE_URL = "https://<staging-ref>.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "<staging-publishable-key>"
$env:NEXT_PUBLIC_SUPABASE_GOOGLE_ENABLED = "true"
npm run build
npm run start -- --hostname localhost --port 4180
```

Для локального NestJS используйте отдельную PostgreSQL и `FRONTEND_ORIGINS=http://localhost:4180`, `AUTH_PROVIDER_ID=supabase`, `AUTH_ISSUER=https://<staging-ref>.supabase.co/auth/v1`, `AUTH_AUDIENCE=authenticated` и `AUTH_JWKS_URL=https://<staging-ref>.supabase.co/auth/v1/.well-known/jwks.json`. Примените миграции только к тестовой базе и запустите `npm --prefix server run start:dev` после установки зависимостей backend. Для проверки редактора тестовый API должен выдавать один из трёх принятых шаблонов в каталоге. [Контракт импорта на чистом стенде](../backend/TEMPLATE-PACKAGE-V1.md) · [Вывод версии в тестовый каталог](../backend/SERVER-TEMPLATE-CATALOG.md)

1. Откройте кабинет RU и KY, войдите через Google обоими тестовыми аккаунтами по очереди. Проверьте ошибки и отзыв согласия на экране Google. Повторите с email и доставленной ссылкой.
2. Откройте выбранный шаблон из тестового каталога, измените поле до входа и войдите из редактора. Сверьте URL, текст после возврата и повторной загрузки.
3. Сохраните приватную копию в A, выйдите из кабинета и войдите в B в том же профиле. Проверьте вторую вкладку, список, редактор, отсутствие доступа к чужому черновику и подписанным ссылкам.
4. Используйте краткий срок доступа на тестовом проекте или отдельную тестовую сессию с отозванным refresh. Проверьте повторный запрос и повторный вход. Повторите матрицу на desktop, мобильном Safari и Chrome. Зафиксируйте SHA, браузеры, локали, результат Google и результат email отдельно. Исключите токены и адреса из скриншотов и логов.

## Результаты автоматических проверок

- Frontend и backend typecheck и production build прошли. Прошли 43 локальных frontend/контрактных набора, отдельная проверка публичных маршрутов и 65 smoke-проверок доступности функций Studio.
- Chromium прошёл матрицу сессий RU/KY при 320, 390 и 1440 px. Сценарии существующего редактора и трёх принятых пакетов прошли, включая загрузку медиа и восстановление правок.
- Backend прошёл 19 unit и 6 E2E на отдельной PostgreSQL 17 после миграций. Корневой lint сообщает 51 ошибку и 52 предупреждения в существующем коде. Базовые нарушения отслеживаются в [Q-02](tasks/Q-02-lint-and-ci-baseline.md).
- [CI и артефакты PR #85](https://github.com/akkunov/invito/pull/85/checks). [Ограничение Vercel Preview](tasks/Q-04-vercel-preview-blocked.md).

## Откат

Отключить Google флаг для текущего развёртывания можно пересборкой frontend с `NEXT_PUBLIC_SUPABASE_GOOGLE_ENABLED=false`. Email и Admin Studio используют свои прежние маршруты. Миграции приложения отсутствуют. При откате UI не копировать записи v2 в общий ключ v1. Открытые v2 и v1 ключи принадлежат своим версионным форматам и сохраняются.
