-- #29.5 — one stable link per project, anonymous RSVP idempotency and bounded rate buckets
-- Migration refuses duplicate publications for one project rather than arbitrarily discarding data.
ALTER TABLE "RsvpResponse" ADD COLUMN "nodeId" VARCHAR(80) NOT NULL DEFAULT '';
ALTER TABLE "RsvpResponse" ADD COLUMN "requestId" UUID;
CREATE UNIQUE INDEX "Publication_projectId_key" ON "Publication"("projectId");
CREATE UNIQUE INDEX "RsvpResponse_publicationId_requestId_key" ON "RsvpResponse"("publicationId", "requestId");
CREATE TABLE "RsvpThrottle" (
    "publicationId" UUID NOT NULL,
    "bucket" TIMESTAMPTZ(0) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RsvpThrottle_pkey" PRIMARY KEY ("publicationId","bucket")
);
CREATE INDEX "RsvpThrottle_bucket_idx" ON "RsvpThrottle"("bucket");
ALTER TABLE "RsvpThrottle" ADD CONSTRAINT "RsvpThrottle_publicationId_fkey"
FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
