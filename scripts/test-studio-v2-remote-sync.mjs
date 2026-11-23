import assert from "node:assert/strict";
import {createEmptyProjectV2} from "../src/features/studio-v2/core/document.schema.ts";
import {createStudioRemoteClient, RemoteRequestError} from "../src/features/studio-v2/browser/remote-sync.ts";

const doc = createEmptyProjectV2("test-remote-sync");
const workspaceId = "00000000-0000-4000-8000-000000000001";
const id = "00000000-0000-4000-8000-000000000002";
let capturedAuthorization = "";
let calls = 0;
let mode = "success";
const api = createStudioRemoteClient({
  apiBaseUrl: "https://api.invito.test/api/v1",
  workspaceId,
  accessToken: async () => "temporary-JWT",
  fetcher: async (_url, init) => {
    capturedAuthorization = init?.headers?.Authorization ?? "";
    calls++;
    if (mode === "conflict") return new Response("", {status: 409});
    if (mode === "offline") throw new TypeError("network failed");
    if (mode === "assets") return new Response("", {status: 422});
    if (mode === "read") return Response.json({
      id, workspaceId, title: "Remote", latestRevision: 2,
      revision: {number: 2, document: doc, sha256: "a".repeat(64)},
    });
    return Response.json({id: "revision-id", number: 2, sha256: "b".repeat(64), createdAt: "2026-11-18T00:00:00Z"});
  },
});
const saved = await api.sync(id, 1, doc);
assert.equal(saved.kind, "synced");
assert.equal(saved.revision, 2);
assert.equal(capturedAuthorization, "Bearer temporary-JWT");
mode = "offline";
const offline = await api.sync(id, 1, doc);
assert.equal(offline.kind, "offline");
assert.deepEqual(offline.localDocument, doc);
mode = "assets";
const refused = await api.sync(id, 1, doc);
assert.equal(refused.kind, "rejected");
assert.equal(refused.reason, "assets");
mode = "conflict";
const conflictClient = createStudioRemoteClient({
  apiBaseUrl: "https://api.invito.test/api/v1", workspaceId,
  accessToken: async () => "temporary-JWT",
  fetcher: async (_url, init) => {
    if (init?.method === "PUT") return new Response("", {status: 409});
    return Response.json({
      id, workspaceId, title: "Server copy", latestRevision: 3,
      revision: {number: 3, document: doc, sha256: "c".repeat(64)},
    });
  },
});
const conflict = await conflictClient.sync(id, 1, doc);
assert.equal(conflict.kind, "conflict");
assert.equal(conflict.remoteProject.latestRevision, 3);
assert.deepEqual(conflict.localDocument, doc);
assert.ok(calls >= 3);
const noToken = createStudioRemoteClient({
  apiBaseUrl: "https://api.invito.test/api/v1", workspaceId, accessToken: async () => null,
  fetcher: async () => {throw new Error("No network expected");},
});
const denied = await noToken.sync(id, 1, doc);
assert.equal(denied.kind, "rejected");
assert.equal(denied.reason, "auth");
await assert.rejects(() => noToken.getProject(id), error => error instanceof RemoteRequestError && error.status === 401);
const unpublishedClient = createStudioRemoteClient({
  apiBaseUrl: "https://api.invito.test/api/v1", workspaceId,
  accessToken: async () => "temporary-JWT",
  fetcher: async () => new Response(null, {status: 200}),
});
assert.equal(await unpublishedClient.getPublication(id), null);

const publishedClient = createStudioRemoteClient({
  apiBaseUrl: "https://api.invito.test/api/v1", workspaceId,
  accessToken: async () => "temporary-JWT",
  fetcher: async () => Response.json({
    id: "00000000-0000-4000-8000-000000000003",
    slug: "my-invitation", status: "ACTIVE", latestRelease: 1,
  }),
});
assert.equal((await publishedClient.getPublication(id))?.slug, "my-invitation");
await assert.rejects(() => unpublishedClient.getProject(id), SyntaxError);
console.log("Studio publication transport: empty and populated responses passed");
console.log("Studio remote sync transport: success, conflict, offline and denied paths passed");
