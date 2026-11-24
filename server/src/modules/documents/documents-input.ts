import {BadRequestException, UnprocessableEntityException} from "@nestjs/common";
import {z} from "zod";
import {
  validatedStudioSnapshot, validatedTemplateVersion, assertReadyAssets, snapshotHash,
} from "../../../domain/persistence-contract.js";
import type {ProjectDocumentV2} from "../../../../src/features/studio-v2/core/document.schema.js";
import type {PrismaClient} from "../../generated/prisma/client.js";

export {snapshotHash};
export const slug = z.string().trim().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const uuid = z.uuid();
export const createTemplateInput = z.strictObject({
  slug, name: z.string().trim().min(1).max(100), description: z.string().trim().max(1000).default(""),
  category: z.enum(["WEDDING","KYZ_UZATUU","BIRTHDAY","ANNIVERSARY","CORPORATE","OTHER"]).default("WEDDING"),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  coverPageId: z.string().min(1).max(80),
  document: z.unknown(), personalization: z.unknown().optional(),
});
export const createVersionInput = z.strictObject({
  expectedVersion: z.number().int().min(1),
  note: z.string().trim().max(300).default(""),
  document: z.unknown(), personalization: z.unknown().optional(),
});
export const createProjectInput = z.strictObject({
  title: z.string().trim().min(1).max(120),
  sourceTemplateVersionId: uuid.optional(),
  document: z.unknown(),
});
export const createRevisionInput = z.strictObject({
  expectedRevision: z.number().int().min(1),
  document: z.unknown(),
});
export const pagingInput = z.strictObject({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export function parseInput<T extends z.ZodType>(schema: T, body: unknown): z.output<T> {
  const result = schema.safeParse(body);
  if (!result.success) throw new BadRequestException({
    code: "VALIDATION_FAILED", issues: result.error.issues.map(i => ({path: i.path, message: i.message})),
  });
  return result.data;
}
export function validatedDocument(input: unknown): ProjectDocumentV2 {
  try { return validatedStudioSnapshot(input); }
  catch { throw new UnprocessableEntityException("INVALID_STUDIO_V2_DOCUMENT"); }
}
export function validatedTemplate(input: unknown, personalization: unknown) {
  try { return validatedTemplateVersion(input, personalization); }
  catch { throw new UnprocessableEntityException("INVALID_TEMPLATE_DOCUMENT_OR_CONTRACT"); }
}
export const staticAssets = new Set([
  "/images/eventiq-mobile/cover.webp",
  "/images/eventiq-mobile/landscape.webp",
  "/images/eventiq-mobile/bouquet.webp",
  "/images/eventiq-mobile/rings.webp",
  "/images/eventiq-mobile/shadows.webp",
  "/images/eventiq-mobile/venue.webp",
  "/images/monochrome-editorial/cover.webp",
  "/images/monochrome-editorial/landscape.webp",
  "/images/monochrome-editorial/bouquet.webp",
  "/images/monochrome-editorial/rings.webp",
  "/images/monochrome-editorial/shadows.webp",
  "/images/monochrome-editorial/venue.webp",
  "/images/riviera/couple.webp", "/images/riviera/fabric-left.webp",
  "/images/riviera/fabric-right.webp", "/images/riviera/flowers.webp",
  "/images/riviera/villa.webp",
]);
export async function verifyAssets(db: PrismaClient, workspaceId: string, document: ProjectDocumentV2) {
  const ids = [...new Set(Object.values(document.assets)
    .map(asset => asset.storageKey)
    .filter(key => key.startsWith("asset:"))
    .map(key => key.slice(6)))];
  if (ids.length && ids.some(id => !uuid.safeParse(id).success)) {
    throw new UnprocessableEntityException("INVALID_ASSET_REFERENCE");
  }
  const assets = ids.length ? await db.mediaAsset.findMany({
    where: {id: {in: ids}, workspaceId, status: "READY"},
    select: {id: true, workspaceId: true, status: true, mimeType: true, bytes: true, sha256: true},
  }) : [];
  try { assertReadyAssets(document, workspaceId, assets, staticAssets); }
  catch { throw new UnprocessableEntityException("ASSET_UNAVAILABLE_OR_UNTRUSTED"); }
  // Music widget references are distinct from the image-only asset library.
  const audioIds = [...new Set(Object.values(document.nodes).flatMap(node =>
    node.type === "widget" && node.block.kind === "music" && node.block.source.startsWith("asset:")
      ? [node.block.source.slice(6)] : []))];
  if (audioIds.length) {
    const ready = await db.mediaAsset.findMany({
      where: {id: {in: audioIds}, workspaceId, status: "READY", mimeType: "audio/mpeg"},
      select: {id: true},
    });
    if (ready.length !== audioIds.length) {
      throw new UnprocessableEntityException("MUSIC_ASSET_UNAVAILABLE_OR_UNTRUSTED");
    }
  }
}
