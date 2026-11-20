import {parseProjectV2, type ProjectDocumentV2} from "../core/document.schema.ts";

export type PublicInvitation={
  slug:string;
  release:number;
  sha256:string;
  document:ProjectDocumentV2;
  mediaUrls:Record<string,string>;
  rsvpEnabled:boolean;
  turnstileSiteKey:string|null;
};

export function invitationApiBase():string {
  const configured=process.env.NEXT_PUBLIC_API_URL;
  if(!configured){
    if(process.env.NODE_ENV==="production")throw new Error("INVITO_PUBLIC_API_NOT_CONFIGURED");
    return "http://localhost:4000/api/v1";
  }
  const url=new URL(configured);
  if(url.protocol!=="https:"&&!(url.protocol==="http:"&&["127.0.0.1","localhost"].includes(url.hostname)))
    throw new Error("PUBLIC_API_HTTPS_REQUIRED");
  if(url.username||url.password||url.hash||url.search)throw new Error("INVALID_PUBLIC_API_URL");
  return url.href.replace(/\/$/,"");
}

export function decodePublicInvitation(value:unknown):PublicInvitation{
  if(!value||typeof value!=="object")throw new Error("INVALID_PUBLIC_INVITATION");
  const v=value as Record<string,unknown>;
  if(typeof v.slug!=="string"||typeof v.release!=="number"||!Number.isSafeInteger(v.release)||
    typeof v.sha256!=="string"||!v.mediaUrls||typeof v.mediaUrls!=="object"||
    typeof v.rsvpEnabled!=="boolean"||(v.turnstileSiteKey!==null&&typeof v.turnstileSiteKey!=="string"))
    throw new Error("INVALID_PUBLIC_INVITATION");
  const mediaUrls=v.mediaUrls as Record<string,unknown>;
  if(Object.entries(mediaUrls).some(([key,url])=>
    !/^asset:[0-9a-f-]{36}$/i.test(key)||typeof url!=="string"||!url.startsWith("https://")))
    throw new Error("UNTRUSTED_PUBLIC_MEDIA_URL");
  return {
    slug:v.slug,release:v.release,sha256:v.sha256,document:parseProjectV2(v.document),
    mediaUrls:mediaUrls as Record<string,string>,
    rsvpEnabled:v.rsvpEnabled,turnstileSiteKey:v.turnstileSiteKey as string|null,
  };
}
