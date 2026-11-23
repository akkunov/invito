import {ConflictException, Inject, Injectable, NotFoundException, UnprocessableEntityException} from "@nestjs/common";
import {PrismaService} from "../../database/prisma.service.js";
import {MediaObjectStore} from "../media/media-object-store.js";
import {DocumentsAccessService, validUuid} from "../documents/documents-access.service.js";
import {validatedTemplate, verifyAssets} from "../documents/documents-input.js";
import type {ProjectDocumentV2} from "../../../../src/features/studio-v2/core/document.schema.js";

const CATEGORIES = ["WEDDING","KYZ_UZATUU","BIRTHDAY","ANNIVERSARY","CORPORATE","OTHER"] as const;
type Category = typeof CATEGORIES[number];
export type CatalogFilters={category?:Category;search?:string;page:number;limit:number};

@Injectable()
export class CatalogService {
  constructor(
    @Inject(PrismaService) private readonly db:PrismaService,
    @Inject(MediaObjectStore) private readonly media:MediaObjectStore,
    @Inject(DocumentsAccessService) private readonly access:DocumentsAccessService,
  ){}

  async list(filters:CatalogFilters) {
    const where={
      status:"PUBLISHED" as const,
      publicSlug:{not:null},
      ...(filters.category?{category:filters.category}:{}),
      ...(filters.search?{OR:[
        {name:{contains:filters.search,mode:"insensitive" as const}},
        {description:{contains:filters.search,mode:"insensitive" as const}},
      ]}:{}),
    };
    const [count,rows]=await Promise.all([
      this.db.template.count({where}),
      this.db.template.findMany({where,
        orderBy:[{updatedAt:"desc"},{id:"asc"}],
        skip:(filters.page-1)*filters.limit,take:filters.limit,
        select:{id:true,publicSlug:true,name:true,description:true,category:true,tags:true,
          latestVersion:true,updatedAt:true,workspaceId:true,coverPageId:true,
          versions:{orderBy:{number:"desc"},take:1,select:{document:true}}},
      }),
    ]);
    const items=await Promise.all(rows.map(async row=>{
      const document=row.versions[0]?.document as ProjectDocumentV2|undefined;
      const trustedStaticCovers=new Set([
        "/images/riviera/couple.webp",
        "/images/riviera/fabric-left.webp",
        "/images/riviera/fabric-right.webp",
        "/images/riviera/flowers.webp",
        "/images/riviera/villa.webp",
      ]);
      const image=document&&Object.values(document.assets).find(asset=>asset.mimeType.startsWith("image/")&&
        (asset.storageKey.startsWith("asset:")||trustedStaticCovers.has(asset.storageKey)));
      let coverUrl:string|null=null;
      if(image&&trustedStaticCovers.has(image.storageKey))coverUrl=image.storageKey;
      else if(image){
        const asset=await this.db.mediaAsset.findFirst({where:{id:image.storageKey.slice(6),workspaceId:row.workspaceId,status:"READY"},select:{storageKey:true,mimeType:true}});
        if(asset)coverUrl=await this.media.signRead(asset.storageKey,asset.mimeType).catch(()=>null);
      }
      return {id:row.id,slug:row.publicSlug!,name:row.name,description:row.description,
        category:row.category,tags:row.tags,version:row.latestVersion,
        coverUrl,updatedAt:row.updatedAt};
    }));
    return {items,total:count,page:filters.page,limit:filters.limit,
      nextPage:filters.page*filters.limit<count?filters.page+1:null};
  }

  async detail(slug:string) {
    const row=await this.db.template.findUnique({where:{publicSlug:slug},
      select:{id:true,workspaceId:true,publicSlug:true,name:true,description:true,category:true,
        status:true,latestVersion:true,versions:{orderBy:{number:"desc"},take:1,
          select:{id:true,number:true,document:true,personalization:true}}},
    });
    if(!row||row.status!=="PUBLISHED"||!row.versions[0])throw new NotFoundException("TEMPLATE_NOT_FOUND");
    const version=row.versions[0];
    const {snapshot,contract}=validatedTemplate(version.document,version.personalization);
    if(!contract)throw new NotFoundException("TEMPLATE_NOT_FOUND");
    const ids=[...new Set(Object.values(snapshot.assets).map(a=>a.storageKey).filter(k=>k.startsWith("asset:")).map(k=>k.slice(6)))];
    const media=ids.length?await this.db.mediaAsset.findMany({
      where:{workspaceId:row.workspaceId,id:{in:ids},status:"READY"},
      select:{id:true,storageKey:true,mimeType:true},
    }):[];
    if(media.length!==ids.length)throw new NotFoundException("TEMPLATE_MEDIA_UNAVAILABLE");
    const mediaUrls:Record<string,string>={};
    await Promise.all(media.map(async asset=>{
      mediaUrls["asset:"+asset.id]=await this.media.signRead(asset.storageKey,asset.mimeType);
    }));
    return {id:row.id,slug:row.publicSlug!,name:row.name,description:row.description,
      category:row.category,version:version.number,templateVersionId:version.id,
      document:snapshot,personalization:contract,mediaUrls};
  }

  async publish(userId:string,workspaceId:string,templateId:string,publicSlug:string) {
    await this.access.member(userId,workspaceId,"ADMIN");
    if(!validUuid(templateId))throw new NotFoundException("TEMPLATE_NOT_FOUND");
    const row=await this.db.template.findFirst({where:{id:templateId,workspaceId},
      select:{id:true,coverPageId:true,latestVersion:true,
        versions:{orderBy:{number:"desc"},take:1,select:{document:true,personalization:true}}},
    });
    if(!row||!row.versions[0])throw new NotFoundException("TEMPLATE_NOT_FOUND");
    const {snapshot,contract}=validatedTemplate(row.versions[0].document,row.versions[0].personalization);
    if(!contract||contract.fields.length===0)throw new UnprocessableEntityException("PERSONALIZATION_CONTRACT_REQUIRED");
    if(!snapshot.pages.some(page=>page.id===row.coverPageId))throw new UnprocessableEntityException("COVER_PAGE_NOT_FOUND");
    await verifyAssets(this.db,workspaceId,snapshot);
    try {
      return await this.db.template.update({where:{id:templateId},
        data:{status:"PUBLISHED",publicSlug},
        select:{id:true,publicSlug:true,status:true,latestVersion:true}});
    } catch(error) {
      if(error&&typeof error==="object"&&"code" in error&&error.code==="P2002")
        throw new ConflictException("TEMPLATE_PUBLIC_SLUG_TAKEN");
      throw error;
    }
  }
}
