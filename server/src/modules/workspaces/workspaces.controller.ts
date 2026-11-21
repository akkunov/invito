import {BadRequestException, Body, Controller, Get, Patch, Post, Req, Param, UseGuards, Inject} from "@nestjs/common";
import {z} from "zod";
import type {AuthenticatedRequest} from "../auth/auth.types.js";
import {WorkspaceAccessGuard} from "./workspace-access.guard.js";
import {MinimumWorkspaceRole} from "./workspace-role.decorator.js";
import {WorkspacesService} from "./workspaces.service.js";

export const createSchema = z.strictObject({
  slug: z.string().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(120),
});
export const renameSchema = z.strictObject({name: z.string().trim().min(1).max(120)});

function parse<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) throw new BadRequestException({code: "VALIDATION_FAILED", issues: result.error.issues});
  return result.data;
}

@Controller()
export class WorkspacesController {
  constructor(@Inject(WorkspacesService) private readonly service: WorkspacesService) {}

  @Get("me/workspaces")
  list(@Req() request: AuthenticatedRequest) {
    return this.service.listForUser(request.user.id);
  }

  @Post("workspaces")
  create(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const {slug, name} = parse(createSchema, body);
    return this.service.create(request.user.id, slug, name);
  }

  @Get("workspaces/:workspaceId")
  @UseGuards(WorkspaceAccessGuard)
  @MinimumWorkspaceRole("VIEWER")
  get(@Param("workspaceId") workspaceId: string) {
    return this.service.get(workspaceId);
  }

  @Patch("workspaces/:workspaceId")
  @UseGuards(WorkspaceAccessGuard)
  @MinimumWorkspaceRole("ADMIN")
  rename(@Param("workspaceId") workspaceId: string, @Body() body: unknown) {
    const {name} = parse(renameSchema, body);
    return this.service.updateName(workspaceId, name);
  }
}
