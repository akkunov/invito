import {ForbiddenException, Injectable, Inject, NotFoundException} from "@nestjs/common";
import {PrismaService} from "../../database/prisma.service.js";
import type {WorkspaceRole} from "../workspaces/workspace-role.decorator.js";

const level: Record<WorkspaceRole, number> = {VIEWER: 0, EDITOR: 1, ADMIN: 2, OWNER: 3};
export function validUuid(id: string): boolean {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
}

/** All private resources are authorized through a trusted DB membership. */
@Injectable()
export class DocumentsAccessService {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async member(userId: string, workspaceId: string, minimum: WorkspaceRole) {
    if (!validUuid(workspaceId)) throw new NotFoundException("NOT_FOUND");
    const membership = await this.db.workspaceMember.findUnique({
      where: {workspaceId_userId: {userId, workspaceId}},
      select: {role: true},
    });
    if (!membership) throw new NotFoundException("NOT_FOUND");
    if (level[membership.role] < level[minimum]) throw new ForbiddenException("INSUFFICIENT_ROLE");
  }

  async template(userId: string, id: string, minimum: WorkspaceRole) {
    if (!validUuid(id)) throw new NotFoundException("NOT_FOUND");
    const template = await this.db.template.findUnique({
      where: {id},
      select: {id: true, workspaceId: true, latestVersion: true},
    });
    if (!template) throw new NotFoundException("NOT_FOUND");
    await this.member(userId, template.workspaceId, minimum);
    return template;
  }

  async project(userId: string, id: string, minimum: WorkspaceRole) {
    if (!validUuid(id)) throw new NotFoundException("NOT_FOUND");
    const project = await this.db.studioProject.findUnique({
      where: {id},
      select: {id: true, workspaceId: true, latestRevision: true},
    });
    if (!project) throw new NotFoundException("NOT_FOUND");
    await this.member(userId, project.workspaceId, minimum);
    return project;
  }
}
