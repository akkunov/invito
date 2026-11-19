# ADR-029-04 — Media Storage and Verified R2 Objects

**Status:** implementation in `feat/29-4-media-storage`; no production R2 bucket or secrets configured.

## Threat model and invariant

User-controlled bytes cannot be trusted just because the browser claims a file name, MIME, Content-Length, SHA-256 or dimensions. R2 presigned PUT does **not** provide a POST Object upload policy with a size range. Browser-supplied checksum alone is not proof of validated content. Therefore **no upload is referenced by Studio JSONB until the backend reads and verifies the staged object and marks MediaAsset READY.**

A browser can replay a presigned PUT until its expiry, so publishing from the staging key is unsafe: an attacker could overwrite previously verified bytes. Our upload design prevents that by writing **a second, server-only verified object** after validation. Only the server holds credentials with write access to `verified/`.

## Backend API and permissions

| Verb | URL after /api/v1 | Minimum role | Effect |
| --- | --- | --- | --- |
| POST | /workspaces/:workspaceId/media/uploads | EDITOR | reserve pending row, return 180s presigned PUT |
| POST | /workspaces/:workspaceId/media/:assetId/complete | EDITOR and original uploader | verify staged bytes and commit READY |
| GET | /workspaces/:workspaceId/media | VIEWER | paginated READY metadata only |
| GET | /workspaces/:workspaceId/media/:assetId/read-url | VIEWER | 60s signed private image GET URL or 20-minute MP3 playback GET URL |

All endpoints run behind the signed OIDC JWT guard and look up membership in PostgreSQL. A resource outside the workspace returns 404; insufficient member role returns 403. Pending uploads cannot be read. Raw S3 keys and secret tokens are never returned to the UI.

**Initiate request:**

```json
{"name":"couple.png","mimeType":"image/png","bytes":102400,"sha256":"<64 hexadecimal chars>"}
```

Backend creates `MediaAsset` in status PENDING, owned by workspace and user. Staging key: `staging/{workspaceUUID}/{randomUUID}`. The URL is signed for `Content-Type`, expires after 180 seconds. The private R2 bucket CORS must allow the editor origin and its signed PUT request headers. Do NOT attach the OIDC Authorization header to the R2 PUT.

**Complete:** bounded HEAD/GET, recompute SHA-256, match exact bytes and Content-Type, inspect trusted format, then PutObject to `verified/{workspaceUUID}/{assetUUID}/{sha256}.{extension}`, transition READY via DB compare-and-swap, audit, and remove staging. A failing image/MP3/content hash is REJECTED. Missing staged object is a retryable 409; missing storage configuration 503. Signed staging uploads are never able to change READY bytes.

## Format and quota limits

| Format | Max bytes | Other requirements |
| --- | --- | --- |
| PNG, JPEG, WebP | 20 MiB | real sharp-decoded raster, 4096 px max side, 32M max decoded pixels, static only |
| MP3 (audio/mpeg) | 15 MiB | valid MPEG container, parsed sample rate/channels and 0–900s duration |

SVG is accepted by the **local** editor after browser-side sanitization/rasterization, but the server accepts only the converted PNG/JPEG/WebP. No arbitrary SVG or HTML content can be made READY.

Workspace quota is 500 MiB including reservations; 20 pending uploads. Pending rows older than 15 minutes are marked REJECTED on the next initiate. Configure a bucket lifecycle rule to expire orphaned `staging/` keys after 1 day; a future dedicated cleanup service may remove them more promptly. No destructive deletion of verified media is exposed by #29.4.

## R2 configuration (private bucket)

Set backend-only environment variables:

```dotenv
R2_ACCOUNT_ID="00000000000000000000000000000000"
R2_BUCKET="invito-private-media"
R2_ACCESS_KEY_ID="<server-only>"
R2_SECRET_ACCESS_KEY="<server-only>"
# Optional for EU jurisdiction:
R2_ENDPOINT="https://<account-id>.eu.r2.cloudflarestorage.com"
```

In R2 bucket CORS, replace origins with **only** your actual Frontend domain(s). Example:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://invito.kg"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

The bucket must not have an R2 public `r2.dev` URL or public custom domain enabled. Use the least-privilege R2 API token limited to that bucket. Keep API keys in Vercel `invito-api` only, not `NEXT_PUBLIC_*`.

## Studio browser integration

A user with a configured real OIDC session opts into Cloud from Studio v2. On click, `prepareCloudSnapshot`:
1. clones the exact locally validated Studio document without mutating IndexedDB;
2. reads its local PNG blobs, uploads them via authenticated initiate, signed PUT and complete;
3. swaps `local:...` to `asset:UUID` **only in the cloned remote snapshot**;
4. creates or revises the server project using #29.3 compare-and-swap. On 409, preserves the local copy and offers explicit conflict choices.

When opening an already-cloud-stored project, the editor resolves image `asset:UUID` through a 60-second signed read URL refreshed approximately every 45 seconds; MP3 receives a 20-minute signed URL for uninterrupted playback. The raw private R2 keys are never embedded into published or local snapshots.

MP3 upload is integrated with the Studio v2 music widget when a real OIDC workspace session is configured. The music widget's `block.source` accepts `asset:UUID` (separate from the image-only `ProjectDocumentV2.assets`). The backend rejects audio refs belonging to another tenant or referencing non-MP3 media. The editor resolves the private short-lived read URL for playback; signed URL refresh does not interrupt currently playing audio. Guest publication and permanent publicly playable audio belong to #29.5.

## Testing and release boundary

CI uses separate PostgreSQL 17 and a deterministic fake object store to validate upload permissions, actual checksum, decoding, READY transition, replay isolation, signed reads, invalid file rejection, source document saving, and short-lived client URL behavior. **Real Cloudflare R2 integration is not yet exercised**, and production credentials/delivery still require explicit configuration. Run R2 smoke tests in a dedicated nonproduction bucket before activating users.

Sources for operational configuration: <https://developers.cloudflare.com/r2/api/s3/presigned-urls/>, <https://developers.cloudflare.com/r2/buckets/cors/>, <https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/>.
