import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createEmptyProjectV2} from "../src/features/studio-v2/core/document.schema.ts";
import {
 assertWorkspacePermission,assertExpectedRevision,assertSameWorkspace,
 canonicalJson,snapshotHash,validatedStudioSnapshot,validatedTemplateVersion,
 assertReadyAssets,publicSnapshot,publicSlugSchema,projectSaveRequestSchema,
 publishRequestSchema,rsvpRequestSchema,
} from "../server/domain/persistence-contract.ts";

const doc=createEmptyProjectV2("invito-demo");
assert.equal(validatedStudioSnapshot(doc).schemaVersion,2);
assert.equal(validatedTemplateVersion(doc,{version:1,locales:["ru","ky"],fields:[]}).contract.fields.length,0);
assert.equal(validatedTemplateVersion(doc,undefined).sha256.length,64);
assert.throws(()=>validatedStudioSnapshot({...doc,schemaVersion:1}),/invalid|Invalid|expected/i);
assert.throws(()=>validatedStudioSnapshot({...doc,nodes:{}}),/invalid|Invalid|root/i);
assert.throws(()=>validatedTemplateVersion(doc,{version:1,locales:["ru"],fields:[
 {id:"spoof",kind:"text",key:"unknown",label:{ru:"Текст",ky:"Текст"},section:"main",required:false,maxLength:20,multiline:false}
]}),/INVALID_PERSONALIZATION_CONTRACT/);

assert.equal(canonicalJson({b:2,a:{z:4,x:3}}),canonicalJson({a:{x:3,z:4},b:2}));
assert.equal(snapshotHash({a:1,b:2}),snapshotHash({b:2,a:1}));
assert.notEqual(snapshotHash({a:1,b:2}),snapshotHash({a:1,b:3}));
assert.throws(()=>snapshotHash({bad:undefined}),/INVALID_JSON/);
assert.throws(()=>snapshotHash({bad:Infinity}),/INVALID_JSON/);

for(const operation of ["read","write","publish","manageMembers","readResponses"]){
 assert.doesNotThrow(()=>assertWorkspacePermission("OWNER",operation));
}
for(const operation of ["write","publish","manageMembers","readResponses"]){
 assert.throws(()=>assertWorkspacePermission("VIEWER",operation),/FORBIDDEN/);
}
assert.throws(()=>assertWorkspacePermission({role:"OWNER"},"publish"),/FORBIDDEN/);
assert.throws(()=>assertWorkspacePermission("EDITOR","publish"),/FORBIDDEN/);
assert.doesNotThrow(()=>assertWorkspacePermission("EDITOR","write"));
assert.throws(()=>assertExpectedRevision(5,4),/REVISION_CONFLICT/);
assert.doesNotThrow(()=>assertExpectedRevision(5,5));
assert.throws(()=>assertExpectedRevision(-1,-1),/INVALID_REVISION/);
assert.throws(()=>assertSameWorkspace("workspace-a","workspace-b"),/NOT_FOUND/);

assert.equal(publicSlugSchema.safeParse("nazgul-and-azamat").success,true);
for(const bad of ["../admin","/invite","Wedding Name","q","a--b"]){
 assert.equal(publicSlugSchema.safeParse(bad).success,false,bad);
}
assert.equal(projectSaveRequestSchema.safeParse({expectedRevision:2,document:doc,idempotencyKey:"0123456789abcdef"}).success,true);
assert.equal(projectSaveRequestSchema.safeParse({expectedRevision:-1,document:doc}).success,false);
assert.equal(rsvpRequestSchema.safeParse({guestName:"Айдана",attendance:"YES",guestCount:2}).success,true);
assert.equal(rsvpRequestSchema.safeParse({guestName:"",attendance:"YES",guestCount:1}).success,false);
assert.equal(rsvpRequestSchema.safeParse({guestName:"Тест",attendance:"YES",guestCount:99}).success,false);
const sampleUuid="11111111-1111-4111-8111-111111111111";
assert.equal(publishRequestSchema.safeParse({projectRevisionId:sampleUuid,expectedRelease:0,idempotencyKey:"0123456789abcdef"}).success,true);
assert.equal(publishRequestSchema.safeParse({projectRevisionId:sampleUuid,expectedRelease:0,idempotencyKey:"too-short",admin:true}).success,false);

const mediaDoc=structuredClone(doc);
mediaDoc.assets.photo={id:"photo",mimeType:"image/png",name:"Guest photo",sizeBytes:100,
 storageKey:"asset:"+sampleUuid,pixelWidth:100,pixelHeight:100};
const checked=validatedStudioSnapshot(mediaDoc),workspace="22222222-2222-4222-8222-222222222222";
const asset={id:sampleUuid,workspaceId:workspace,status:"READY",mimeType:"image/png",bytes:100n,sha256:"a".repeat(64)};
assert.doesNotThrow(()=>assertReadyAssets(checked,workspace,[asset],new Set()));
assert.throws(()=>assertReadyAssets(checked,workspace,[{...asset,workspaceId:"other"}],new Set()),/ASSET_NOT_FOUND/);
assert.throws(()=>assertReadyAssets(checked,workspace,[{...asset,status:"PENDING"}],new Set()),/ASSET_NOT_FOUND/);
assert.throws(()=>assertReadyAssets(checked,workspace,[{...asset,bytes:101n}],new Set()),/ASSET_METADATA_MISMATCH/);
const local=structuredClone(checked);
local.assets.photo.storageKey="local:guestupload";
assert.throws(()=>assertReadyAssets(local,workspace,[],new Set()),/LOCAL_ASSET_NOT_UPLOADED/);
const staticDoc=structuredClone(checked);staticDoc.assets.photo.storageKey="/images/riviera/couple.webp";
assert.throws(()=>assertReadyAssets(staticDoc,workspace,[],new Set()),/UNTRUSTED_STATIC_ASSET/);
assert.doesNotThrow(()=>assertReadyAssets(staticDoc,workspace,[],new Set(["/images/riviera/couple.webp"])));

const publication={id:sampleUuid,status:"ACTIVE",latestRelease:2};
const releases=[{publicationId:sampleUuid,number:1,snapshot:{...doc,locale:"ru"}},{publicationId:sampleUuid,number:2,snapshot:{...doc,locale:"ky"}}];
assert.equal(publicSnapshot(publication,releases).locale,"ky","A guest reads current release, never the draft");
assert.throws(()=>publicSnapshot({...publication,status:"UNPUBLISHED"},releases),/NOT_FOUND/);
assert.throws(()=>publicSnapshot({...publication,latestRelease:3},releases),/NOT_FOUND/);
assert.throws(()=>publicSnapshot(publication,[{publicationId:"unrelated",number:2,snapshot:doc}]),/NOT_FOUND/);

// Structural assertions complement, not replace, a real Prisma CLI schema validate.
const prisma=readFileSync(new URL("../server/prisma/schema.prisma",import.meta.url),"utf8");
for(const table of ["WorkspaceMember","TemplateVersion","ProjectRevision","PublicationRelease","MediaAsset","RsvpResponse","AuditEvent","IdempotencyRecord"]){
 assert.match(prisma,new RegExp("model "+table+" \\{"),table);
}
for(const relation of ["@@unique([templateId, number])","@@unique([projectId, number])","@@unique([publicationId, number])","@@unique([workspaceId, actorId, route, key])"]){
 assert.ok(prisma.includes(relation),relation);
}
console.log("PASS: #29.1 persistence contract — tenant guards, immutable snapshots, append-only revisions, validated assets, publication and public inputs");
