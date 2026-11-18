import "reflect-metadata";
import {test} from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import type {AddressInfo} from "node:net";
import {randomUUID} from "node:crypto";
import {NestFactory} from "@nestjs/core";
import {exportJWK, generateKeyPair, SignJWT} from "jose";
import {AppModule} from "../src/app.module.js";
import {PrismaService} from "../src/database/prisma.service.js";
import {createEmptyProjectV2} from "../../src/features/studio-v2/core/document.schema.ts";

test("Studio templates and projects: tenant boundaries, immutable snapshots and optimistic CAS", async t => {
  const {publicKey, privateKey} = await generateKeyPair("RS256");
  const jwk = {...await exportJWK(publicKey), kid: "studio-ci", alg: "RS256", use: "sig"};
  const server = createServer((_request, response) => {
    response.writeHead(200, {"content-type": "application/json"});
    response.end(JSON.stringify({keys: [jwk]}));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;
  const issuer = `http://127.0.0.1:${port}/`;
  process.env.AUTH_ISSUER = issuer;
  process.env.AUTH_AUDIENCE = "invito-documents-ci";
  process.env.AUTH_JWKS_URL = issuer + "jwks";
  process.env.AUTH_PROVIDER_ID = "oidc-studio";
  process.env.NODE_ENV = "test";
  const app = await NestFactory.create(AppModule, {logger: false});
  app.setGlobalPrefix("api/v1");
  await app.listen(0, "127.0.0.1");
  const base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/api/v1`;
  const db = app.get(PrismaService);
  const users: string[] = [];
  let workspaceId: string | undefined;
  t.after(async () => {
    try {
      if (workspaceId) {
        await db.publicationRelease.deleteMany({where: {publication: {workspaceId}}});
        await db.auditEvent.deleteMany({where: {workspaceId}});
        await db.projectRevision.deleteMany({where: {project: {workspaceId}}});
        await db.studioProject.deleteMany({where: {workspaceId}});
        await db.templateVersion.deleteMany({where: {template: {workspaceId}}});
        await db.template.deleteMany({where: {workspaceId}});
        await db.workspace.delete({where: {id: workspaceId}});
      }
      for (const id of users) await db.user.delete({where: {id}});
    } finally {
      await app.close();
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });

  const jwt = (sub: string) => new SignJWT({name: "Studio CI"})
    .setProtectedHeader({alg: "RS256", kid: "studio-ci"})
    .setIssuer(issuer).setAudience("invito-documents-ci")
    .setSubject(sub).setIssuedAt().setExpirationTime("5m").sign(privateKey);
  const ownerToken = await jwt("owner-" + randomUUID());
  const viewerToken = await jwt("viewer-" + randomUUID());
  const outsiderToken = await jwt("stranger-" + randomUUID());
  async function request(path: string, token: string, method = "GET", body?: unknown) {
    const response = await fetch(base + path, {
      method,
      headers: {authorization: "Bearer " + token, ...(body !== undefined ? {"content-type": "application/json"} : {})},
      ...(body !== undefined ? {body: JSON.stringify(body)} : {}),
    });
    let json: unknown = null;
    try { json = await response.json(); } catch {}
    return {status: response.status, json};
  }
  for (const token of [ownerToken, viewerToken, outsiderToken]) {
    const result = await request("/me", token);
    assert.equal(result.status, 200);
    users.push((result.json as {id: string}).id);
  }
  const ws = await request("/workspaces", ownerToken, "POST", {
    slug: "studio-" + randomUUID().slice(0, 12), name: "Studio CI",
  });
  assert.equal(ws.status, 201, JSON.stringify(ws.json));
  workspaceId = (ws.json as {id: string}).id;
  await db.workspaceMember.create({data: {workspaceId, userId: users[1]!, role: "VIEWER"}});

  const doc = createEmptyProjectV2("studio-" + randomUUID().slice(0, 8));
  const templateInput = {
    slug: "editorial", name: "Editorial", description: "CI template",
    category: "WEDDING", tags: ["minimal"], coverPageId: doc.pages[0]!.id, document: doc,
  };
  const tcreate = await request(`/workspaces/${workspaceId}/templates`, ownerToken, "POST", templateInput);
  assert.equal(tcreate.status, 201, JSON.stringify(tcreate.json));
  const templateId = (tcreate.json as {id: string}).id;
  assert.ok(templateId);
  const list = await request(`/workspaces/${workspaceId}/templates`, viewerToken);
  assert.equal(list.status, 200);
  const listed = (list.json as {items: Array<Record<string, unknown>>}).items;
  assert.equal(listed.length, 1);
  assert.equal("document" in listed[0]!, false, "list cannot leak JSONB");
  assert.equal((await request(`/workspaces/${workspaceId}/templates`, outsiderToken)).status, 404);
  assert.equal((await request(`/templates/${templateId}`, outsiderToken)).status, 404);

  const oldVersion = await request(`/templates/${templateId}/versions/1`, viewerToken);
  assert.equal(oldVersion.status, 200);
  assert.equal((oldVersion.json as {number: number}).number, 1);
  const secondDocument = {...structuredClone(doc), revision: 1, locale: "ky"};
  const denied = await request(`/templates/${templateId}/versions`, viewerToken, "POST", {
    expectedVersion: 1, note: "forbidden", document: secondDocument,
  });
  assert.equal(denied.status, 403);
  const version = await request(`/templates/${templateId}/versions`, ownerToken, "POST", {
    expectedVersion: 1, note: "second", document: secondDocument,
  });
  assert.equal(version.status, 201, JSON.stringify(version.json));
  assert.equal((version.json as {number: number}).number, 2);
  const staleVersion = await request(`/templates/${templateId}/versions`, ownerToken, "POST", {
    expectedVersion: 1, note: "stale", document: secondDocument,
  });
  assert.equal(staleVersion.status, 409);
  const firstAgain = await request(`/templates/${templateId}/versions/1`, ownerToken);
  assert.equal((firstAgain.json as {document: {locale: string}}).document.locale, "ru");

  const projectInput = {title: "Project", document: doc};
  const projectCreate = await request(`/workspaces/${workspaceId}/projects`, ownerToken, "POST", projectInput);
  assert.equal(projectCreate.status, 201, JSON.stringify(projectCreate.json));
  const projectId = (projectCreate.json as {id: string}).id;
  assert.equal((projectCreate.json as {latestRevision: number}).latestRevision, 1);
  const project = await request(`/projects/${projectId}`, viewerToken);
  assert.equal(project.status, 200);
  assert.equal((project.json as {revision: {number: number}}).revision.number, 1);
  assert.equal((await request(`/projects/${projectId}`, outsiderToken)).status, 404);
  assert.equal((await request(`/projects/${projectId}/revisions`, viewerToken, "PUT", {
    expectedRevision: 1, document: secondDocument,
  })).status, 403);
  const wrongId = await request(`/projects/${projectId}/revisions`, ownerToken, "PUT", {
    expectedRevision: 1, document: {...secondDocument, id: "other-project"},
  });
  assert.equal(wrongId.status, 422);
  const updated = await request(`/projects/${projectId}/revisions`, ownerToken, "PUT", {
    expectedRevision: 1, document: secondDocument,
  });
  assert.equal(updated.status, 200, JSON.stringify(updated.json));
  assert.equal((updated.json as {number: number}).number, 2);
  const stale = await request(`/projects/${projectId}/revisions`, ownerToken, "PUT", {
    expectedRevision: 1, document: secondDocument,
  });
  assert.equal(stale.status, 409);
  const [r1, r2] = await Promise.all([
    request(`/projects/${projectId}/revisions`, ownerToken, "PUT", {expectedRevision: 2, document: secondDocument}),
    request(`/projects/${projectId}/revisions`, ownerToken, "PUT", {expectedRevision: 2, document: secondDocument}),
  ]);
  assert.deepEqual([r1.status, r2.status].sort(), [200,409], "concurrent stale writes cannot overwrite");
  const original = await request(`/projects/${projectId}/revisions/1`, ownerToken);
  assert.equal((original.json as {document: {locale: string}}).document.locale, "ru");
  const projects = await request(`/workspaces/${workspaceId}/projects`, viewerToken);
  assert.equal(projects.status, 200);
  assert.equal((projects.json as {items: Array<Record<string, unknown>>}).items.length, 1);
  const auditCount = await db.auditEvent.count({where: {workspaceId}});
  assert.ok(auditCount >= 5);
  const hostileDoc = {...doc, assets: {"asset-1": {
    id: "asset-1", name: "bad", storageKey: "local:not-uploaded",
    mimeType: "image/png", sizeBytes: 100,
  }}};
  const untrusted = await request(`/workspaces/${workspaceId}/projects`, ownerToken, "POST", {
    title: "Unsafe", document: hostileDoc,
  });
  assert.equal(untrusted.status, 422, "browser-local image cannot be saved remotely");
});
