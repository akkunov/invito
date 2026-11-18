import assert from "node:assert/strict";
import {createHash, webcrypto} from "node:crypto";
import {createEmptyProjectV2} from "../src/features/studio-v2/core/document.schema.ts";
import {createStudioRemoteClient} from "../src/features/studio-v2/browser/remote-sync.ts";
import {prepareCloudSnapshot} from "../src/features/studio-v2/browser/cloud-media.ts";

const workspaceId="00000000-0000-4000-8000-000000000001";
const assetId="00000000-0000-4000-8000-000000000002";
const bytes=Buffer.from([137,80,78,71,13,10,26,10,1,2,3,4]);
const blob=new Blob([bytes],{type:"image/png"});
const hash=createHash("sha256").update(bytes).digest("hex");
const document=createEmptyProjectV2("test-studio-media");
document.assets["asset-photo"]={
  id:"asset-photo",name:"portrait.png",mimeType:"image/png",sizeBytes:blob.size,
  storageKey:"local:asset-photo",pixelWidth:64,pixelHeight:64,
};
let uploads=0;
const cache=new Map();
const makeVerified=async()=>{
  uploads++;
  return {
    id:assetId,storageKey:"asset:"+assetId,mimeType:"image/png",sizeBytes:blob.size,
    sha256:hash,pixelWidth:64,pixelHeight:64,status:"READY",
  };
};
const prepared=await prepareCloudSnapshot(document,async()=>blob,makeVerified,cache);
assert.equal(prepared.uploads,1);
assert.equal(prepared.document.assets["asset-photo"].storageKey,"asset:"+assetId);
assert.equal(document.assets["asset-photo"].storageKey,"local:asset-photo","original local document remains");
const again=await prepareCloudSnapshot(document,async()=>blob,makeVerified,cache);
assert.equal(again.uploads,0);
assert.equal(uploads,1);
await assert.rejects(
  ()=>prepareCloudSnapshot(document,async()=>null,makeVerified),/LOCAL_MEDIA_MISSING/);
assert.equal(document.assets["asset-photo"].storageKey,"local:asset-photo");

let putCount=0;
let bearerForR2=false;
const client=createStudioRemoteClient({
  apiBaseUrl:"https://api.invito.test/api/v1",
  workspaceId,
  accessToken:async()=> "short-lived-oidc-token",
  fetcher:async (request,init)=>{
    const url=String(request);
    if(url.endsWith("/media/uploads")){
      assert.equal(init?.headers?.Authorization,"Bearer short-lived-oidc-token");
      const data=JSON.parse(init.body);
      assert.equal(data.sha256,hash);
      return Response.json({
        id:assetId,storageKey:"asset:"+assetId,
        uploadUrl:"https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com/private/staging",
        headers:{"Content-Type":"image/png"},expiresInSeconds:180,
      });
    }
    if(url.includes(".r2.cloudflarestorage.com/")){
      assert.equal(init.method,"PUT");
      bearerForR2 ||= Boolean(init?.headers?.Authorization);
      putCount++;return new Response("",{status:200});
    }
    if(url.endsWith("/media/"+assetId+"/complete"))return Response.json(await makeVerified());
    if(url.endsWith("/media/"+assetId+"/read-url"))return Response.json({
      url:"https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com/private/verified",
      expiresInSeconds:60,mimeType:"image/png",
    });
    throw new Error("Unexpected URL "+url);
  },
});
const verified=await client.uploadMedia("portrait.png",blob);
assert.equal(verified.storageKey,"asset:"+assetId);
assert.equal(putCount,1);
assert.equal(bearerForR2,false,"JWT must never go to R2 PUT");
const read=await client.getMediaReadUrl(assetId);
assert.ok(read.url.includes("verified"));
assert.equal(read.expiresInSeconds,60);

const hostile=createStudioRemoteClient({
  apiBaseUrl:"https://api.invito.test/api/v1",workspaceId,
  accessToken:async()=> "oidc",
  fetcher:async url=>{
    if(String(url).endsWith("/media/uploads")) return Response.json({
      id:assetId, uploadUrl:"https://evil.example/collect",
      headers:{"Content-Type":"image/png"},
    });
    throw new Error("Client attempted to upload to an untrusted host");
  },
});
await assert.rejects(()=>hostile.uploadMedia("x.png",blob),/UNTRUSTED_SIGNED_UPLOAD_URL/);
console.log("Cloud media: explicit safe snapshot, hash cache, signed PUT without bearer, R2 URL allowlist OK");
