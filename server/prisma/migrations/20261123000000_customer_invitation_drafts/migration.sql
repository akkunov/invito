-- Customer invitations are owned directly by authenticated users.
-- Design templates and versions remain immutable and independent.
CREATE TABLE "InvitationDraft" (
  "id" UUID NOT NULL,
  "ownerId" UUID NOT NULL,
  "templateVersionId" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "patch" JSONB NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InvitationDraft_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InvitationDraft_ownerId_updatedAt_idx" ON "InvitationDraft"("ownerId","updatedAt");
CREATE INDEX "InvitationDraft_templateVersionId_idx" ON "InvitationDraft"("templateVersionId");
CREATE INDEX "InvitationDraft_workspaceId_idx" ON "InvitationDraft"("workspaceId");
ALTER TABLE "InvitationDraft"
  ADD CONSTRAINT "InvitationDraft_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvitationDraft"
  ADD CONSTRAINT "InvitationDraft_templateVersionId_fkey"
  FOREIGN KEY ("templateVersionId") REFERENCES "TemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
