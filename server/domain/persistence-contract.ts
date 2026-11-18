import {createHash} from "node:crypto";
import {z} from "zod";
import {parseProjectV2,type ProjectDocumentV2} from "../../src/features/studio-v2/core/document.schema.ts";
import {personalizationSchema} from "../../src/features/studio-v2/core/personalization.schema.ts";
import {contractIssues} from "../../src/features/studio-v2/core/personalization.ts";

/** Pure backend boundary for future NestJS controllers. Input is never authoritative. */
export const uuidSchema=z.string().uuid();
export const publicSlugSchema=z.string().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const memberRoleSchema=z.enum(["OWNER","ADMIN","EDITOR","VIEWER"]);
export type MemberRole=z.infer<typeof memberRoleSchema>;
export const editorOperationSchema=z.enum(["read","write","publish","manageMembers","readResponses"]);

export const projectSaveRequestSchema=z.strictObject({
  expectedRevision:z.number().int().min(0),
  document:z.unknown(),
  idempotencyKey:z.string().min(16).max(120).optional(),
});
export const templateVersionRequestSchema=z.strictObject({
  expectedVersion:z.number().int().min(0),
  note:z.string().max(300),
  document:z.unknown(),
  personalization:z.unknown().optional(),
});
export const publishRequestSchema=z.strictObject({
  projectRevisionId:uuidSchema,
  expectedRelease:z.number().int().min(0),
  idempotencyKey:z.string().min(16).max(120),
});
export const rsvpRequestSchema=z.strictObject({
  guestName:z.string().trim().min(1).max(120),
  attendance:z.enum(["YES","NO","MAYBE"]),
  guestCount:z.number().int().min(1).max(20),
  message:z.string().max(2000).optional(),
});

export type RoleOperation=z.infer<typeof editorOperationSchema>;
const permissions:Record<RoleOperation,readonly MemberRole[]>={
 read:["OWNER","ADMIN","EDITOR","VIEWER"],
 write:["OWNER","ADMIN","EDITOR"],
 publish:["OWNER","ADMIN"],
 manageMembers:["OWNER","ADMIN"],
 readResponses:["OWNER","ADMIN","EDITOR"],
};

/** Pass only roles loaded from trusted DB membership queries. Never read client-supplied roles. */
export function assertWorkspacePermission(role:unknown,operation:RoleOperation):void{
 const validated=memberRoleSchema.safeParse(role);
 if(!validated.success||!permissions[operation].includes(validated.data))throw new Error("FORBIDDEN");
}

export function assertExpectedRevision(actual:number,expected:number):void{
 if(!Number.isSafeInteger(actual)||actual<0||!Number.isSafeInteger(expected)||expected<0)throw new Error("INVALID_REVISION");
 if(actual!==expected)throw new Error("REVISION_CONFLICT");
}

export function assertSameWorkspace(expectedWorkspaceId:string,resourceWorkspaceId:string):void{
 if(expectedWorkspaceId!==resourceWorkspaceId)throw new Error("NOT_FOUND");
}

/** RFC 8785 is not claimed. This deterministic serializer is for valid JSON snapshots only. */
export function canonicalJson(value:unknown):string{
 if(value===null||typeof value==="string"||typeof value==="boolean")return JSON.stringify(value);
 if(typeof value==="number"){
  if(!Number.isFinite(value))throw new Error("INVALID_JSON");
  return JSON.stringify(value);
 }
 if(Array.isArray(value))return "["+value.map(canonicalJson).join(",")+"]";
 if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype){
  const entries=Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0);
  return "{"+entries.map(([key,v])=>{
   if(v===undefined)throw new Error("INVALID_JSON");
   return JSON.stringify(key)+":"+canonicalJson(v);
  }).join(",")+"}";
 }
 throw new Error("INVALID_JSON");
}
export function snapshotHash(snapshot:unknown):string{
 return createHash("sha256").update(canonicalJson(snapshot),"utf8").digest("hex");
}

/** All JSON entering persistence must pass the existing Studio schema, not a weaker replica. */
export function validatedStudioSnapshot(input:unknown):ProjectDocumentV2{
 return parseProjectV2(input);
}
export function validatedTemplateVersion(document:unknown,personalization:unknown){
 const snapshot=validatedStudioSnapshot(document);
 const contract=personalization===undefined?undefined:personalizationSchema.parse(personalization);
 if(contract){
  const issues=contractIssues(snapshot,contract);
  if(issues.length)throw new Error("INVALID_PERSONALIZATION_CONTRACT: "+issues[0].message);
 }
 return {snapshot,contract,sha256:snapshotHash({document:snapshot,personalization:contract??null})};
}

export type StoredAsset={
 id:string;
 workspaceId:string;
 status:"PENDING"|"READY"|"REJECTED"|"DELETED";
 mimeType:string;
 bytes:bigint;
 sha256:string;
};

export function assertReadyAssets(document:ProjectDocumentV2,workspaceId:string,assets:readonly StoredAsset[],trustedStaticKeys:ReadonlySet<string>):void{
 const byId=new Map(assets.map(a=>[a.id,a]));
 for(const reference of Object.values(document.assets)){
  const key=reference.storageKey;
  if(key.startsWith("/images/")){
   if(!trustedStaticKeys.has(key))throw new Error("UNTRUSTED_STATIC_ASSET");
   continue;
  }
  if(key.startsWith("local:"))throw new Error("LOCAL_ASSET_NOT_UPLOADED");
  if(!key.startsWith("asset:"))throw new Error("INVALID_ASSET_REFERENCE");
  const asset=byId.get(key.slice(6));
  if(!asset||asset.workspaceId!==workspaceId||asset.status!=="READY")throw new Error("ASSET_NOT_FOUND");
  if(reference.mimeType!==asset.mimeType||BigInt(reference.sizeBytes)!==asset.bytes)throw new Error("ASSET_METADATA_MISMATCH");
 }
}

export type PublicRelease={publicationId:string;number:number;snapshot:unknown};
export function publicSnapshot(
 publication:{id:string;status:"ACTIVE"|"UNPUBLISHED";latestRelease:number},
 releases:readonly PublicRelease[],
):ProjectDocumentV2{
 if(publication.status!=="ACTIVE"||publication.latestRelease<1)throw new Error("NOT_FOUND");
 const release=releases.find(v=>v.publicationId===publication.id&&v.number===publication.latestRelease);
 if(!release)throw new Error("NOT_FOUND");
 return validatedStudioSnapshot(release.snapshot);
}
