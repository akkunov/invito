import {randomUUID} from "node:crypto";
import {
  ConflictException, ForbiddenException, Inject, Injectable, NotFoundException,
  PayloadTooLargeException, ServiceUnavailableException, UnprocessableEntityException,
} from "@nestjs/common";
import {Prisma} from "../../generated/prisma/client.js";
import {PrismaService} from "../../database/prisma.service.js";
import {DocumentsAccessService, validUuid} from "../documents/documents-access.service.js";
import {MediaObjectNotFound, MediaObjectStore} from "./media-object-store.js";
import {
  MAX_PENDING_UPLOADS, MAX_WORKSPACE_BYTES, UPLOAD_TTL_MS, MediaContentError, digest,
  inspectMedia, maxBytesFor, objectExtension, type UploadMime,
} from "./media-policy.js";

export type StartUpload = {name: string; mimeType: UploadMime; bytes: number; sha256: string};
function responseAsset(asset: {
  id: string; name: string; mimeType: string; bytes: bigint; sha256: string;
  width: number | null; height: number | null; status: string;
}) {
  return {
    id: asset.id, storageKey: "asset:" + asset.id, name: asset.name,
    mimeType: asset.mimeType, sizeBytes: Number(asset.bytes), sha256: asset.sha256,
    pixelWidth: asset.width, pixelHeight: asset.height, status: asset.status,
  };
}

@Injectable()
export class MediaService {
  constructor(
    @Inject(PrismaService) private readonly db: PrismaService,
    @Inject(DocumentsAccessService) private readonly access: DocumentsAccessService,
    @Inject(MediaObjectStore) private readonly store: MediaObjectStore,
  ) {}

  async startUpload(userId: string, workspaceId: string, request: StartUpload) {
    await this.access.member(userId, workspaceId, "EDITOR");
    if (request.bytes > maxBytesFor(request.mimeType)) throw new PayloadTooLargeException("MEDIA_TOO_LARGE");
    const id = randomUUID();
    const stageKey = `staging/${workspaceId}/${id}`;
    // No presigned URL without valid private R2 credentials. The key is server-generated.
    const uploadUrl = await this.store.signUpload(stageKey, request.mimeType);
    try {
      await this.db.$transaction(async tx => {
        // Serializable transactions prevent competing quota reservations from both succeeding.
        await tx.mediaAsset.updateMany({
          where: {workspaceId, status: "PENDING", createdAt: {lt: new Date(Date.now() - UPLOAD_TTL_MS)}},
          data: {status: "REJECTED"},
        });
        const usage = await tx.mediaAsset.aggregate({
          where: {workspaceId, status: {in: ["PENDING", "READY"]}},
          _sum: {bytes: true}, _count: {_all: true},
        });
        const pending = await tx.mediaAsset.count({where: {workspaceId, status: "PENDING"}});
        if (pending >= MAX_PENDING_UPLOADS) throw new ConflictException("TOO_MANY_PENDING_UPLOADS");
        if ((usage._sum.bytes ?? 0n) + BigInt(request.bytes) > MAX_WORKSPACE_BYTES) {
          throw new PayloadTooLargeException("WORKSPACE_MEDIA_QUOTA");
        }
        const member = await tx.workspaceMember.findUnique({
          where: {workspaceId_userId: {workspaceId, userId}}, select: {role: true},
        });
        if (!member || member.role === "VIEWER") throw new ForbiddenException("NO_UPLOAD_PERMISSION");
        await tx.mediaAsset.create({
          data: {id, workspaceId, uploadedById: userId, storageKey: stageKey,
            name: request.name, mimeType: request.mimeType, bytes: BigInt(request.bytes),
            sha256: request.sha256, status: "PENDING"},
        });
      }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable});
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
        throw new ConflictException("RETRY_MEDIA_UPLOAD");
      }
      throw error;
    }
    return {id, storageKey: "asset:" + id, mimeType: request.mimeType,
      uploadUrl, expiresInSeconds: 180, headers: {"Content-Type": request.mimeType}};
  }

  private async reject(id: string, workspaceId: string, stageKey: string) {
    await this.db.mediaAsset.updateMany({
      where: {id, workspaceId, status: "PENDING"}, data: {status: "REJECTED"},
    });
    await this.store.removeStaged(stageKey).catch(() => undefined);
  }

  async completeUpload(userId: string, workspaceId: string, assetId: string) {
    await this.access.member(userId, workspaceId, "EDITOR");
    if (!validUuid(assetId)) throw new NotFoundException("MEDIA_NOT_FOUND");
    const asset = await this.db.mediaAsset.findFirst({
      where: {id: assetId, workspaceId, uploadedById: userId},
    });
    if (!asset) throw new NotFoundException("MEDIA_NOT_FOUND");
    if (asset.status === "READY") return responseAsset(asset);
    if (asset.status !== "PENDING") throw new ConflictException("MEDIA_NOT_PENDING");
    if (Date.now() - asset.createdAt.getTime() > UPLOAD_TTL_MS) {
      await this.reject(assetId, workspaceId, asset.storageKey);
      throw new ConflictException("UPLOAD_EXPIRED");
    }
    const mime = asset.mimeType as UploadMime;
    let bytes: Buffer;
    let contentType: string | null;
    try {
      ({bytes, contentType} = await this.store.readStaged(asset.storageKey, maxBytesFor(mime)));
    } catch (error) {
      if (error instanceof MediaObjectNotFound) throw new ConflictException("UPLOAD_NOT_FOUND");
      if (error instanceof RangeError) {
        await this.reject(assetId, workspaceId, asset.storageKey);
        throw new UnprocessableEntityException("INVALID_MEDIA_SIZE");
      }
      throw new ServiceUnavailableException("MEDIA_STORAGE_READ_FAILED");
    }
    if (bytes.length !== Number(asset.bytes) || digest(bytes) !== asset.sha256 ||
        contentType !== mime) {
      await this.reject(assetId, workspaceId, asset.storageKey);
      throw new UnprocessableEntityException("MEDIA_CONTENT_MISMATCH");
    }
    let details: Awaited<ReturnType<typeof inspectMedia>>;
    try { details = await inspectMedia(bytes, mime); }
    catch (error) {
      if (error instanceof MediaContentError) {
        await this.reject(assetId, workspaceId, asset.storageKey);
        throw new UnprocessableEntityException(error.message);
      }
      throw error;
    }
    // The presigned PUT can be replayed against 'staging', but never against this
    // immutable server-only final key. Only VERIFIED bytes are copied across.
    const verifiedKey = `verified/${workspaceId}/${assetId}/${asset.sha256}.${objectExtension(mime)}`;
    try { await this.store.putVerified(verifiedKey, bytes, mime); }
    catch { throw new ServiceUnavailableException("MEDIA_STORAGE_COMMIT_FAILED"); }

    const updated = await this.db.$transaction(async tx => {
      const changed = await tx.mediaAsset.updateMany({
        where: {id: assetId, workspaceId, uploadedById: userId, status: "PENDING"},
        data: {storageKey: verifiedKey, status: "READY", width: details.width, height: details.height},
      });
      if (changed.count !== 1) throw new ConflictException("MEDIA_ALREADY_FINALIZED");
      await tx.auditEvent.create({data: {workspaceId, actorId: userId, action: "media.verify",
        entity: "MediaAsset", entityId: assetId, metadata: {mimeType: mime, bytes: bytes.length}}});
      return tx.mediaAsset.findUniqueOrThrow({where: {id: assetId}});
    });
    await this.store.removeStaged(asset.storageKey).catch(() => undefined);
    return responseAsset(updated);
  }

  async list(userId: string, workspaceId: string, page: number, limit: number) {
    await this.access.member(userId, workspaceId, "VIEWER");
    const rows = await this.db.mediaAsset.findMany({
      where: {workspaceId, status: "READY"},
      orderBy: [{createdAt: "desc"}, {id: "asc"}],
      skip: (page - 1) * limit, take: limit + 1,
    });
    return {items: rows.slice(0, limit).map(responseAsset), nextPage: rows.length > limit ? page + 1 : null};
  }

  async readUrl(userId: string, workspaceId: string, assetId: string) {
    await this.access.member(userId, workspaceId, "VIEWER");
    if (!validUuid(assetId)) throw new NotFoundException("MEDIA_NOT_FOUND");
    const asset = await this.db.mediaAsset.findFirst({
      where: {id: assetId, workspaceId, status: "READY"},
      select: {storageKey: true, mimeType: true},
    });
    if (!asset) throw new NotFoundException("MEDIA_NOT_FOUND");
    const url = await this.store.signRead(asset.storageKey, asset.mimeType);
    return {url, expiresInSeconds: 60, mimeType: asset.mimeType};
  }
}
