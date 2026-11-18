import "reflect-metadata";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {randomUUID, createHash} from "node:crypto";
import type {AddressInfo} from "node:net";
import {test} from "node:test";
import sharp from "sharp";
import {NestFactory} from "@nestjs/core";
import {generateKeyPair, exportJWK, SignJWT} from "jose";
import {AppModule} from "../src/app.module.js";
import {PrismaService} from "../src/database/prisma.service.js";
import {MediaObjectStore, MediaObjectNotFound} from "../src/modules/media/media-object-store.js";
import {createEmptyProjectV2} from "../../src/features/studio-v2/core/document.schema.ts";
import {createWidget} from "../../src/features/studio-v2/core/invitation-behavior.ts";

test("Media #29.4: R2 verification, immutable keys and tenant access", async t => {
  const {publicKey, privateKey} = await generateKeyPair("RS256");
  const jwk = {...await exportJWK(publicKey), kid: "media-test", alg: "RS256", use: "sig"};
  const keyServer = createServer((_request, response) => {
    response.writeHead(200, {"content-type":"application/json"});
    response.end(JSON.stringify({keys: [jwk]}));
  });
  await new Promise<void>(resolve => keyServer.listen(0, "127.0.0.1", resolve));
  const issuer = "http://127.0.0.1:" + (keyServer.address() as AddressInfo).port + "/";
  process.env.AUTH_ISSUER = issuer;
  process.env.AUTH_AUDIENCE = "invito-media-ci";
  process.env.AUTH_JWKS_URL = issuer + "jwks";
  process.env.AUTH_PROVIDER_ID = "oidc-media-ci";
  process.env.NODE_ENV = "test";

  const app = await NestFactory.create(AppModule, {logger: false});
  const db = app.get(PrismaService);
  const storage = app.get(MediaObjectStore);
  const staged = new Map<string, {bytes: Buffer; contentType: string}>();
  const verified = new Map<string, Buffer>();
  storage.signUpload = async key => "https://example.invalid/upload/" + encodeURIComponent(key);
  storage.readStaged = async (key, max) => {
    const value = staged.get(key);
    if (!value) throw new MediaObjectNotFound();
    if (value.bytes.length > max) throw new RangeError("TOO_LARGE");
    return value;
  };
  storage.putVerified = async (key, bytes) => {verified.set(key, Buffer.from(bytes));};
  storage.signRead = async key => "https://example.invalid/read/" + encodeURIComponent(key);
  storage.removeStaged = async key => {staged.delete(key);};
  app.setGlobalPrefix("api/v1");
  await app.listen(0, "127.0.0.1");
  const base = "http://127.0.0.1:" + (app.getHttpServer().address() as AddressInfo).port + "/api/v1";
  const users: string[] = [];
  let workspaceId: string | null = null;
  let otherWorkspaceId: string | null = null;
  t.after(async () => {
    try {
      if (workspaceId) {
        await db.auditEvent.deleteMany({where: {workspaceId}});
        await db.projectRevision.deleteMany({where: {project: {workspaceId}}});
        await db.studioProject.deleteMany({where: {workspaceId}});
        await db.mediaAsset.deleteMany({where: {workspaceId}});
        await db.workspace.delete({where: {id: workspaceId}});
      }
      if (otherWorkspaceId) await db.workspace.delete({where: {id: otherWorkspaceId}});
      for (const userId of users) await db.user.delete({where: {id: userId}});
    } finally {
      await app.close();
      await new Promise<void>((resolve, reject) => keyServer.close(error => error ? reject(error) : resolve()));
    }
  });

  const jwt = (sub: string) => new SignJWT({name: "Media CI"})
    .setProtectedHeader({alg: "RS256", kid: "media-test"})
    .setIssuer(issuer).setAudience("invito-media-ci")
    .setSubject(sub).setIssuedAt().setExpirationTime("5m").sign(privateKey);
  const owner = await jwt("owner-" + randomUUID());
  const viewer = await jwt("viewer-" + randomUUID());
  const outsider = await jwt("outsider-" + randomUUID());
  async function request(path: string, token: string, method = "GET", body?: unknown) {
    const response = await fetch(base + path, {method, headers:{
      authorization: "Bearer " + token,
      ...(body === undefined ? {} : {"content-type": "application/json"}),
    }, ...(body === undefined ? {} : {body: JSON.stringify(body)})});
    let data: any = null;try {data = await response.json();} catch {}
    return {status: response.status, data};
  }
  for (const token of [owner,viewer,outsider]) {
    const me = await request("/me", token);
    assert.equal(me.status, 200); users.push(me.data.id);
  }
  const ws = await request("/workspaces", owner, "POST", {
    slug: "media-" + randomUUID().slice(0,12), name: "Media E2E",
  });
  assert.equal(ws.status, 201, JSON.stringify(ws.data));
  workspaceId = ws.data.id;
  await db.workspaceMember.create({data: {workspaceId, userId: users[1]!, role: "VIEWER"}});

  const png = await sharp({create: {
    width: 32, height: 24, channels: 4, background: {r: 10, g: 20, b: 30, alpha: 1},
  }}).png().toBuffer();
  const sha256 = createHash("sha256").update(png).digest("hex");
  const requestBody = {name: "cover.png", mimeType: "image/png", bytes: png.length, sha256};
  const root = "/workspaces/" + workspaceId + "/media";
  assert.equal((await request(root + "/uploads", viewer, "POST", requestBody)).status, 403);
  assert.equal((await request(root + "/uploads", outsider, "POST", requestBody)).status, 404);
  assert.equal((await request(root + "/uploads", owner, "POST", {...requestBody, bytes: 21*1024*1024})).status, 413);

  const started = await request(root + "/uploads", owner, "POST", requestBody);
  assert.equal(started.status, 201, JSON.stringify(started.data));
  const mediaId: string = started.data.id;
  const pending = await db.mediaAsset.findUniqueOrThrow({where:{id: mediaId}});
  assert.equal(pending.status, "PENDING");
  assert.equal(started.data.storageKey, "asset:" + mediaId);
  assert.equal(started.data.headers["Content-Type"], "image/png");
  assert.equal((await request(root + "/" + mediaId + "/read-url", viewer)).status, 404);
  assert.equal((await request(root + "/" + mediaId + "/complete", viewer, "POST")).status, 403);
  staged.set(pending.storageKey, {bytes: png, contentType: "image/png"});
  const finished = await request(root + "/" + mediaId + "/complete", owner, "POST");
  assert.equal(finished.status, 201, JSON.stringify(finished.data));
  assert.equal(finished.data.status, "READY");
  assert.equal(finished.data.pixelWidth, 32);
  assert.equal(finished.data.pixelHeight, 24);
  assert.equal(finished.data.sizeBytes, png.length);
  const stored = await db.mediaAsset.findUniqueOrThrow({where: {id: mediaId}});
  assert.ok(stored.storageKey.startsWith("verified/" + workspaceId));
  assert.deepEqual(verified.get(stored.storageKey), png);
  assert.equal(staged.has(pending.storageKey), false);
  // Old upload capabilities can only overwrite staging, never the verified key.
  staged.set(pending.storageKey, {bytes: Buffer.from("bad"), contentType: "image/png"});
  assert.deepEqual(verified.get(stored.storageKey), png);
  assert.equal((await request(root + "/" + mediaId + "/complete", owner, "POST")).status, 201);
  assert.equal((await request(root + "/" + mediaId + "/read-url", outsider)).status, 404);
  const read = await request(root + "/" + mediaId + "/read-url", viewer);
  assert.equal(read.status, 200);
  assert.equal(read.data.expiresInSeconds, 60);
  assert.ok(String(read.data.url).includes("verified"));
  const listing = await request(root, viewer);
  assert.equal(listing.status, 200);
  assert.equal(listing.data.items.length, 1);
  assert.ok(!("uploadUrl" in listing.data.items[0]));
  assert.ok(listing.data.items[0].storageKey === "asset:" + mediaId, "raw R2 object keys are private");

  // READY workspace-scoped media can be stored in existing Studio v2 JSONB snapshots.
  const document = createEmptyProjectV2("studio-" + randomUUID().slice(0, 8));
  document.assets["asset-1"] = {
    id: "asset-1", storageKey: "asset:" + mediaId, mimeType: "image/png",
    name: "cover.png", sizeBytes: png.length, pixelWidth: 32, pixelHeight: 24,
  };
  const project = await request("/workspaces/" + workspaceId + "/projects", owner, "POST",
    {title: "Document with media", document});
  assert.equal(project.status, 201, JSON.stringify(project.data));

  // A Music widget can persist only a verified audio/mpeg asset in its own tenant.
  // Insert a trusted READY fixture here; forged uploads are still rejected below.
  const audioId = randomUUID();
  await db.mediaAsset.create({data: {
    id: audioId, workspaceId, uploadedById: users[0]!,
    storageKey: "verified/" + workspaceId + "/" + audioId + "/trusted.mp3",
    name: "song.mp3", mimeType: "audio/mpeg", bytes: 123n,
    sha256: "a".repeat(64), status: "READY",
  }});
  const musicDoc = createEmptyProjectV2("studio-" + randomUUID().slice(0, 8));
  const musicNode = createWidget("music", "music-node", "frame-1", 400);
  if (musicNode.block.kind !== "music") throw Error("Unexpected widget");
  musicNode.block.source = "asset:" + audioId;
  musicDoc.nodes[musicNode.id] = musicNode;
  const rootNode = musicDoc.nodes["frame-1"];
  if (rootNode.type === "frame") rootNode.children.push(musicNode.id);
  const musicProject = await request("/workspaces/" + workspaceId + "/projects", owner, "POST",
    {title: "Project with private MP3", document: musicDoc});
  assert.equal(musicProject.status, 201, JSON.stringify(musicProject.data));

  // An authenticated owner of another workspace cannot read or reuse the asset.
  const otherWorkspace = await request("/workspaces", outsider, "POST", {
    slug: "other-" + randomUUID().slice(0, 12), name: "Isolated tenant",
  });
  assert.equal(otherWorkspace.status, 201);
  otherWorkspaceId = otherWorkspace.data.id;
  assert.equal((await request("/workspaces/" + otherWorkspaceId + "/media/" + mediaId + "/read-url", outsider)).status, 404);
  const crossWorkspaceProject = await request("/workspaces/" + otherWorkspaceId + "/projects", outsider,
    "POST", {title: "Foreign asset forbidden", document: {
      ...structuredClone(document), id: "studio-" + randomUUID().slice(0, 8),
    }});
  assert.equal(crossWorkspaceProject.status, 422, "another workspace image may not be referenced");
  const foreignMusic = await request("/workspaces/" + otherWorkspaceId + "/projects", outsider,
    "POST", {title: "Foreign MP3 forbidden", document: {
      ...structuredClone(musicDoc), id: "studio-" + randomUUID().slice(0, 8),
    }});
  assert.equal(foreignMusic.status, 422, "another workspace MP3 may not be referenced");
  // A raster UUID in a music source is not a valid audio file, even in the same tenant.
  const badMusic = structuredClone(musicDoc);
  const badWidget = badMusic.nodes["music-node"];
  if (badWidget.type === "widget" && badWidget.block.kind === "music") {
    badWidget.block.source = "asset:" + mediaId;
  }
  assert.equal((await request("/workspaces/" + workspaceId + "/projects", owner,
    "POST", {title: "Image-as-audio forbidden", document: badMusic})).status, 422);

  // A mismatch must be rejected, with no READY record and no immutable copy.
  const invalid = await request(root + "/uploads", owner, "POST", requestBody);
  assert.equal(invalid.status, 201);
  const bad = await db.mediaAsset.findUniqueOrThrow({where: {id: invalid.data.id}});
  staged.set(bad.storageKey, {bytes: Buffer.from("tampered"), contentType: "image/png"});
  const rejected = await request(root + "/" + bad.id + "/complete", owner, "POST");
  assert.equal(rejected.status, 422);
  assert.equal((await db.mediaAsset.findUniqueOrThrow({where: {id: bad.id}})).status, "REJECTED");
  assert.equal((await request(root + "/" + bad.id + "/read-url", owner)).status, 404);

  // Even a matching SHA and MIME header is insufficient without a decodable image.
  const bogusPng = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from("not an actual raster")]);
  const fake = await request(root + "/uploads", owner, "POST", {
    name: "bogus.png", mimeType: "image/png", bytes: bogusPng.length,
    sha256: createHash("sha256").update(bogusPng).digest("hex"),
  });
  assert.equal(fake.status, 201);
  const fakeRow = await db.mediaAsset.findUniqueOrThrow({where:{id: fake.data.id}});
  staged.set(fakeRow.storageKey, {bytes:bogusPng, contentType:"image/png"});
  assert.equal((await request(root + "/" + fakeRow.id + "/complete", owner, "POST")).status, 422);
  assert.equal((await db.mediaAsset.findUniqueOrThrow({where:{id: fakeRow.id}})).status, "REJECTED");

  // A forged MIME claim without actual MP3 frames cannot become READY.
  const spoof = Buffer.from("ID3fake MP3 file without audio");
  const startAudio = await request(root + "/uploads", owner, "POST", {
    name: "audio.mp3", mimeType: "audio/mpeg", bytes: spoof.length,
    sha256: createHash("sha256").update(spoof).digest("hex"),
  });
  assert.equal(startAudio.status, 201, JSON.stringify(startAudio.data));
  const audio = await db.mediaAsset.findUniqueOrThrow({where:{id:startAudio.data.id}});
  staged.set(audio.storageKey, {bytes:spoof,contentType:"audio/mpeg"});
  assert.equal((await request(root + "/" + audio.id + "/complete", owner, "POST")).status, 422);
  assert.equal((await db.mediaAsset.findUniqueOrThrow({where:{id:audio.id}})).status, "REJECTED");
});