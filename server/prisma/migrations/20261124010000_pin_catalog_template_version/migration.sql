ALTER TABLE "Template" ADD COLUMN "publishedVersionId" UUID;

CREATE UNIQUE INDEX "TemplateVersion_templateId_id_key"
  ON "TemplateVersion"("templateId", "id");

UPDATE "Template" AS t
  SET "publishedVersionId" = v."id"
  FROM "TemplateVersion" AS v
  WHERE t."status" = 'PUBLISHED' AND t."publicSlug" IS NOT NULL
    AND v."templateId" = t."id" AND v."number" = t."latestVersion";

ALTER TABLE "Template"
  ADD CONSTRAINT "Template_id_publishedVersionId_fkey"
  FOREIGN KEY ("id", "publishedVersionId")
  REFERENCES "TemplateVersion"("templateId", "id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
