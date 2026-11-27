import {NotFoundException} from "@nestjs/common";
import type {PrismaService} from "../../database/prisma.service.js";
import type {MediaObjectStore} from "../media/media-object-store.js";
import type {ProjectDocumentV2} from "../../../../src/features/studio-v2/core/document.schema.js";

export async function signTemplateMedia(db:PrismaService,store:MediaObjectStore,workspaceId:string,snapshot:ProjectDocumentV2){
    const ids=[...new Set(Object.values(snapshot.assets).map(a=>a.storageKey).filter(k=>k.startsWith("asset:")).map(k=>k.slice(6)))];
    const media=ids.length?await db.mediaAsset.findMany({
      where:{workspaceId:workspaceId,id:{in:ids},status:"READY"},
      select:{id:true,storageKey:true,mimeType:true},
    }):[];
    if(media.length!==ids.length)throw new NotFoundException("TEMPLATE_MEDIA_UNAVAILABLE");
    const mediaUrls:Record<string,string>={};
    await Promise.all(media.map(async asset=>{
      mediaUrls["asset:"+asset.id]=await store.signRead(asset.storageKey,asset.mimeType);
    }));
    return mediaUrls;
}
