CREATE TABLE "CustomerPublication" (
  "id" UUID NOT NULL,
  "draftId" UUID NOT NULL,
  "ownerId" UUID NOT NULL,
  "slug" VARCHAR(80) NOT NULL,
  "status" "PublicationStatus" NOT NULL DEFAULT 'ACTIVE',
  "latestRelease" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerPublication_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CustomerPublication_draftId_key" ON "CustomerPublication"("draftId");
CREATE UNIQUE INDEX "CustomerPublication_slug_key" ON "CustomerPublication"("slug");
CREATE INDEX "CustomerPublication_ownerId_updatedAt_idx" ON "CustomerPublication"("ownerId","updatedAt");
ALTER TABLE "CustomerPublication" ADD CONSTRAINT "CustomerPublication_draftId_fkey"
  FOREIGN KEY ("draftId") REFERENCES "InvitationDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPublication" ADD CONSTRAINT "CustomerPublication_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CustomerPublicationRelease" (
  "id" UUID NOT NULL,
  "publicationId" UUID NOT NULL,
  "number" INTEGER NOT NULL,
  "draftRevision" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "sha256" CHAR(64) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerPublicationRelease_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CustomerPublicationRelease_publicationId_number_key"
  ON "CustomerPublicationRelease"("publicationId","number");
ALTER TABLE "CustomerPublicationRelease" ADD CONSTRAINT "CustomerPublicationRelease_publicationId_fkey"
  FOREIGN KEY ("publicationId") REFERENCES "CustomerPublication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
