import {Body, Controller, Get, Header, Inject, Param, Post, Query, Req} from "@nestjs/common";
import {z} from "zod";
import type {AuthenticatedRequest} from "../auth/auth.types.js";
import {MediaService} from "./media.service.js";
import {UPLOAD_MIMES} from "./media-policy.js";
import {parseInput, pagingInput} from "../documents/documents-input.js";

const startUploadInput = z.strictObject({
  name: z.string().trim().min(1).max(200).refine(v => !/[\\/<>\u0000-\u001f]/.test(v)),
  mimeType: z.enum(UPLOAD_MIMES),
  bytes: z.number().int().positive().safe(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
@Controller("workspaces/:workspaceId/media")
export class MediaController {
  constructor(@Inject(MediaService) private readonly service: MediaService) {}

  @Post("uploads")
  @Header("Cache-Control", "no-store")
  initiate(@Req() req: AuthenticatedRequest, @Param("workspaceId") workspaceId: string, @Body() body: unknown) {
    return this.service.startUpload(req.user.id, workspaceId, parseInput(startUploadInput, body));
  }

  @Post(":assetId/complete")
  @Header("Cache-Control", "no-store")
  finalize(@Req() req: AuthenticatedRequest, @Param("workspaceId") workspaceId: string,
    @Param("assetId") assetId: string) {
    return this.service.completeUpload(req.user.id, workspaceId, assetId);
  }

  @Get()
  @Header("Cache-Control", "no-store")
  list(@Req() req: AuthenticatedRequest, @Param("workspaceId") workspaceId: string, @Query() query: unknown) {
    const {page, limit} = parseInput(pagingInput, query);
    return this.service.list(req.user.id, workspaceId, page, limit);
  }

  @Get(":assetId/read-url")
  @Header("Cache-Control", "no-store")
  read(@Req() req: AuthenticatedRequest, @Param("workspaceId") workspaceId: string,
    @Param("assetId") assetId: string) {
    return this.service.readUrl(req.user.id, workspaceId, assetId);
  }
}
