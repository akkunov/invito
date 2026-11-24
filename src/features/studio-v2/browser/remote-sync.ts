/**
 * #29.3 Remote Studio transport. No automatic upload or replacement of IndexedDB data.
 * The caller supplies a short-lived, verified Supabase Auth access token. This module never persists it.
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
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "RemoteRequestError";
  }
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
    // NestJS/Express sends an empty 200 body when the controller returns null.
    // Only an absent publication is expected to have an empty successful response.
    if (method === "GET" && /^\/projects\/[^/]+\/publication$/.test(path)) {
      const body = await response.text();
      return (body.trim() ? JSON.parse(body) : null) as T;
    }
    return await response.json() as T;
  }
  async function getProject(id: string): Promise<RemoteProject> {
    const project = parseProject(await send<unknown>("/projects/" + encodeURIComponent(id)));
    if (project.workspaceId !== workspaceId) throw new Error("REMOTE_WORKSPACE_MISMATCH");
    return project;
  }
  return {
    async listTemplates(page = 1) {
      return send<{items: Array<{id:string;slug:string;name:string;status:string;latestVersion:number}>;nextPage:number|null}>(
        "/workspaces/"+workspaceId+"/templates?page="+page+"&limit=24");
    },
    async getTemplateVersion(id:string,number:number) {
      if(!Number.isSafeInteger(number)||number<1)throw new Error("INVALID_TEMPLATE_VERSION");
      const path="/templates/"+encodeURIComponent(id);
      const template=await send<{id:string;workspaceId:string;latestVersion:number}>(path);
      if(template.id!==id||template.workspaceId!==workspaceId)throw new Error("REMOTE_WORKSPACE_MISMATCH");
      const version=await send<{number:number;document:unknown}>(path+"/versions/"+number);
      if(version.number!==number)throw new Error("INVALID_TEMPLATE_VERSION");
      return {...version,document:parseProjectV2(version.document)};
    },
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
    /** Stable release IDs are server generated and never inferred from the document UUID. */
    async getProjectRevision(id:string,number:number) {
      if(!Number.isSafeInteger(number)||number<1)throw new Error("INVALID_REVISION");
      const result=await send<{
        id:string;number:number;document:unknown;sha256:string;
      }>("/projects/"+encodeURIComponent(id)+"/revisions/"+number);
      if(!/^[a-f0-9-]{36}$/i.test(result.id)||result.number!==number||
        !/^[a-f0-9]{64}$/i.test(result.sha256))throw new Error("INVALID_REMOTE_REVISION");
      return {...result,document:parseProjectV2(result.document)};
    },
    async getPublication(id:string) {
      return send<null|{id:string;slug:string;status:"ACTIVE"|"UNPUBLISHED";latestRelease:number}>(
        "/projects/"+encodeURIComponent(id)+"/publication");
    },
    async publishProject(id:string,input:{
      slug:string;projectRevisionId:string;expectedRelease:number;idempotencyKey:string;
    }) {
      const result=await send<{id:string;slug:string;status:string;latestRelease:number}>(
        "/projects/"+encodeURIComponent(id)+"/publish","POST",input);
      if(result.slug!==input.slug||result.status!=="ACTIVE"||
        result.latestRelease!==input.expectedRelease+1)throw new Error("INVALID_PUBLICATION_RESULT");
      return result;
    },
    async unpublishProject(id:string,expectedRelease:number) {
      const result=await send<{id:string;status:string;latestRelease:number}>(
        "/projects/"+encodeURIComponent(id)+"/unpublish","POST",{expectedRelease});
      if(result.status!=="UNPUBLISHED"||result.latestRelease!==expectedRelease){
        throw new Error("INVALID_UNPUBLISH_RESULT");
      }
      return result;
    },
    async listRsvp(id:string,page=1) {
      return send<{items:Array<{
        id:string;guestName:string;nodeId:string;attendance:"YES"|"NO"|"MAYBE";
        guestCount:number;message:string|null;createdAt:string;
      }>;nextPage:number|null}>("/projects/"+encodeURIComponent(id)+"/rsvp?page="+page);
    },
    async rsvpSummary(id:string) {
      return send<{responses:number;attending:number;declined:number}>(
        "/projects/"+encodeURIComponent(id)+"/rsvp/summary");
    },
    /** Stage in the user's private R2 workspace, verify server-side, and receive an asset:UUID. */
    async uploadMedia(name: string, blob: Blob) {
      if (!blob.size || blob.size > 20 * 1024 * 1024) throw new Error("MEDIA_TOO_LARGE");
      const mime = blob.type;
      if (!["image/png","image/jpeg","image/webp","audio/mpeg"].includes(mime)) {
        throw new Error("UNSUPPORTED_MEDIA_MIME");
      }
      const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())))
        .map(b=>b.toString(16).padStart(2,"0")).join("");
      const ticket = await send<{
        id: string; storageKey: string; uploadUrl: string;
        headers: Record<string,string>; expiresInSeconds: number;
      }>("/workspaces/" + workspaceId + "/media/uploads", "POST",
        {name, mimeType: mime, bytes: blob.size, sha256});
      const uploadEndpoint = new URL(ticket.uploadUrl);
      // A compromised/misconfigured API response must never send user files to arbitrary hosts.
      if (uploadEndpoint.protocol !== "https:" ||
          !uploadEndpoint.hostname.endsWith(".r2.cloudflarestorage.com") ||
          ticket.headers?.["Content-Type"] !== mime) {
        throw new Error("UNTRUSTED_SIGNED_UPLOAD_URL");
      }
      const put = await fetcher(uploadEndpoint.toString(), {
        method: "PUT", headers: ticket.headers, body: blob,
        cache: "no-store", credentials: "omit", redirect: "error",
      });
      if (!put.ok) throw new RemoteRequestError(put.status, "MEDIA_UPLOAD_FAILED");
      const verified = await send<{
        id: string; storageKey: string; name: string; mimeType: string;
        sizeBytes: number; sha256: string; pixelWidth: number | null;
        pixelHeight: number | null; status: string;
      }>("/workspaces/" + workspaceId + "/media/" + encodeURIComponent(ticket.id) + "/complete", "POST");
      if (verified.id !== ticket.id || verified.storageKey !== "asset:" + ticket.id ||
          verified.sha256 !== sha256 || verified.sizeBytes !== blob.size ||
          verified.mimeType !== mime || verified.status !== "READY") {
        throw new Error("INVALID_VERIFIED_MEDIA_RESPONSE");
      }
      return verified;
    },
    async getMediaReadUrl(assetId: string) {
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(assetId)) {
        throw new Error("INVALID_MEDIA_ASSET_ID");
      }
      const result = await send<{url: string; expiresInSeconds: number; mimeType: string}>(
        "/workspaces/" + workspaceId + "/media/" + encodeURIComponent(assetId) + "/read-url");
      const url = new URL(result.url);
      if (url.protocol !== "https:" || !url.hostname.endsWith(".r2.cloudflarestorage.com") ||
          result.expiresInSeconds > (result.mimeType === "audio/mpeg" ? 1200 : 60) || result.expiresInSeconds < 1) {
        throw new Error("UNTRUSTED_MEDIA_READ_URL");
      }
      return result;
    },
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
