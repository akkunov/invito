import {ConflictException,ForbiddenException,Inject,Injectable,NotFoundException,UnprocessableEntityException} from "@nestjs/common";
import {Prisma} from "../../generated/prisma/client.js";
import {PrismaService} from "../../database/prisma.service.js";
import {MediaService} from "../media/media.service.js";
import {MediaObjectStore} from "../media/media-object-store.js";
import {validatedTemplate} from "../documents/documents-input.js";
import {personalizationPatchSchema,type PersonalizationPatch} from "../../../../src/features/studio-v2/core/personalization.schema.js";
import {personalizeDocument} from "../../../../src/features/studio-v2/core/personalization.js";
import type {ProjectDocumentV2} from "../../../../src/features/studio-v2/core/document.schema.js";

const json=(value:unknown)=>value as Prisma.InputJsonValue;
const mappedId=(id:string)=>"customer_"+id.replace(/-/g,"");
const EMPTY_PATCH:PersonalizationPatch={values:{}};

/** Customer drafts use a private per-account Workspace solely for R2 quota and authorization. */
@Injectable()
export class CustomerInvitationsService {
  constructor(
    @Inject(PrismaService) private readonly db:PrismaService,
    @Inject(MediaService) private readonly media:MediaService,
    @Inject(MediaObjectStore) private readonly store:MediaObjectStore,
  ){}

  private async personalWorkspace(userId:string){
    const slug="customer-"+userId;
    let workspace=await this.db.workspace.findUnique({where:{slug},select:{id:true}});
    if(!workspace){
      try{
        workspace=await this.db.workspace.create({
          data:{slug,name:"Личные приглашения",members:{create:{userId,role:"OWNER"}}},
          select:{id:true},
        });
      }catch(error){
        if(!error||typeof error!=="object"||!("code" in error)||error.code!=="P2002")throw error;
        workspace=await this.db.workspace.findUnique({where:{slug},select:{id:true}});
      }
    }
    if(!workspace)throw new NotFoundException("CUSTOMER_WORKSPACE_NOT_FOUND");
    const membership=await this.db.workspaceMember.findUnique({
      where:{workspaceId_userId:{workspaceId:workspace.id,userId}},select:{role:true},
    });
    if(!membership||membership.role!=="OWNER")throw new ForbiddenException("CUSTOMER_WORKSPACE_ACCESS_DENIED");
    return workspace.id;
  }

  async startPhoto(userId:string,input:{name:string;mimeType:"image/jpeg"|"image/png"|"image/webp";bytes:number;sha256:string}){
    const workspaceId=await this.personalWorkspace(userId);
    return this.media.startUpload(userId,workspaceId,input);
  }
  async photoUrl(userId:string,id:string){
    const workspaceId=await this.personalWorkspace(userId);
    const asset=await this.db.mediaAsset.findFirst({where:{id,workspaceId,uploadedById:userId,status:"READY"},select:{id:true}});
    if(!asset)throw new NotFoundException("CUSTOMER_MEDIA_NOT_FOUND");
    return this.media.readUrl(userId,workspaceId,id);
  }
  async completePhoto(userId:string,id:string){
    const workspaceId=await this.personalWorkspace(userId);
    return this.media.completeUpload(userId,workspaceId,id);
  }

  private async template(versionId:string,mustBePublished=true){
    const version=await this.db.templateVersion.findUnique({
      where:{id:versionId},
      select:{id:true,number:true,document:true,personalization:true,
        template:{select:{id:true,status:true,publicSlug:true,workspaceId:true}}},
    });
    if(!version||(mustBePublished&&(version.template.status!=="PUBLISHED"||!version.template.publicSlug)))
      throw new NotFoundException("TEMPLATE_NOT_PUBLISHED");
    const {snapshot,contract}=validatedTemplate(version.document,version.personalization);
    if(!contract||!contract.fields.length)throw new UnprocessableEntityException("TEMPLATE_NOT_PERSONALIZABLE");
    return {...version,snapshot,contract};
  }

  private customerIds(patch:PersonalizationPatch,source:ProjectDocumentV2){
    const ids=new Set<string>();
    for(const value of Object.values(patch.values)){
      const names=value.kind==="image"?[value.assetId]:value.kind==="gallery"?value.assetIds:[];
      for(const name of names){
        if(Object.hasOwn(source.assets,name))continue;
        if(!/^customer_[a-f0-9]{32}$/.test(name))throw new UnprocessableEntityException("INVALID_CUSTOMER_ASSET");
        const raw=name.slice("customer_".length);
        const uuid=raw.slice(0,8)+"-"+raw.slice(8,12)+"-"+raw.slice(12,16)+"-"+raw.slice(16,20)+"-"+raw.slice(20);
        ids.add(uuid);
      }
    }
    return [...ids];
  }

  private async checkPatch(userId:string,workspaceId:string,template:Awaited<ReturnType<CustomerInvitationsService["template"]>>,raw:unknown){
    const patch=personalizationPatchSchema.parse(raw);
    const ids=this.customerIds(patch,template.snapshot);
    const rows=ids.length?await this.db.mediaAsset.findMany({
      where:{id:{in:ids},workspaceId,uploadedById:userId,status:"READY",mimeType:{in:["image/jpeg","image/png","image/webp"]}},
      select:{id:true,name:true,mimeType:true,bytes:true,width:true,height:true,storageKey:true},
    }):[];
    if(rows.length!==ids.length)throw new UnprocessableEntityException("CUSTOMER_MEDIA_NOT_READY_OR_NOT_OWNED");
    const assets=rows.map(a=>({
      id:mappedId(a.id),storageKey:"asset:"+a.id,name:a.name,mimeType:a.mimeType as "image/jpeg"|"image/png"|"image/webp",
      sizeBytes:Number(a.bytes),pixelWidth:a.width??undefined,pixelHeight:a.height??undefined,
    }));
    for(const a of assets)if(!a.pixelHeight||!a.pixelWidth)throw new UnprocessableEntityException("INVALID_IMAGE_DIMENSIONS");
    try{personalizeDocument(template.snapshot,template.contract,patch,assets,true);}
    catch{throw new UnprocessableEntityException("INVALID_PERSONALIZATION_VALUES");}
    return {patch,assets,rows};
  }

  async create(userId:string,versionId:string){
    const template=await this.template(versionId);
    const workspaceId=await this.personalWorkspace(userId);
    const created=await this.db.invitationDraft.create({
      data:{ownerId:userId,workspaceId,templateVersionId:template.id,patch:json(EMPTY_PATCH)},
      select:{id:true,revision:true,templateVersionId:true,createdAt:true},
    });
    return created;
  }

  async list(userId:string){
    return this.db.invitationDraft.findMany({where:{ownerId:userId},
      select:{id:true,revision:true,templateVersionId:true,updatedAt:true,
        templateVersion:{select:{template:{select:{name:true,publicSlug:true}}}}},
      orderBy:{updatedAt:"desc"},take:50});
  }

  async get(userId:string,id:string){
    const draft=await this.db.invitationDraft.findFirst({where:{id,ownerId:userId},
      select:{id:true,revision:true,patch:true,workspaceId:true,templateVersionId:true,updatedAt:true}});
    if(!draft)throw new NotFoundException("INVITATION_NOT_FOUND");
    const template=await this.template(draft.templateVersionId,false);
    const data=await this.checkPatch(userId,draft.workspaceId,template,draft.patch);
    const mediaUrls:Record<string,string>={};
    await Promise.all(data.rows.map(async a=>{mediaUrls["asset:"+a.id]=await this.store.signRead(a.storageKey,a.mimeType);}));
    return {...draft,patch:data.patch,assets:data.assets,mediaUrls};
  }

  async save(userId:string,id:string,expectedRevision:number,raw:unknown){
    const draft=await this.db.invitationDraft.findFirst({where:{id,ownerId:userId},
      select:{id:true,revision:true,workspaceId:true,templateVersionId:true}});
    if(!draft)throw new NotFoundException("INVITATION_NOT_FOUND");
    const template=await this.template(draft.templateVersionId);
    const {patch}=await this.checkPatch(userId,draft.workspaceId,template,raw);
    const changed=await this.db.invitationDraft.updateMany({
      where:{id,ownerId:userId,revision:expectedRevision},
      data:{revision:{increment:1},patch:json(patch)},
    });
    if(changed.count!==1)throw new ConflictException("INVITATION_REVISION_CONFLICT");
    return this.db.invitationDraft.findUniqueOrThrow({where:{id},
      select:{id:true,revision:true,updatedAt:true}});
  }
}
