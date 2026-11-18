import {
  ConflictException, Injectable, Inject, NotFoundException, UnprocessableEntityException,
} from "@nestjs/common";
import {Prisma} from "../../generated/prisma/client.js";
import {PrismaService} from "../../database/prisma.service.js";
import {DocumentsAccessService, validUuid} from "./documents-access.service.js";
import {
  validatedDocument, validatedTemplate, verifyAssets, snapshotHash,
} from "./documents-input.js";
import type {ProjectDocumentV2} from "../../../../src/features/studio-v2/core/document.schema.js";

const json = (document: unknown) => document as Prisma.InputJsonValue;
function conflict(error: unknown): never {
  if (error && typeof error === "object" && "code" in error
    && (error.code === "P2002" || error.code === "P2034")) {
    throw new ConflictException("VERSION_OR_UNIQUE_CONFLICT");
  }
  throw error;
}
function verifyCoverPage(doc: ProjectDocumentV2, coverPageId: string) {
  if (!doc.pages.some(page => page.id === coverPageId))
    throw new UnprocessableEntityException("COVER_PAGE_NOT_FOUND");
}

@Injectable()
export class StudioDocumentsService {
  constructor(
    @Inject(PrismaService) private readonly db: PrismaService,
    @Inject(DocumentsAccessService) private readonly access: DocumentsAccessService,
  ) {}

  async listTemplates(userId: string, workspaceId: string, page: number, limit: number) {
    await this.access.member(userId, workspaceId, "VIEWER");
    const items = await this.db.template.findMany({
      where: {workspaceId},
      select: {id: true, slug: true, publicSlug: true, name: true, description: true, category: true,
        tags: true, status: true, coverPageId: true, latestVersion: true, createdAt: true, updatedAt: true},
      orderBy: [{updatedAt: "desc"}, {id: "asc"}],
      skip: (page - 1) * limit, take: limit + 1,
    });
    return {items: items.slice(0, limit), nextPage: items.length > limit ? page + 1 : null};
  }

  async createTemplate(userId: string, workspaceId: string, data: {
    slug: string; name: string; description: string; category: "WEDDING"|"KYZ_UZATUU"|"BIRTHDAY"|"ANNIVERSARY"|"CORPORATE"|"OTHER";
    tags: string[]; coverPageId: string; document: unknown; personalization?: unknown;
  }) {
    await this.access.member(userId, workspaceId, "EDITOR");
    const validated = validatedTemplate(data.document, data.personalization);
    verifyCoverPage(validated.snapshot, data.coverPageId);
    await verifyAssets(this.db, workspaceId, validated.snapshot);
    try {
      return await this.db.$transaction(async tx => {
        const template = await tx.template.create({
          data: {
            workspaceId, createdById: userId, slug: data.slug, name: data.name,
            description: data.description, category: data.category, tags: data.tags,
            coverPageId: data.coverPageId, latestVersion: 1,
            versions: {create: {
              number: 1, document: json(validated.snapshot), sha256: validated.sha256,
              createdById: userId, note: "Initial snapshot",
              ...(validated.contract ? {personalization: json(validated.contract)} : {}),
            }},
          },
          select: {id: true, workspaceId: true, slug: true, name: true, latestVersion: true},
        });
        await tx.auditEvent.create({data: {
          workspaceId, actorId: userId, action: "template.create", entity: "Template", entityId: template.id,
        }});
        return template;
      });
    } catch (error) { return conflict(error); }
  }

  async getTemplate(userId: string, id: string) {
    const scope = await this.access.template(userId, id, "VIEWER");
    const template = await this.db.template.findFirst({
      where: {id, workspaceId: scope.workspaceId},
      select: {id: true, workspaceId: true, slug: true, name: true, description: true,
        category: true, tags: true, coverPageId: true, status: true, latestVersion: true,
        createdAt: true, updatedAt: true},
    });
    if (!template) throw new NotFoundException();
    return template;
  }

  async getTemplateVersion(userId: string, id: string, number: number) {
    const scope = await this.access.template(userId, id, "VIEWER");
    const version = await this.db.templateVersion.findFirst({
      where: {templateId: id, number, template: {workspaceId: scope.workspaceId}},
      select: {id: true, number: true, document: true, personalization: true, sha256: true, note: true, createdAt: true},
    });
    if (!version) throw new NotFoundException("TEMPLATE_VERSION_NOT_FOUND");
    return version;
  }

  async appendTemplateVersion(userId: string, id: string, input: {
    expectedVersion: number; note: string; document: unknown; personalization?: unknown;
  }) {
    const scope = await this.access.template(userId, id, "EDITOR");
    const validated = validatedTemplate(input.document, input.personalization);
    await verifyAssets(this.db, scope.workspaceId, validated.snapshot);
    try {
      return await this.db.$transaction(async tx => {
        const current = await tx.template.findFirst({
          where: {id, workspaceId: scope.workspaceId},
          select: {coverPageId: true},
        });
        if (!current) throw new NotFoundException();
        verifyCoverPage(validated.snapshot, current.coverPageId);
        const updated = await tx.template.updateMany({
          where: {id, workspaceId: scope.workspaceId, latestVersion: input.expectedVersion},
          data: {latestVersion: {increment: 1}, status: "DRAFT"},
        });
        if (updated.count !== 1) throw new ConflictException("VERSION_CONFLICT");
        const version = await tx.templateVersion.create({
          data: {
            templateId: id, number: input.expectedVersion + 1, note: input.note,
            document: json(validated.snapshot), sha256: validated.sha256, createdById: userId,
            ...(validated.contract ? {personalization: json(validated.contract)} : {}),
          },
          select: {id: true, number: true, sha256: true, createdAt: true},
        });
        await tx.auditEvent.create({data: {
          workspaceId: scope.workspaceId, actorId: userId, action: "template.version.append",
          entity: "TemplateVersion", entityId: version.id,
          metadata: {number: version.number},
        }});
        return version;
      }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable});
    } catch (error) { return conflict(error); }
  }

  async listProjects(userId: string, workspaceId: string, page: number, limit: number) {
    await this.access.member(userId, workspaceId, "VIEWER");
    const items = await this.db.studioProject.findMany({
      where: {workspaceId},
      select: {id: true, title: true, status: true, latestRevision: true, sourceTemplateVersionId: true,
        createdAt: true, updatedAt: true},
      orderBy: [{updatedAt: "desc"}, {id: "asc"}],
      skip: (page - 1) * limit, take: limit + 1,
    });
    return {items: items.slice(0, limit), nextPage: items.length > limit ? page + 1 : null};
  }

  async createProject(userId: string, workspaceId: string, input: {
    title: string; sourceTemplateVersionId?: string; document: unknown;
  }) {
    await this.access.member(userId, workspaceId, "EDITOR");
    const document = validatedDocument(input.document);
    await verifyAssets(this.db, workspaceId, document);
    if (input.sourceTemplateVersionId) {
      const source = await this.db.templateVersion.findFirst({
        where: {id: input.sourceTemplateVersionId, template: {workspaceId}},
        select: {id: true},
      });
      if (!source) throw new NotFoundException("SOURCE_TEMPLATE_NOT_FOUND");
    }
    const sha256 = snapshotHash(document);
    try {
      return await this.db.$transaction(async tx => {
        const project = await tx.studioProject.create({
          data: {
            title: input.title, workspaceId, latestRevision: 1,
            ...(input.sourceTemplateVersionId ? {sourceTemplateVersionId: input.sourceTemplateVersionId} : {}),
            revisions: {create: {number: 1, document: json(document), sha256, createdById: userId}},
          },
          select: {id: true, title: true, workspaceId: true, latestRevision: true, createdAt: true},
        });
        await tx.auditEvent.create({data: {
          workspaceId, actorId: userId, action: "project.create", entity: "StudioProject", entityId: project.id,
        }});
        return project;
      });
    } catch (error) { return conflict(error); }
  }

  async getProject(userId: string, id: string) {
    const scope = await this.access.project(userId, id, "VIEWER");
    const project = await this.db.studioProject.findFirst({
      where: {id, workspaceId: scope.workspaceId},
      select: {
        id: true, workspaceId: true, title: true, latestRevision: true, status: true, sourceTemplateVersionId: true,
        createdAt: true, updatedAt: true,
        revisions: {where: {number: scope.latestRevision}, take: 1,
          select: {id: true, number: true, document: true, sha256: true, createdAt: true}},
      },
    });
    if (!project) throw new NotFoundException("PROJECT_NOT_FOUND");
    const {revisions, ...metadata} = project;
    return {...metadata, revision: revisions[0] ?? null};
  }

  async getProjectRevision(userId: string, id: string, number: number) {
    const scope = await this.access.project(userId, id, "VIEWER");
    const revision = await this.db.projectRevision.findFirst({
      where: {projectId: id, number, project: {workspaceId: scope.workspaceId}},
      select: {id: true, number: true, document: true, sha256: true, createdAt: true},
    });
    if (!revision) throw new NotFoundException("REVISION_NOT_FOUND");
    return revision;
  }

  async appendProjectRevision(userId: string, id: string, input: {expectedRevision: number; document: unknown}) {
    const scope = await this.access.project(userId, id, "EDITOR");
    const document = validatedDocument(input.document);
    await verifyAssets(this.db, scope.workspaceId, document);
    const sha256 = snapshotHash(document);
    try {
      return await this.db.$transaction(async tx => {
        const previous = await tx.projectRevision.findFirst({
          where: {projectId: id, number: input.expectedRevision},
          select: {document: true},
        });
        if (!previous) throw new ConflictException("REVISION_CONFLICT");
        const originalId = (previous.document as {id?: unknown}).id;
        if (document.id !== originalId) throw new UnprocessableEntityException("DOCUMENT_ID_MISMATCH");
        const updated = await tx.studioProject.updateMany({
          where: {id, workspaceId: scope.workspaceId, latestRevision: input.expectedRevision},
          data: {latestRevision: {increment: 1}},
        });
        if (updated.count !== 1) throw new ConflictException("REVISION_CONFLICT");
        const revision = await tx.projectRevision.create({
          data: {projectId: id, number: input.expectedRevision + 1, document: json(document), sha256, createdById: userId},
          select: {id: true, number: true, sha256: true, createdAt: true},
        });
        await tx.auditEvent.create({data: {
          workspaceId: scope.workspaceId, actorId: userId, action: "project.revision.append",
          entity: "ProjectRevision", entityId: revision.id,
          metadata: {number: revision.number},
        }});
        return revision;
      }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable});
    } catch (error) { return conflict(error); }
  }
}
