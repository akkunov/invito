"use client";

import {configuredSupabase,getSupabaseAccessToken,type CustomerRequestScope} from "@/features/auth/browser/supabase-session";
import type {PersonalizationPatch} from "@/features/studio-v2/core/personalization.schema";

export type VerifiedCustomerAsset={
  id:string;storageKey:string;name:string;
  mimeType:"image/png"|"image/jpeg"|"image/webp";
  sizeBytes:number;pixelWidth:number;pixelHeight:number;
};
export type CustomerDraft={
  id:string;revision:number;templateVersionId:string;
  patch:PersonalizationPatch;assets:VerifiedCustomerAsset[];
  mediaUrls:Record<string,string>;updatedAt:string;
};
export class CustomerCloudError extends Error {
  constructor(public readonly status:number,message:string){super(message);this.name="CustomerCloudError";}
}
function config(){
  const value=configuredSupabase();
  if(!value)throw new CustomerCloudError(0,"CLOUD_NOT_CONFIGURED");
  return value;
}
async function customerResponse(scope:CustomerRequestScope,path:string,method="GET",payload?:unknown){
  scope.signal.throwIfAborted();
  const cfg=config();
  const token=await getSupabaseAccessToken(cfg,scope.subject);
  scope.signal.throwIfAborted();
  if(!token)throw new CustomerCloudError(401,"SIGN_IN_REQUIRED");
  const response=await fetch(cfg.apiBaseUrl+path,{
    method,signal:scope.signal,cache:"no-store",credentials:"omit",
    headers:{
      Authorization:"Bearer "+token,
      ...(payload===undefined?{}:{"Content-Type":"application/json"}),
    },
    ...(payload===undefined?{}:{body:JSON.stringify(payload)}),
  });
  if(!response.ok)throw new CustomerCloudError(response.status,"CUSTOMER_API_"+response.status);
  return response;
}

export async function customerApi<T>(scope:CustomerRequestScope,path:string,method="GET",payload?:unknown):Promise<T>{
  const response=await customerResponse(scope,path,method,payload);
  return response.json() as Promise<T>;
}
export type CustomerDraftListItem={
  id:string;revision:number;templateVersionId:string;updatedAt:string;
  templateVersion:{template:{name:string;publicSlug:string|null}};
};
export async function listCustomerDrafts(scope:CustomerRequestScope){
  return customerApi<CustomerDraftListItem[]>(scope,"/customer/invitations");
}
export async function createCustomerDraft(scope:CustomerRequestScope,templateVersionId:string){
  return customerApi<{id:string;revision:number;templateVersionId:string}>(
    scope,"/customer/invitations","POST",{templateVersionId});
}
export async function getCustomerDraft(scope:CustomerRequestScope,id:string){
  return customerApi<CustomerDraft>(scope,"/customer/invitations/"+encodeURIComponent(id));
}
export async function saveCustomerDraft(scope:CustomerRequestScope,id:string,expectedRevision:number,patch:PersonalizationPatch){
  return customerApi<{id:string;revision:number;updatedAt:string}>(
    scope,"/customer/invitations/"+encodeURIComponent(id),"PATCH",{expectedRevision,patch});
}
async function uploadCustomerMedia(scope:CustomerRequestScope,file:File,progress?:(value:string)=>void){
  const bytes=await file.arrayBuffer();
  const sha256=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)))
    .map(byte=>byte.toString(16).padStart(2,"0")).join("");
  progress?.("signing");
  const ticket=await customerApi<{
    id:string;uploadUrl:string;headers:Record<string,string>;
  }>(scope,"/customer/media/uploads","POST",{
    name:file.name,mimeType:file.type,bytes:file.size,sha256,
  });
  const url=new URL(ticket.uploadUrl);
  if(url.protocol!=="https:"||!url.hostname.endsWith(".r2.cloudflarestorage.com")||
    ticket.headers?.["Content-Type"]!==file.type)throw new Error("UNTRUSTED_SIGNED_UPLOAD_URL");
  const base="/customer/media/"+encodeURIComponent(ticket.id);
  progress?.("uploading");
  const put=await fetch(url.href,{
    method:"PUT",signal:scope.signal,headers:ticket.headers,body:file,cache:"no-store",credentials:"omit",redirect:"error",
  });
  if(!put.ok)throw new CustomerCloudError(put.status,"R2_PUT_FAILED");
  progress?.("verifying");
  const asset=await customerApi<{
    id:string;storageKey:string;name:string;mimeType:VerifiedCustomerAsset["mimeType"]|"audio/mpeg";
    sizeBytes:number;pixelWidth:number|null;pixelHeight:number|null;status:string;
  }>(scope,base+"/complete","POST");
  if(asset.id!==ticket.id||asset.status!=="READY"||asset.sizeBytes!==file.size||
    asset.storageKey!=="asset:"+ticket.id||asset.mimeType!==file.type){
    throw new Error("INVALID_CUSTOMER_MEDIA_RESPONSE");
  }
  const read=await customerApi<{url:string;expiresInSeconds:number}>(scope,base+"/read-url");
  const trusted=new URL(read.url);
  const maxTtl=file.type==="audio/mpeg"?1200:60;
  if(trusted.protocol!=="https:"||!trusted.hostname.endsWith(".r2.cloudflarestorage.com")||
    !Number.isFinite(read.expiresInSeconds)||read.expiresInSeconds<1||read.expiresInSeconds>maxTtl){
    throw new Error("UNTRUSTED_MEDIA_READ_URL");
  }
  progress?.("ready");
  return {asset,url:trusted.href};
}

export async function uploadCustomerPhoto(scope:CustomerRequestScope,file:File,progress?:(value:string)=>void){
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>20*1024*1024||file.size===0){
    throw new Error("INVALID_IMAGE_FILE");
  }
  const {asset,url}=await uploadCustomerMedia(scope,file,progress);
  if(asset.mimeType==="audio/mpeg"||!asset.pixelWidth||!asset.pixelHeight)throw new Error("INVALID_CUSTOMER_IMAGE");
  const photo:VerifiedCustomerAsset={
    id:"customer_"+asset.id.replace(/-/g,""),storageKey:asset.storageKey,name:asset.name,
    mimeType:asset.mimeType,sizeBytes:asset.sizeBytes,pixelWidth:asset.pixelWidth,pixelHeight:asset.pixelHeight,
  };
  return {asset:photo,url};
}

export async function uploadCustomerAudio(scope:CustomerRequestScope,file:File){
  const supportedMime=["audio/mpeg","audio/mp3",""].includes(file.type);
  if(!supportedMime||!file.name.toLowerCase().endsWith(".mp3")||!file.size||file.size>15*1024*1024){
    throw new Error("INVALID_AUDIO_FILE");
  }
  const mp3=file.type==="audio/mpeg"?file:new File([file],file.name,{type:"audio/mpeg"});
  const {asset,url}=await uploadCustomerMedia(scope,mp3);
  return {source:asset.storageKey,url};
}

export type CustomerPublication={
  id:string;slug:string;status:"ACTIVE"|"UNPUBLISHED";latestRelease:number;
};
export async function getCustomerPublication(scope:CustomerRequestScope,id:string):Promise<CustomerPublication|null>{
  const response=await customerResponse(scope,"/customer/invitations/"+encodeURIComponent(id)+"/publication");
  const text=await response.text();
  return text.trim()?JSON.parse(text) as CustomerPublication:null;
}
export async function publishCustomerInvitation(scope:CustomerRequestScope,
  id:string,input:{slug:string;expectedRevision:number;expectedRelease:number},
){
  return customerApi<CustomerPublication & {draftRevision:number}>(
    scope,"/customer/invitations/"+encodeURIComponent(id)+"/publish","POST",input);
}
export async function unpublishCustomerInvitation(scope:CustomerRequestScope,id:string,expectedRelease:number){
  return customerApi<{status:"UNPUBLISHED";latestRelease:number}>(
    scope,"/customer/invitations/"+encodeURIComponent(id)+"/unpublish","POST",{expectedRelease});
}
