> **Историческая документация.** Основной вход INVITO переключён на Supabase Auth. См. [актуальную инструкцию](./SUPABASE-AUTH.md). Keycloak больше не используется текущим frontend Studio.

# Local Keycloak Studio v2 login (Windows, no Docker)

1. Start local Keycloak at `http://localhost:8080` (`C:\\keycloak-26.8.2\\bin\\kc.bat start-dev`).
2. Realm `invito`, public OIDC client `invito-web`, standard authorization-code flow and PKCE S256 required, redirect `http://localhost:3000/*`, web origin `http://localhost:3000`. Audience mapper on access token must add `invito-api`. Access tokens <= 15m, recommended 5m.
3. In `server/.env` set:
   ```dotenv
   AUTH_ISSUER=http://localhost:8080/realms/invito
   AUTH_AUDIENCE=invito-api
   AUTH_JWKS_URL=http://localhost:8080/realms/invito/protocol/openid-connect/certs
   AUTH_PROVIDER_ID=keycloak-local
   FRONTEND_ORIGINS=http://localhost:3000
   ```
   Retain the existing PostgreSQL and R2 credentials in the backend only.
4. In root `.env.local`:
   ```dotenv
   NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_AUTH_ISSUER=http://localhost:8080/realms/invito
   NEXT_PUBLIC_AUTH_CLIENT_ID=invito-web
   ```
5. Restart NestJS and Next.js; open `http://localhost:3000/ru/admin/studio-v2`. Click **Войти через Keycloak**. On return, frontend provisions a workspace if none exists. Then use **Облако** for explicit R2 upload and server revision, and **Публикация** for server release.

## Security and limits
- Browser Authorization Code + PKCE S256; random state and verifier live only in sessionStorage during the redirect. After the callback these are removed.
- Access/refresh tokens stay in JS memory, never persisted to localStorage/IndexedDB; browser reload requires login again (Keycloak SSO may make it quick).
- Workspace creation is only after verified API identity. A local project is never uploaded automatically.
- Keycloak `start-dev` and HTTP localhost are development only. Use HTTPS and a properly hosted identity provider in production.
- Missing OIDC env keeps existing offline Studio flow. No demo credentials or authentication bypass.
