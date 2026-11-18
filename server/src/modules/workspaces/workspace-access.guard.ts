import {CanActivate, ExecutionContext, Inject, Injectable, NotFoundException, ForbiddenException} from "@nestjs/common";
import {Reflector} from "@nestjs/core";
import {PrismaService} from "../../database/prisma.service.js";
import type {AuthenticatedRequest} from "../auth/auth.types.js";
import {WORKSPACE_ROLE_KEY, type WorkspaceRole} from "./workspace-role.decorator.js";

const rank: Record<WorkspaceRole, number> = {VIEWER: 0, EDITOR: 1, ADMIN: 2, OWNER: 3};

/**
 * Membership is fetched for the authenticated DB user, never from client claims.
 * A nonmember always gets 404 to avoid cross-tenant enumeration.
 */
@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const workspaceId = request.params.workspaceId;
    if (!workspaceId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(workspaceId)) throw new NotFoundException();
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {workspaceId_userId: {workspaceId, userId: request.user.id}},
    });
    if (!membership) throw new NotFoundException("WORKSPACE_NOT_FOUND");
    const required = this.reflector.getAllAndOverride<WorkspaceRole>(WORKSPACE_ROLE_KEY, [
      context.getHandler(), context.getClass(),
    ]) ?? "VIEWER";
    if (rank[membership.role] < rank[required]) throw new ForbiddenException("WORKSPACE_PERMISSION_DENIED");
    return true;
  }
}
