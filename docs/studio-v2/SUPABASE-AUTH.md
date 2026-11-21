# INVITO · Supabase Auth (production-ready cloud authentication)

This replaces the frontend's former localhost Keycloak PKCE login. It does **not** touch the Studio v2 editor's local IndexedDB drafts, the Prisma schema, Cloudflare R2 objects or current PostgreSQL projects.

## 1. Supabase Dashboard

1. In the existing INVITO Supabase project: **Authentication → Signing Keys** (Project Settings → JWT Keys in some dashboard versions). Make an **asymmetric ES256 signing key active**. If your project still uses a legacy JWT secret, migrate the signing key and rotate to the asymmetric standby key according to the official guide. Wait for JWKS cache propagation during rotation. Do **not** send JWT secret or service_role key to the browser.
2. In **Authentication → Providers → Email**, enable the email/password provider and choose whether signup requires email confirmation (recommended).
3. In **Authentication → URL Configuration**, set the Site URL and add the precise allowed redirect URL `http://localhost:3000/ru/admin/studio-v2`; also add `http://localhost:3000/ky/admin/studio-v2` if testing Kyrgyz UI. On production add your HTTPS Studio callback URLs. Do not allow wildcard production origins unnecessarily.
4. Copy the project's URL and **publishable key** (`sb_publishable_...`) from Project Settings → API Keys. Only the publishable key belongs in Next.js public environment variables.

## 2. Frontend .env.local in project root

```dotenv
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_YOUR_PUBLIC_KEY"
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
```

The browser-only Studio v2 uses `@supabase/ssr`'s `createBrowserClient` for PKCE, refreshed sessions and cookie-backed cross-tab sign-in. No passwords are sent to NestJS. The session's **access_token** (not ID token, not publishable API key) is sent as an Authorization Bearer token to NestJS.

Studio stays usable for **local-only editing** when these variables are missing. Remote save is available only after the signed-in user is provisioned into a Workspace.

Email confirmation: sign-up sets `emailRedirectTo` to the same Studio URL. Confirmed users return to Studio and the browser client processes the PKCE callback. If you customize the email template to use `token_hash`/custom server callbacks, it needs the corresponding `verifyOtp` route; the default Supabase verification template and redirect flow should remain in place.

## 3. NestJS server/.env

```dotenv
AUTH_PROVIDER_ID="supabase"
AUTH_ISSUER="https://YOUR_PROJECT_REF.supabase.co/auth/v1"
AUTH_AUDIENCE="authenticated"
AUTH_JWKS_URL="https://YOUR_PROJECT_REF.supabase.co/auth/v1/.well-known/jwks.json"
```

`DATABASE_URL` and `DIRECT_DATABASE_URL` remain unchanged (Supabase Transaction pooler and Session pooler respectively). Cloudflare R2 stays unchanged. Restart NestJS after changing `.env`.

The server checks:
- **JOSE signature** via the project's JWKS, asymmetric **ES256 / RS256 only** (HS256 is rejected).
- Exact issuer `https://PROJECT.supabase.co/auth/v1` and audience `authenticated`; `exp`, `iat`, maximum age and signature.
- `role === "authenticated"`, real UUID `sub` and `session_id`; anonymous sessions, publishable/anon or service_role JWTs are **not** application users.
- Immutable identity mapping `AuthIdentity(provider="supabase", subject=sub)` to `User`; Workspace rights always come from PostgreSQL, not JWT claims.

No Supabase service role, database password, JWT secret or auth admin token is needed to verify user tokens.

## 4. Run

```powershell
git switch main
git pull origin main
npm ci
cd server
npm ci
npm run start:dev
```

Start Next.js from a separate terminal with `npm run dev` at repository root. Open `http://localhost:3000/ru/admin/studio-v2`, click **Войти в INVITO** and sign up with email/password or sign in.

- `GET http://localhost:4000/api/v1/health/ready` must return `{"status":"ready"}`.
- Swagger `/api/v1/docs`: use the **Supabase Auth access token** only in local development; never paste real tokens into screenshots or tickets.
- A user first authenticated through Supabase will receive a new INVITO User and personal Workspace. **Existing Keycloak identities are NOT silently linked** to protect ownership boundaries. Migrating a previously populated Keycloak workspace requires a separately reviewed identity mapping, not an email match.

## 5. Troubleshooting

- **401** from NestJS: check that the active signing key is asymmetric, the access token's issuer is the configured Supabase project, audience is `authenticated`, it belongs to an active user session and the JWKS endpoint serves a public key. Do not share JWT payload or access tokens.
- **503** for private routes: Supabase Auth variables missing. PostgreSQL readiness is independent; inspect `/health/ready`.
- **Confirmation link redirects incorrectly**: add the exact Studio URL to Supabase Redirect URLs, ensure Site URL is correct.
- **Studio editor shows locally, cloud save unavailable**: Next.js public env is missing/invalid, NestJS offline or no signed-in session.

## Security / follow-up

This increment uses client-only Studio pages; it does **not** perform server-side per-user authenticated rendering. When adding SSR-protected pages, implement a server Supabase client, Next.js Proxy session refresh, and `getClaims()`/server authorization with cache boundaries. Keep DB access via NestJS and do not expose database credentials in Next.js.
