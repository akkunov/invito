/**
 * #29.3 Remote Studio transport. No automatic upload or replacement of IndexedDB data.
 * The caller owns the short-lived OIDC access token and may keep it in memory only.
 * Network failures, revision conflicts and missing assets never modify local drafts.
 */
import {parseProjectV2, type ProjectDocumentV2} from "../core/document.schema.ts";

export type RemoteSyncSettings = {
  apiBaseUrl: string;
  workspaceId: string;
  accessToken: () => Promise<string | null>;
  fetcher?: typeof fetch;
};

export type RemoteProject = {
  id: string;
  workspaceId: string;
  title: string;
  latestRevision: number;
  revision: {number: number; document: ProjectDocumentV2; sha256: string} | null;
};

export type RemoteRevision = {id: string; number: number; sha256: string; createdAt: string};
export type SyncResult =
  | {kind: "synced"; revision: number; hash: string}
  | {kind: "conflict"; localDocument: ProjectDocumentV2; expectedRevision: number; remoteProject: RemoteProject}
  | {kind: "offline"; localDocument: ProjectDocumentV2}
  | {kind: "rejected"; reason: "auth" | "assets" | "other"; message: string};

export class RemoteRequestError extends Error {
  constructor(readonly status: number, message: string) {super(message); this.name = "RemoteRequestError";}
}
function safeBaseUrl(base: string): string {
  const url = new URL(base);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost","127.0.0.1"].includes(url.hostname))) {
    throw new Error("REMOTE_API_REQUIRES_HTTPS");
  }
  if (url.search || url.hash || url.username || url.password) throw new Error("INVALID_REMOTE_API_URL");
  return url.href.replace(/\/$/, "");
}
function parseProject(data: unknown): RemoteProject {
  if (!data || typeof data !== "object") throw new Error("INVALID_REMOTE_RESPONSE");
  const p = data as Record<string, unknown>;
  if (typeof p.id !== "string" || typeof p.workspaceId !== "string" ||
    typeof p.title !== "string" || !Number.isSafeInteger(p.latestRevision) ||
    !p.revision || typeof p.revision !== "object") throw new Error("INVALID_REMOTE_RESPONSE");
  const rev = p.revision as Record<string, unknown>;
  if (typeof rev.number !== "number" || rev.number !== p.latestRevision || typeof rev.sha256 !== "string") {
    throw new Error("INVALID_REMOTE_RESPONSE");
  }
  return {
    id: p.id, workspaceId: p.workspaceId, title: p.title, latestRevision: p.latestRevision as number,
    revision: {number: rev.number, sha256: rev.sha256, document: parseProjectV2(rev.document)},
  };
}
export function createStudioRemoteClient(settings: RemoteSyncSettings) {
  const base = safeBaseUrl(settings.apiBaseUrl);
  const fetcher = settings.fetcher ?? fetch;
  const workspaceId = settings.workspaceId;
  if (!/^[a-f\d-]{36}$/i.test(workspaceId)) throw new Error("INVALID_WORKSPACE_ID");

  async function send<T>(path: string, method = "GET", data?: unknown): Promise<T> {
    const token = await settings.accessToken();
    if (!token) throw new RemoteRequestError(401, "SIGN_IN_REQUIRED");
    const response = await fetcher(base + path, {
      method, headers: {
        "Authorization": "Bearer " + token,
        ...(data === undefined ? {} : {"Content-Type": "application/json"}),
      }, ...(data === undefined ? {} : {body: JSON.stringify(data)}),
      credentials: "omit", cache: "no-store",
    });
    if (!response.ok) {
      throw new RemoteRequestError(response.status, "REMOTE_HTTP_" + response.status);
    }
    return await response.json() as T;
  }
  async function getProject(id: string): Promise<RemoteProject> {
    return parseProject(await send<unknown>("/projects/" + encodeURIComponent(id)));
  }
  return {
    async listProjects(page = 1) {
      return send<{items: Array<{id: string; title: string; latestRevision: number}>; nextPage: number | null}>(
        "/workspaces/" + workspaceId + "/projects?page=" + page,
      );
    },
    async createProject(title: string, document: ProjectDocumentV2) {
      const snapshot = parseProjectV2(document);
      const created = await send<{id: string; latestRevision: number}>(
        "/workspaces/" + workspaceId + "/projects", "POST", {title, document: snapshot},
      );
      if (typeof created.id !== "string" || created.latestRevision !== 1) {
        throw new Error("INVALID_REMOTE_RESPONSE");
      }
      return created;
    },
    getProject,
    async sync(remoteProjectId: string, expectedRevision: number, localDocument: ProjectDocumentV2): Promise<SyncResult> {
      // Validate before network; never coerce a broken local draft.
      const local = parseProjectV2(localDocument);
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
        throw new Error("INVALID_EXPECTED_REVISION");
      }
      try {
        const revision = await send<RemoteRevision>(
          "/projects/" + encodeURIComponent(remoteProjectId) + "/revisions",
          "PUT", {expectedRevision, document: local},
        );
        if (revision.number !== expectedRevision + 1 || !/^[a-f0-9]{64}$/i.test(revision.sha256)) {
          throw new Error("INVALID_REMOTE_RESPONSE");
        }
        return {kind: "synced", revision: revision.number, hash: revision.sha256};
      } catch (error) {
        if (error instanceof RemoteRequestError && error.status === 409) {
          // No silent last-write-wins: explicitly present local vs server copy.
          return {
            kind: "conflict", localDocument: local, expectedRevision,
            remoteProject: await getProject(remoteProjectId),
          };
        }
        if (error instanceof RemoteRequestError && (error.status === 401 || error.status === 403)) {
          return {kind: "rejected", reason: "auth", message: "Нужна авторизация или доступ к рабочему пространству"};
        }
        if (error instanceof RemoteRequestError && error.status === 422) {
          return {kind: "rejected", reason: "assets", message: "Сначала загрузите локальные изображения в облачное хранилище"};
        }
        if (error instanceof TypeError) return {kind: "offline", localDocument: local};
        throw error;
      }
    },
  };
}
