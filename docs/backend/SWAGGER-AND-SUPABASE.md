# INVITO API · Swagger/OpenAPI & Supabase diagnostics

## Swagger
- Local Swagger UI: `http://localhost:4000/api/v1/docs`
- Machine-readable OpenAPI JSON: `http://localhost:4000/api/v1/openapi.json`
- Public docs are enabled by default in nonproduction only. `API_DOCS_ENABLED=false` disables them. In production, **disabled by default**; enable explicitly with `API_DOCS_ENABLED=true` only behind appropriate infrastructure access controls.
- All protected endpoints use HTTP Bearer JWT. Swagger UI **Authorize** accepts the OIDC **access token**, which must include the API audience (`invito-api`). Swagger UI does not perform OAuth itself and never stores the token with `persistAuthorization`.
- Swagger paths, human-readable descriptions, response schemas and error statuses are maintained in `server/src/openapi.ts`. **JSON request body schemas are automatically generated using Zod 4 `z.toJSONSchema(..., {target: "openapi-3.0", io: "input"})` from the actual controller validators**; never copy those schemas by hand.
- Path IDs, numbers and slugs are declared as typed required parameters, and Swagger startup rejects **both** stale documented operations and newly added controller routes omitted from OpenAPI. A new API endpoint must have an explicit tag, description, security mode and response contract.
- Zod `superRefine` invariants (e.g. RSVP attendance vs guest count, media magic-byte verification) cannot be fully expressed as static OpenAPI constraints. Describe them in endpoint prose and keep server-side validation authoritative.
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

## Contract maintenance / review checklist

1. Add or update the Zod schema in the relevant feature module and ensure the controller uses it at runtime.
2. Export that validator and reference it in `server/src/openapi.ts` with `body(schema(validator))`; do not manually duplicate accepted fields.
3. Update human-readable documentation, parameter/response schema, possible status codes and the public/private authorization declaration.
4. Run `npm run build` and `npm test`; CI starts NestJS with a disposable database, downloads live `/api/v1/openapi.json` and checks actual request schema constraints and Bearer protection.
5. Avoid examples containing production PII or secrets. A presigned R2 URL is a **short-lived credential**, not a permanent asset address.

Swagger UI defaults to collapsed operations and searchable tags. It has deep links and request timing, does not persist JWTs and does not enable Try it out automatically. The live PostgreSQL readiness endpoint is safe for anonymous status checks; never expose connection strings in its response.
