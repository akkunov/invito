import {Body, Controller, Get, Inject, Param, Post, Put, Query, Req} from "@nestjs/common";
import type {AuthenticatedRequest} from "../auth/auth.types.js";
import {StudioDocumentsService} from "./documents.service.js";
import {parseInput, createTemplateInput, createVersionInput, createProjectInput,
  createRevisionInput, pagingInput} from "./documents-input.js";
import {NotFoundException} from "@nestjs/common";

function versionNumber(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) throw new NotFoundException();
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new NotFoundException();
  return number;
}

@Controller()
export class DocumentsController {
  constructor(@Inject(StudioDocumentsService) private readonly service: StudioDocumentsService) {}

  @Get("workspaces/:workspaceId/templates")
  listTemplates(@Req() req: AuthenticatedRequest, @Param("workspaceId") workspaceId: string, @Query() query: unknown) {
    const {page, limit} = parseInput(pagingInput, query);
    return this.service.listTemplates(req.user.id, workspaceId, page, limit);
  }

  @Post("workspaces/:workspaceId/templates")
  createTemplate(@Req() req: AuthenticatedRequest, @Param("workspaceId") workspaceId: string, @Body() body: unknown) {
    return this.service.createTemplate(req.user.id, workspaceId, parseInput(createTemplateInput, body));
  }

  @Get("templates/:id")
  getTemplate(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.getTemplate(req.user.id, id);
  }

  @Get("templates/:id/versions/:number")
  getTemplateVersion(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Param("number") n: string) {
    return this.service.getTemplateVersion(req.user.id, id, versionNumber(n));
  }

  @Post("templates/:id/versions")
  appendTemplateVersion(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: unknown) {
    return this.service.appendTemplateVersion(req.user.id, id, parseInput(createVersionInput, body));
  }

  @Get("workspaces/:workspaceId/projects")
  listProjects(@Req() req: AuthenticatedRequest, @Param("workspaceId") workspaceId: string, @Query() query: unknown) {
    const {page, limit} = parseInput(pagingInput, query);
    return this.service.listProjects(req.user.id, workspaceId, page, limit);
  }

  @Post("workspaces/:workspaceId/projects")
  createProject(@Req() req: AuthenticatedRequest, @Param("workspaceId") workspaceId: string, @Body() body: unknown) {
    return this.service.createProject(req.user.id, workspaceId, parseInput(createProjectInput, body));
  }

  @Get("projects/:id")
  getProject(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.getProject(req.user.id, id);
  }

  @Get("projects/:id/revisions/:number")
  getProjectRevision(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Param("number") n: string) {
    return this.service.getProjectRevision(req.user.id, id, versionNumber(n));
  }

  @Put("projects/:id/revisions")
  appendProjectRevision(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: unknown) {
    return this.service.appendProjectRevision(req.user.id, id, parseInput(createRevisionInput, body));
  }
}
