import {ConflictException,Inject,Injectable,NotFoundException,ServiceUnavailableException,UnprocessableEntityException} from "@nestjs/common";
import {Prisma} from "../../generated/prisma/client.js";
import {PrismaService} from "../../database/prisma.service.js";
import {MediaObjectStore} from "../media/media-object-store.js";
import {validatedDocument,validatedTemplate,snapshotHash} from "../documents/documents-input.js";
import {finalizePersonalization} from "../../../../src/features/studio-v2/core/personalization.js";
import {CustomerInvitationsService} from "./customer-invitations.service.js";
import {RsvpChallengeService} from "../publications/rsvp-challenge.service.js";

const json=(value:unknown)=>value as Prisma.InputJsonValue;
function conflict(error:unknown):never {
  if(error&&typeof error==="object"&&"code" in error&&["P2002","P2034"].includes(String(error.code)))
    throw new ConflictException("PUBLICATION_CONFLICT");
  throw error;
}

/** Owns only customer releases. No admin Studio project is ever created. */
@Injectable()
export class CustomerPublicationService {
  constructor(
    @Inject(PrismaService) private readonly db:PrismaService,
    @Inject(MediaObjectStore) private readonly store:MediaObjectStore,
    @Inject(CustomerInvitationsService) private readonly drafts:CustomerInvitationsService,
    @Inject(RsvpChallengeService) private readonly challenge:RsvpChallengeService,
  ){}

  async getOwner(userId:string,draftId:string){
    const draft=await this.db.invitationDraft.findFirst({
      where:{id:draftId,ownerId:userId},select:{id:true},
    });
    if(!draft)throw new NotFoundException("INVITATION_NOT_FOUND");
    return this.db.customerPublication.findUnique({
      where:{draftId},select:{id:true,slug:true,status:true,latestRelease:true},
    });
  }

  async publish(userId:string,draftId:string,input:{
    slug:string;expectedRevision:number;expectedRelease:number;
  }){
    const draft=await this.db.invitationDraft.findFirst({
      where:{id:draftId,ownerId:userId},
      select:{id:true,revision:true,workspaceId:true,patch:true,templateVersionId:true},
    });
    if(!draft)throw new NotFoundException("INVITATION_NOT_FOUND");
    if(draft.revision!==input.expectedRevision)throw new ConflictException("DRAFT_REVISION_CONFLICT");

    const version=await this.db.templateVersion.findUnique({
      where:{id:draft.templateVersionId},
      select:{document:true,personalization:true,
        template:{select:{workspaceId:true}}},
    });
    if(!version)throw new NotFoundException("TEMPLATE_VERSION_NOT_FOUND");
    const {snapshot,contract}=validatedTemplate(version.document,version.personalization);
    if(!contract)throw new UnprocessableEntityException("PERSONALIZATION_NOT_AVAILABLE");

    // get() verifies the authenticated owner and all customer asset rows.
    // Template assets come exclusively from the trusted immutable TemplateVersion.
    const owned=await this.drafts.get(userId,draftId);
    let document;
    try{
      document=finalizePersonalization(snapshot,contract,owned.patch,owned.assets,true);
    }catch{
      throw new UnprocessableEntityException("PERSONALIZATION_INCOMPLETE");
    }
    const expectedKeys=new Set(Object.values(document.assets)
      .map(asset=>asset.storageKey).filter(key=>key.startsWith("asset:")));
    for(const node of Object.values(document.nodes))if(node.type==="widget"&&node.block.kind==="music"&&node.block.source.startsWith("asset:"))
      expectedKeys.add(node.block.source);
    const ids=[...expectedKeys].map(key=>key.slice(6));
    const assets=ids.length?await this.db.mediaAsset.findMany({
      where:{id:{in:ids},status:"READY",workspaceId:{in:[draft.workspaceId,version.template.workspaceId]}},
      select:{id:true,workspaceId:true,uploadedById:true},
    }):[];
    if(assets.length!==ids.length)throw new UnprocessableEntityException("PUBLICATION_MEDIA_UNAVAILABLE");
    const personalIds=new Set(owned.assets.map(asset=>asset.storageKey.slice(6)));
    if(assets.some(asset=>personalIds.has(asset.id)
      ?asset.workspaceId!==draft.workspaceId||asset.uploadedById!==userId
      :asset.workspaceId!==version.template.workspaceId))
      throw new UnprocessableEntityException("PUBLICATION_MEDIA_OWNERSHIP");

    const sha256=snapshotHash(document);
    try{
      return await this.db.$transaction(async tx=>{
        const current=await tx.invitationDraft.findFirst({
          where:{id:draftId,ownerId:userId},select:{revision:true},
        });
        if(!current||current.revision!==input.expectedRevision)
          throw new ConflictException("DRAFT_REVISION_CONFLICT");
        let publication=await tx.customerPublication.findUnique({
          where:{draftId},select:{id:true,slug:true,latestRelease:true},
        });
        if(publication){
          if(publication.slug!==input.slug)throw new ConflictException("PUBLIC_SLUG_IMMUTABLE");
          if(publication.latestRelease!==input.expectedRelease)throw new ConflictException("RELEASE_CONFLICT");
          const changed=await tx.customerPublication.updateMany({
            where:{id:publication.id,latestRelease:input.expectedRelease},
            data:{latestRelease:{increment:1},status:"ACTIVE"},
          });
          if(changed.count!==1)throw new ConflictException("RELEASE_CONFLICT");
        }else{
          if(input.expectedRelease!==0)throw new ConflictException("RELEASE_CONFLICT");
          publication=await tx.customerPublication.create({
            data:{draftId,ownerId:userId,slug:input.slug,latestRelease:1,status:"ACTIVE"},
            select:{id:true,slug:true,latestRelease:true},
          });
        }
        const number=input.expectedRelease+1;
        await tx.customerPublicationRelease.create({
          data:{publicationId:publication.id,number,draftRevision:draft.revision,
            snapshot:json(document),sha256},
        });
        return {id:publication.id,slug:publication.slug,status:"ACTIVE" as const,
          latestRelease:number,draftRevision:draft.revision};
      },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    }catch(error){return conflict(error);}
  }

  async unpublish(userId:string,draftId:string,expectedRelease:number){
    const result=await this.db.customerPublication.updateMany({
      where:{draftId,ownerId:userId,latestRelease:expectedRelease,status:"ACTIVE"},
      data:{status:"UNPUBLISHED"},
    });
    if(result.count!==1)throw new ConflictException("PUBLICATION_UNPUBLISH_CONFLICT");
    return {status:"UNPUBLISHED" as const,latestRelease:expectedRelease};
  }

  async getPublic(slug:string){
    const publication=await this.db.customerPublication.findUnique({
      where:{slug},select:{
        id:true,status:true,latestRelease:true,slug:true,
        draft:{select:{workspaceId:true,templateVersion:{
          select:{template:{select:{workspaceId:true}}}}}},
      },
    });
    if(!publication||publication.status!=="ACTIVE"||publication.latestRelease<1)
      throw new NotFoundException("INVITATION_NOT_FOUND");
    const release=await this.db.customerPublicationRelease.findUnique({
      where:{publicationId_number:{publicationId:publication.id,number:publication.latestRelease}},
      select:{snapshot:true,number:true,sha256:true},
    });
    if(!release)throw new NotFoundException("INVITATION_NOT_FOUND");
    const document=validatedDocument(release.snapshot);
    if(snapshotHash(document)!==release.sha256)
      throw new ServiceUnavailableException("RELEASE_INTEGRITY_MISMATCH");

    const keys=new Set(Object.values(document.assets)
      .map(asset=>asset.storageKey).filter(key=>key.startsWith("asset:")));
    for(const node of Object.values(document.nodes))if(node.type==="widget"&&node.block.kind==="music"&&node.block.source.startsWith("asset:"))
      keys.add(node.block.source);
    const ids=[...keys].map(key=>key.slice(6));
    const rows=ids.length?await this.db.mediaAsset.findMany({
      where:{id:{in:ids},status:"READY",workspaceId:{in:[
        publication.draft.workspaceId,publication.draft.templateVersion.template.workspaceId,
      ]}},select:{id:true,storageKey:true,mimeType:true},
    }):[];
    if(rows.length!==ids.length)throw new ServiceUnavailableException("RELEASE_MEDIA_UNAVAILABLE");
    const mediaUrls:Record<string,string>={};
    await Promise.all(rows.map(async asset=>{
      mediaUrls["asset:"+asset.id]=await this.store.signRead(asset.storageKey,asset.mimeType);
    }));
    const siteKey=this.challenge.siteKey();
    return {slug:publication.slug,release:release.number,sha256:release.sha256,
      document,mediaUrls,rsvpEnabled:!!siteKey||process.env.NODE_ENV!=="production",turnstileSiteKey:siteKey};
  }
}
