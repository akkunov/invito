CREATE TABLE "CustomerRsvpResponse" (
  "id" UUID NOT NULL,
  "publicationId" UUID NOT NULL,
  "requestId" UUID NOT NULL,
  "nodeId" VARCHAR(80) NOT NULL,
  "guestName" VARCHAR(120) NOT NULL,
  "attendance" "Attendance" NOT NULL,
  "guestCount" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerRsvpResponse_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CustomerRsvpResponse_publicationId_requestId_key" ON "CustomerRsvpResponse"("publicationId","requestId");
CREATE INDEX "CustomerRsvpResponse_publicationId_createdAt_idx" ON "CustomerRsvpResponse"("publicationId","createdAt");
ALTER TABLE "CustomerRsvpResponse" ADD CONSTRAINT "CustomerRsvpResponse_publicationId_fkey"
  FOREIGN KEY ("publicationId") REFERENCES "CustomerPublication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CustomerRsvpThrottle" (
  "publicationId" UUID NOT NULL,
  "bucket" TIMESTAMPTZ(0) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "CustomerRsvpThrottle_pkey" PRIMARY KEY ("publicationId","bucket")
);
CREATE INDEX "CustomerRsvpThrottle_bucket_idx" ON "CustomerRsvpThrottle"("bucket");
ALTER TABLE "CustomerRsvpThrottle" ADD CONSTRAINT "CustomerRsvpThrottle_publicationId_fkey"
  FOREIGN KEY ("publicationId") REFERENCES "CustomerPublication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
