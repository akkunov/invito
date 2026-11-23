"use client";

import {configuredSupabase,getSupabaseAccessToken} from "@/features/auth/browser/supabase-session";
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
export async function customerToken():Promise<string|null>{
  const cfg=configuredSupabase();
  return cfg?getSupabaseAccessToken(cfg):null;
}
export async function customerApi<T>(path:string,method="GET",payload?:unknown):Promise<T>{
  const cfg=config(),token=await getSupabaseAccessToken(cfg);
  if(!token)throw new CustomerCloudError(401,"SIGN_IN_REQUIRED");
  const response=await fetch(cfg.apiBaseUrl+path,{
    method,cache:"no-store",credentials:"omit",
    headers:{
      Authorization:"Bearer "+token,
      ...(payload===undefined?{}:{"Content-Type":"application/json"}),
    },
    ...(payload===undefined?{}:{body:JSON.stringify(payload)}),
  });
  if(!response.ok){
    throw new CustomerCloudError(response.status,"CUSTOMER_API_"+response.status);
  }
  return response.json() as Promise<T>;
}
export async function createCustomerDraft(templateVersionId:string){
  return customerApi<{id:string;revision:number;templateVersionId:string}>(
    "/customer/invitations","POST",{templateVersionId});
}
export async function getCustomerDraft(id:string){
  return customerApi<CustomerDraft>("/customer/invitations/"+encodeURIComponent(id));
}
export async function saveCustomerDraft(id:string,expectedRevision:number,patch:PersonalizationPatch){
  return customerApi<{id:string;revision:number;updatedAt:string}>(
    "/customer/invitations/"+encodeURIComponent(id),"PATCH",{expectedRevision,patch});
}
export async function uploadCustomerPhoto(file:File,progress?:(value:string)=>void){
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>20*1024*1024||file.size===0){
    throw new Error("INVALID_IMAGE_FILE");
  }
  const cfg=config(),token=await getSupabaseAccessToken(cfg);
  if(!token)throw new CustomerCloudError(401,"SIGN_IN_REQUIRED");
  const bytes=await file.arrayBuffer();
  const sha256=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)))
    .map(byte=>byte.toString(16).padStart(2,"0")).join("");
  progress?.("signing");
  const ticket=await customerApi<{
    id:string;uploadUrl:string;headers:Record<string,string>;
  }>("/customer/media/uploads","POST",{
    name:file.name,mimeType:file.type,bytes:file.size,sha256,
  });
  const url=new URL(ticket.uploadUrl);
  if(url.protocol!=="https:"||!url.hostname.endsWith(".r2.cloudflarestorage.com")||
    ticket.headers?.["Content-Type"]!==file.type)throw new Error("UNTRUSTED_SIGNED_UPLOAD_URL");
  progress?.("uploading");
  const put=await fetch(url.href,{
    method:"PUT",headers:ticket.headers,body:file,cache:"no-store",credentials:"omit",redirect:"error",
  });
  if(!put.ok)throw new CustomerCloudError(put.status,"R2_PUT_FAILED");
  progress?.("verifying");
  const completed=await customerApi<{
    id:string;storageKey:string;name:string;mimeType:"image/png"|"image/jpeg"|"image/webp";
    sizeBytes:number;pixelWidth:number;pixelHeight:number;status:string;
  }>("/customer/media/"+ticket.id+"/complete","POST");
  if(completed.id!==ticket.id||completed.status!=="READY"||completed.sizeBytes!==file.size){
    throw new Error("INVALID_CUSTOMER_MEDIA_RESPONSE");
  }
  const read=await customerApi<{url:string;expiresInSeconds:number}>(
    "/customer/media/"+ticket.id+"/read-url");
  const trusted=new URL(read.url);
  if(trusted.protocol!=="https:"||!trusted.hostname.endsWith(".r2.cloudflarestorage.com")||
    read.expiresInSeconds<1||read.expiresInSeconds>60)throw new Error("UNTRUSTED_MEDIA_READ_URL");
  progress?.("ready");
  const asset:VerifiedCustomerAsset={
    id:"customer_"+ticket.id.replace(/-/g,""),
    storageKey:"asset:"+ticket.id,
    name:completed.name,mimeType:completed.mimeType,
    sizeBytes:completed.sizeBytes,
    pixelWidth:completed.pixelWidth,pixelHeight:completed.pixelHeight,
  };
  return {asset,url:read.url};
}
