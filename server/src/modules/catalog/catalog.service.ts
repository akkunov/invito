import {signTemplateMedia} from "../documents/template-media.js";
import {ConflictException, Inject, Injectable, NotFoundException, UnprocessableEntityException} from "@nestjs/common";
import {PrismaService} from "../../database/prisma.service.js";
import {MediaObjectStore} from "../media/media-object-store.js";
import {DocumentsAccessService, validUuid} from "../documents/documents-access.service.js";
import {validatedTemplate, verifyAssets, staticAssets} from "../documents/documents-input.js";
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
      publishedVersionId:{not:null},
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
          updatedAt:true,workspaceId:true,
          publishedVersion:{select:{number:true,document:true}}},
      }),
    ]);
    const items=await Promise.all(rows.map(async row=>{
      const document=row.publishedVersion?.document as ProjectDocumentV2|undefined;
      const trustedStaticCovers=staticAssets;
      const image=document&&Object.values(document.assets).find(asset=>asset.mimeType.startsWith("image/")&&
        (asset.storageKey.startsWith("asset:")||trustedStaticCovers.has(asset.storageKey)));
      let coverUrl:string|null=null;
      if(image&&trustedStaticCovers.has(image.storageKey))coverUrl=image.storageKey;
      else if(image){
        const asset=await this.db.mediaAsset.findFirst({where:{id:image.storageKey.slice(6),workspaceId:row.workspaceId,status:"READY"},select:{storageKey:true,mimeType:true}});
        if(asset)coverUrl=await this.media.signRead(asset.storageKey,asset.mimeType).catch(()=>null);
      }
      return {id:row.id,slug:row.publicSlug!,name:row.name,description:row.description,
        category:row.category,tags:row.tags,version:row.publishedVersion!.number,
        coverUrl,updatedAt:row.updatedAt};
    }));
    return {items,total:count,page:filters.page,limit:filters.limit,
      nextPage:filters.page*filters.limit<count?filters.page+1:null};
  }

  async detail(slug:string) {
    const row=await this.db.template.findUnique({where:{publicSlug:slug},
      select:{id:true,workspaceId:true,publicSlug:true,name:true,description:true,category:true,
        status:true,publishedVersion:{select:{id:true,number:true,document:true,personalization:true}}},
    });
    if(!row||row.status!=="PUBLISHED"||!row.publishedVersion)throw new NotFoundException("TEMPLATE_NOT_FOUND");
    const version=row.publishedVersion;
    const {snapshot,contract}=validatedTemplate(version.document,version.personalization);
    if(!contract)throw new NotFoundException("TEMPLATE_NOT_FOUND");
    const mediaUrls=await signTemplateMedia(this.db,this.media,row.workspaceId,snapshot);
    return {id:row.id,slug:row.publicSlug!,name:row.name,description:row.description,
      category:row.category,version:version.number,templateVersionId:version.id,
      document:snapshot,personalization:contract,mediaUrls};
  }

  async publish(userId:string,workspaceId:string,templateId:string,publicSlug:string,expectedVersion?:number) {
    await this.access.member(userId,workspaceId,"ADMIN");
    if(!validUuid(templateId))throw new NotFoundException("TEMPLATE_NOT_FOUND");
    const row=await this.db.template.findFirst({where:{id:templateId,workspaceId},
      select:{id:true,coverPageId:true,latestVersion:true,publishedVersionId:true,publicSlug:true,
        versions:{orderBy:{number:"desc"},take:1,select:{id:true,number:true,document:true,personalization:true}}},
    });
    const candidate=row?.versions[0];
    if(!row||!candidate)throw new NotFoundException("TEMPLATE_NOT_FOUND");
    if(candidate.number!==row.latestVersion || (expectedVersion!==undefined&&expectedVersion!==candidate.number))
      throw new ConflictException("TEMPLATE_VERSION_CONFLICT");
    const {snapshot,contract}=validatedTemplate(candidate.document,candidate.personalization);
    if(!contract||contract.fields.length===0)throw new UnprocessableEntityException("PERSONALIZATION_CONTRACT_REQUIRED");
    if(!snapshot.pages.some(page=>page.id===row.coverPageId))throw new UnprocessableEntityException("COVER_PAGE_NOT_FOUND");
    await verifyAssets(this.db,workspaceId,snapshot);
    try {
      const [published]=await this.db.template.updateManyAndReturn({
        where:{id:templateId,workspaceId,latestVersion:row.latestVersion,
          publishedVersionId:row.publishedVersionId,publicSlug:row.publicSlug},
        data:{status:"PUBLISHED",publicSlug,publishedVersionId:candidate.id},
        select:{id:true,publicSlug:true,status:true,latestVersion:true,publishedVersionId:true},
      });
      if(!published)throw new ConflictException("TEMPLATE_VERSION_CONFLICT");
      return published;
    } catch(error) {
      if(error&&typeof error==="object"&&"code" in error&&error.code==="P2002")
        throw new ConflictException("TEMPLATE_PUBLIC_SLUG_TAKEN");
      throw error;
    }
  }
}
