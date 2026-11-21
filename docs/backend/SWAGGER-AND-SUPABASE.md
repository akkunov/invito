# INVITO API · Swagger/OpenAPI & Supabase diagnostics

## Swagger
- Local Swagger UI: `http://localhost:4000/api/v1/docs`
- Machine-readable OpenAPI JSON: `http://localhost:4000/api/v1/openapi.json`
- Public docs are enabled by default in nonproduction only. `API_DOCS_ENABLED=false` disables them. In production, **disabled by default**; enable explicitly with `API_DOCS_ENABLED=true` only behind appropriate infrastructure access controls.
- All protected endpoints use HTTP Bearer JWT. Swagger UI **Authorize** accepts the OIDC **access token**, which must include the API audience (`invito-api`). Swagger UI does not perform OAuth itself and never stores the token with `persistAuthorization`.
- Swagger paths, human-readable descriptions, request schemas and error statuses are maintained in `server/src/openapi.ts`. Runtime validation remains in Zod. Any route rename must update both definitions: server startup intentionally fails if the OpenAPI route manifest becomes stale.
- Never put real credentials, JWTs, R2 presigned links or private RSVP payloads into code examples, GitHub issues or screenshots.

## Supabase and DATABASE_UNAVAILABLE (503)
`GET /api/v1/health` only checks the process, whereas `GET /api/v1/health/ready` performs `SELECT 1` against the **runtime `DATABASE_URL`**. Prisma CLI migration commands use the **separate `DIRECT_DATABASE_URL`**. Successful Prisma Migrate or TCP ping to port 5432 does **not** establish connectivity from the running NestJS process on port 6543.

Use two connection strings obtained from the Supabase **Connect** dialog:

```dotenv
# Runtime: Transaction pooler; for a local process the Session pooler also works for diagnostics
DATABASE_URL="postgresql://postgres.PROJECT_REF:ENCODED_PASSWORD@aws-1-REGION.pooler.supabase.com:6543/postgres?sslmode=require"
# Prisma Migrate: Session pooler
DIRECT_DATABASE_URL="postgresql://postgres.PROJECT_REF:ENCODED_PASSWORD@aws-1-REGION.pooler.supabase.com:5432/postgres?sslmode=require"
DATABASE_POOL_MAX=3
```

1. Copy exact pooler URI from Supabase, including hostname, project reference, username and password. URL-encode special characters in the password. Add `sslmode=require` (append `&sslmode=require` if the URL already has a query).
2. In Windows PowerShell, test the **actual runtime** port: `Test-NetConnection <pooler-host> -Port 6543`. A successful test confirms only TCP; it does not verify TLS, password, role, database or Prisma.
3. Restart NestJS **after editing `server/.env`**. In case of 503, inspect Nest logs for a short error code: `28P01` password, `3D000` missing database, `53300` too many connections, `ETIMEDOUT` timeout. The API intentionally does not expose these details to guests.
4. If 6543 is blocked on your current network, you can **temporarily** use the verified Session Pooler URI (port 5432) for `DATABASE_URL` in local development, retaining `DIRECT_DATABASE_URL` for migrations. Do not assume port 6543 is universally accessible.
5. Check Supabase Database Settings / pooler metrics if you encounter connection exhaustion. `PrismaPg` now uses a configurable `DATABASE_POOL_MAX` (1–10, default 3), 10-second connection timeout and 10-second idle timeout. For serverless each instance has a separate pool, so set deployment concurrency accordingly.

Cloudflare R2 credentials do not affect PostgreSQL readiness. OIDC is not required for health endpoints.

## Verification
- `npm ci`, `npm run build`, `npm test` from `server/`.
- Run `npm run start:dev` and open `/api/v1/docs` and `/api/v1/openapi.json`.
- `curl.exe -i http://localhost:4000/api/v1/health/ready` should report `200 {"status":"ready"}` only when the runtime DB works.
