# Eventiq — Google через Supabase Auth

Google использует тот же Supabase Auth и те же backend JWT и `AuthIdentity`, что и вход по email. Google OAuth включается флагом `NEXT_PUBLIC_SUPABASE_GOOGLE_ENABLED`. Email и вход в Admin Studio продолжают использовать свои существующие redirect URL.

## Настройка

1. Создайте OAuth client типа **Web application** в Google Cloud. Заполните consent screen и добавьте тестовые аккаунты. В **Authorized JavaScript origins** укажите проверяемый origin Eventiq. В **Authorized redirect URIs** добавьте callback, который Supabase показывает в настройках Google provider, например `https://PROJECT_REF.supabase.co/auth/v1/callback`.
2. В Supabase включите Google provider и сохраните OAuth client ID и secret. Secret хранится в Supabase. Укажите Site URL Eventiq и добавьте точные `https://YOUR_EVENTIQ_ORIGIN/ru/auth/callback` и `https://YOUR_EVENTIQ_ORIGIN/ky/auth/callback` в **Authentication → URL Configuration → Redirect URLs**. Для тестового сервера добавьте `http://localhost:3000/ru/auth/callback` и `http://localhost:3000/ky/auth/callback` либо используемый localhost origin. Сохраните redirect URL существующего входа по email и Studio.
3. Скопируйте параметры из `.env.example` в `.env.local`. Подставьте Supabase URL, publishable key, API URL. После настройки установите `NEXT_PUBLIC_SUPABASE_GOOGLE_ENABLED=true` и пересоберите Next.js. Для NestJS используйте существующий [Supabase JWT setup](../studio-v2/SUPABASE-AUTH.md).

[Google OAuth в Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google) · [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) · [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow)

## Поведение

- Кнопка Google и форма email используют один Supabase browser client. Для Google route handler обменивает PKCE code на сессию через cookie storage. Email сохраняет прямой redirect и прежний браузерный PKCE-обмен. Callback возвращает относительный путь только к локализованным маршрутам редактора или кабинета с допустимыми параметрами. Код авторизации и upstream-ошибки удаляются из URL перед переходом. При отмене, недействительном коде или недоступной конфигурации интерфейс показывает локализованное состояние.
- Редактор синхронно сохраняет текущие изменения на устройстве перед redirect. После входа возвращается тот же шаблон. Загрузка и запись облачного черновика остаются отдельными явными действиями. Кабинет и редактор пересоздают приватное состояние при смене Supabase subject и отменяют незавершённые запросы. Локальный снимок привязан к владельцу, версии шаблона и черновику. Старый локальный ключ сохранён для отдельного разбора в ED-02.
- Backend связывает пользователя с проверенным Supabase subject. Существующие identity не объединяются при совпадении email. Выйти на текущем устройстве можно из кабинета. Для отката выключите Google flag и пересоберите frontend.

## Проверки

`npm run test:google-auth` проверяет допустимые пути, сохранение параметров выбранного шаблона/черновика и отказ для внешних или некорректных URL. Playwright Chromium проверил реальный браузерный переход через контролируемые Supabase authorize и token endpoints, передачу PKCE verifier, cookie сессии, авторизованный запрос, выход, отмену, неверный callback, запуск email OTP и восстановление изменений редактора.

Проверка использовала тестовый HTTP-адаптер и синтетический аккаунт. Для проверки реальной формы Google, consent screen и email-доставки необходим настроенный тестовый проект Supabase. Production аккаунты и секреты не использовались.

[Вход RU, 390 px](google-auth-qa/sign-in-ru.webp) · [Отмена KY, 390 px](google-auth-qa/cancelled-ky.webp)

[Матрица AUTH-01/AUTH-02, Chromium и Windows PowerShell](../architecture/AUTH-SESSION-AUDIT.md)
