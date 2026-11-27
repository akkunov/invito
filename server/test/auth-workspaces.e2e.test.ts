import "reflect-metadata";
import {createServer} from "node:http";
import type {AddressInfo} from "node:net";
import {randomUUID} from "node:crypto";
import {test} from "node:test";
import assert from "node:assert/strict";
import {NestFactory} from "@nestjs/core";
import {exportJWK, generateKeyPair, SignJWT} from "jose";
import {AppModule} from "../src/app.module.js";
import {PrismaService} from "../src/database/prisma.service.js";

test("POSTGRES integration: JWT, identity and workspace boundaries", async t => {
  assert.ok(process.env.DATABASE_URL, "Use a disposable PostgreSQL database for integration tests");
  assert.ok(process.env.DIRECT_DATABASE_URL, "Migration URL must point to the disposable database");

  const {publicKey, privateKey} = await generateKeyPair("RS256");
  const publicJwk = await exportJWK(publicKey);
  const jwk = {...publicJwk, kid: "invito-ci-key", alg: "RS256", use: "sig"};
  const keysServer = createServer((_request, response) => {
    response.writeHead(200, {"Content-Type": "application/json"});
    response.end(JSON.stringify({keys: [jwk]}));
  });
  await new Promise<void>(resolve => keysServer.listen(0, "127.0.0.1", resolve));
  const keyPort = (keysServer.address() as AddressInfo).port;
  const issuer = `http://127.0.0.1:${keyPort}/`;
  process.env.AUTH_ISSUER = issuer;
  process.env.AUTH_AUDIENCE = "invito-api-integration";
  process.env.AUTH_JWKS_URL = issuer + "jwks";
  process.env.AUTH_PROVIDER_ID = "oidc-ci";
  process.env.NODE_ENV = "test";

  const app = await NestFactory.create(AppModule, {logger: false});
  app.setGlobalPrefix("api/v1");
  await app.listen(0, "127.0.0.1");
  const baseUrl = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/api/v1`;
  const prisma = app.get(PrismaService);
  const createdUserIds: string[] = [];
  let workspaceId: string | undefined;

  t.after(async () => {
    try {
      if (workspaceId) await prisma.workspace.delete({where: {id: workspaceId}});
      for (const id of createdUserIds) {
        await prisma.user.delete({where: {id}});
      }
    } finally {
      await app.close();
      await new Promise<void>((resolve, reject) => keysServer.close(error => error ? reject(error) : resolve()));
    }
  });

  const jwt = async (subject: string, extra: Record<string, unknown> = {}, expiresIn = "5m") =>
    new SignJWT({name: "Test Account", ...extra})
      .setProtectedHeader({alg: "RS256", kid: "invito-ci-key"})
      .setIssuer(issuer).setAudience("invito-api-integration")
      .setSubject(subject).setIssuedAt().setExpirationTime(expiresIn).sign(privateKey);

  const subjectA = "owner-" + randomUUID();
  const subjectB = "viewer-" + randomUUID();
  const tokenA = await jwt(subjectA, {email: "owner-test@example.net", email_verified: false});
  const tokenB = await jwt(subjectB);
  const request = (path: string, token?: string, options: {method?: string; body?: unknown; headers?: Record<string, string>} = {}) =>
    fetch(baseUrl + path, {
      method: options.method ?? "GET",
      headers: {
        ...(token ? {authorization: `Bearer ${token}`} : {}),
        ...(options.body !== undefined ? {"content-type": "application/json"} : {}),
        ...options.headers,
      },
      ...(options.body !== undefined ? {body: JSON.stringify(options.body)} : {}),
    });

  assert.equal((await request("/health")).status, 200, "public liveness endpoint");
  assert.equal((await request("/health/ready")).status, 200, "real PostgreSQL readiness");
  assert.equal((await request("/me")).status, 401, "reject anonymous private API");
  assert.equal((await request("/me", "not.a.real.jwt")).status, 401, "reject invalid JWT");

  const expired = await jwt(subjectA, {}, "-1m");
  assert.equal((await request("/me", expired)).status, 401, "reject an expired token despite valid signature");
  assert.equal((await request("/customer/account/overview", expired)).status, 401, "protect customer routes when the session expires");

  const ownerResponse = await request("/me", tokenA);
  assert.equal(ownerResponse.status, 200);
  const owner = await ownerResponse.json() as {id: string; email: string | null};
  createdUserIds.push(owner.id);
  assert.equal(owner.email, null, "unverified email is never trusted");

  const viewerResponse = await request("/me", tokenB);
  assert.equal(viewerResponse.status, 200);
  const viewer = await viewerResponse.json() as {id: string};
  createdUserIds.push(viewer.id);

  const slug = "e2e-" + randomUUID().slice(0, 12);
  const create = await request("/workspaces", tokenA, {method: "POST", body: {slug, name: "CI Workspace"}});
  const createBody = await create.json() as {id?: string; slug?: string; message?: string};
  assert.equal(create.status, 201, JSON.stringify(createBody));
  const workspace = createBody as {id: string; slug: string};
  workspaceId = workspace.id;

  const ownerMembership = await prisma.workspaceMember.findUnique({
    where: {workspaceId_userId: {workspaceId, userId: owner.id}},
  });
  assert.equal(ownerMembership?.role, "OWNER", "creator becomes OWNER via DB transaction");

  assert.equal((await request(`/workspaces/${workspaceId}`, tokenB, {
    headers: {"x-workspace-role": "OWNER"},
  })).status, 404, "cross-tenant workspace is hidden even with forged role header");

  assert.equal((await request(`/workspaces/${workspaceId}`, tokenA)).status, 200);
  assert.equal((await request(`/workspaces/${workspaceId}`, tokenB, {
    method: "PATCH", body: {name: "attack"},
  })).status, 404);

  await prisma.workspaceMember.create({
    data: {workspaceId, userId: viewer.id, role: "VIEWER"},
  });

  assert.equal((await request(`/workspaces/${workspaceId}`, tokenB)).status, 200, "VIEWER may read");
  assert.equal((await request(`/workspaces/${workspaceId}`, tokenB, {
    method: "PATCH", body: {name: "attack"},
  })).status, 403, "VIEWER may not mutate");

  const patch = await request(`/workspaces/${workspaceId}`, tokenA, {
    method: "PATCH", body: {name: "Renamed Workspace"},
  });
  assert.equal(patch.status, 200);
  assert.equal((await patch.json() as {name: string}).name, "Renamed Workspace");

  const listing = await request("/me/workspaces", tokenB);
  assert.equal(listing.status, 200);
  const memberships = await listing.json() as Array<{role: string; workspace: {id: string}}>;
  assert.ok(memberships.some(m => m.workspace.id === workspaceId && m.role === "VIEWER"));

  await prisma.user.update({where: {id: viewer.id}, data: {status: "DISABLED"}});
  assert.equal((await request("/me", tokenB)).status, 403, "disabled users cannot authenticate");
});
