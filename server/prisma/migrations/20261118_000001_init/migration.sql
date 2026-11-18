-- INVITO #29.2 initial schema for PostgreSQL 17.
-- Generated from the accepted #29.1 Prisma contract; apply to a disposable DB first.
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "TemplateCategory" AS ENUM ('WEDDING', 'KYZ_UZATUU', 'BIRTHDAY', 'ANNIVERSARY', 'CORPORATE', 'OTHER');
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'READY', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ARCHIVED');
CREATE TYPE "AssetStatus" AS ENUM ('PENDING', 'READY', 'REJECTED', 'DELETED');
CREATE TYPE "PublicationStatus" AS ENUM ('ACTIVE', 'UNPUBLISHED');
CREATE TYPE "Attendance" AS ENUM ('YES', 'NO', 'MAYBE');

CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "email" VARCHAR(320),
  "displayName" VARCHAR(120) NOT NULL,
  "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuthIdentity" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "provider" VARCHAR(40) NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Workspace" (
  "id" UUID NOT NULL,
  "slug" VARCHAR(80) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WorkspaceMember" (
  "workspaceId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" "MemberRole" NOT NULL DEFAULT 'VIEWER',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("workspaceId", "userId")
);
CREATE TABLE "Template" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "createdById" UUID NOT NULL,
  "slug" VARCHAR(80) NOT NULL,
  "publicSlug" VARCHAR(80),
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(1000) NOT NULL DEFAULT '',
  "category" "TemplateCategory" NOT NULL DEFAULT 'WEDDING',
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "coverPageId" VARCHAR(80) NOT NULL,
  "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
  "latestVersion" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TemplateVersion" (
  "id" UUID NOT NULL,
  "templateId" UUID NOT NULL,
  "number" INTEGER NOT NULL,
  "document" JSONB NOT NULL,
  "personalization" JSONB,
  "sha256" CHAR(64) NOT NULL,
  "note" VARCHAR(300) NOT NULL DEFAULT '',
  "createdById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TemplateVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StudioProject" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
  "latestRevision" INTEGER NOT NULL DEFAULT 0,
  "sourceTemplateVersionId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudioProject_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProjectRevision" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "number" INTEGER NOT NULL,
  "document" JSONB NOT NULL,
  "sha256" CHAR(64) NOT NULL,
  "createdById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectRevision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MediaAsset" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "uploadedById" UUID NOT NULL,
  "storageKey" VARCHAR(512) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(80) NOT NULL,
  "bytes" BIGINT NOT NULL,
  "sha256" CHAR(64) NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "status" "AssetStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Publication" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "slug" VARCHAR(80) NOT NULL,
  "status" "PublicationStatus" NOT NULL DEFAULT 'UNPUBLISHED',
  "latestRelease" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PublicationRelease" (
  "id" UUID NOT NULL,
  "publicationId" UUID NOT NULL,
  "number" INTEGER NOT NULL,
  "projectRevisionId" UUID NOT NULL,
  "snapshot" JSONB NOT NULL,
  "sha256" CHAR(64) NOT NULL,
  "createdById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublicationRelease_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RsvpResponse" (
  "id" UUID NOT NULL,
  "publicationId" UUID NOT NULL,
  "guestName" VARCHAR(120) NOT NULL,
  "attendance" "Attendance" NOT NULL,
  "guestCount" INTEGER NOT NULL DEFAULT 1,
  "message" VARCHAR(2000),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RsvpResponse_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditEvent" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "actorId" UUID,
  "action" VARCHAR(80) NOT NULL,
  "entity" VARCHAR(80) NOT NULL,
  "entityId" VARCHAR(80) NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "IdempotencyRecord" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "route" VARCHAR(120) NOT NULL,
  "key" VARCHAR(120) NOT NULL,
  "requestHash" CHAR(64) NOT NULL,
  "response" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "AuthIdentity_provider_subject_key" ON "AuthIdentity"("provider", "subject");
CREATE INDEX "AuthIdentity_userId_idx" ON "AuthIdentity"("userId");
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");
CREATE UNIQUE INDEX "Template_workspaceId_slug_key" ON "Template"("workspaceId", "slug");
CREATE UNIQUE INDEX "Template_publicSlug_key" ON "Template"("publicSlug");
CREATE INDEX "Template_status_updatedAt_idx" ON "Template"("status", "updatedAt");
CREATE INDEX "Template_workspaceId_updatedAt_idx" ON "Template"("workspaceId", "updatedAt");
CREATE UNIQUE INDEX "TemplateVersion_templateId_number_key" ON "TemplateVersion"("templateId", "number");
CREATE INDEX "TemplateVersion_createdById_createdAt_idx" ON "TemplateVersion"("createdById", "createdAt");
CREATE INDEX "StudioProject_workspaceId_updatedAt_idx" ON "StudioProject"("workspaceId", "updatedAt");
CREATE INDEX "StudioProject_sourceTemplateVersionId_idx" ON "StudioProject"("sourceTemplateVersionId");
CREATE UNIQUE INDEX "ProjectRevision_projectId_number_key" ON "ProjectRevision"("projectId", "number");
CREATE INDEX "ProjectRevision_projectId_createdAt_idx" ON "ProjectRevision"("projectId", "createdAt");
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");
CREATE INDEX "MediaAsset_workspaceId_status_createdAt_idx" ON "MediaAsset"("workspaceId", "status", "createdAt");
CREATE INDEX "MediaAsset_workspaceId_sha256_idx" ON "MediaAsset"("workspaceId", "sha256");
CREATE UNIQUE INDEX "Publication_slug_key" ON "Publication"("slug");
CREATE INDEX "Publication_workspaceId_updatedAt_idx" ON "Publication"("workspaceId", "updatedAt");
CREATE INDEX "Publication_projectId_idx" ON "Publication"("projectId");
CREATE UNIQUE INDEX "PublicationRelease_publicationId_number_key" ON "PublicationRelease"("publicationId", "number");
CREATE INDEX "PublicationRelease_projectRevisionId_idx" ON "PublicationRelease"("projectRevisionId");
CREATE INDEX "RsvpResponse_publicationId_createdAt_idx" ON "RsvpResponse"("publicationId", "createdAt");
CREATE INDEX "AuditEvent_workspaceId_createdAt_idx" ON "AuditEvent"("workspaceId", "createdAt");
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt");
CREATE UNIQUE INDEX "IdempotencyRecord_workspaceId_actorId_route_key_key" ON "IdempotencyRecord"("workspaceId", "actorId", "route", "key");
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Template" ADD CONSTRAINT "Template_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Template" ADD CONSTRAINT "Template_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TemplateVersion" ADD CONSTRAINT "TemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TemplateVersion" ADD CONSTRAINT "TemplateVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudioProject" ADD CONSTRAINT "StudioProject_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudioProject" ADD CONSTRAINT "StudioProject_sourceTemplateVersionId_fkey" FOREIGN KEY ("sourceTemplateVersionId") REFERENCES "TemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectRevision" ADD CONSTRAINT "ProjectRevision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "StudioProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectRevision" ADD CONSTRAINT "ProjectRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "StudioProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PublicationRelease" ADD CONSTRAINT "PublicationRelease_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PublicationRelease" ADD CONSTRAINT "PublicationRelease_projectRevisionId_fkey" FOREIGN KEY ("projectRevisionId") REFERENCES "ProjectRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PublicationRelease" ADD CONSTRAINT "PublicationRelease_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RsvpResponse" ADD CONSTRAINT "RsvpResponse_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
