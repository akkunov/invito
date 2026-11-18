import {ConflictException, Inject, Injectable, NotFoundException} from "@nestjs/common";
import {PrismaService} from "../../database/prisma.service.js";

@Injectable()
export class WorkspacesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  listForUser(userId: string) {
    return this.prisma.workspaceMember.findMany({
      where: {userId},
      select: {
        role: true,
        joinedAt: true,
        workspace: {select: {id: true, name: true, slug: true, createdAt: true}},
      },
      orderBy: {joinedAt: "desc"},
    });
  }

  async create(userId: string, slug: string, name: string) {
    try {
      return await this.prisma.workspace.create({
        data: {slug, name, members: {create: {userId, role: "OWNER"}}},
        select: {id: true, slug: true, name: true, createdAt: true},
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        throw new ConflictException("WORKSPACE_SLUG_TAKEN");
      }
      throw error;
    }
  }

  async get(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: {id: workspaceId},
      select: {id: true, slug: true, name: true, createdAt: true, updatedAt: true},
    });
    if (!workspace) throw new NotFoundException("WORKSPACE_NOT_FOUND");
    return workspace;
  }

  updateName(workspaceId: string, name: string) {
    return this.prisma.workspace.update({
      where: {id: workspaceId},
      data: {name},
      select: {id: true, slug: true, name: true, updatedAt: true},
    });
  }
}
