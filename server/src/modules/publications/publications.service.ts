import {
  ConflictException, HttpException, Inject, Injectable, NotFoundException,
  ServiceUnavailableException, UnprocessableEntityException,
} from "@nestjs/common";
import {Prisma} from "../../generated/prisma/client.js";
import {PrismaService} from "../../database/prisma.service.js";
import {DocumentsAccessService} from "../documents/documents-access.service.js";
import {validatedDocument,verifyAssets,snapshotHash} from "../documents/documents-input.js";
import {MediaObjectStore} from "../media/media-object-store.js";
import {RsvpChallengeService} from "./rsvp-challenge.service.js";
import type {ProjectDocumentV2} from "../../../../src/features/studio-v2/core/document.schema.js";
import type {z} from "zod";
import type {createPublicationSchema,rsvpSchema} from "./publications-input.js";

type PublishInput=z.infer<typeof createPublicationSchema>;
type RsvpInput=z.infer<typeof rsvpSchema>;
type PublicationView={id:string;slug:string;status:"ACTIVE"|"UNPUBLISHED";latestRelease:number};
const MAX_RSVP_PER_MINUTE=60;
const json=(value:unknown)=>value as Prisma.InputJsonValue;

function dbConflict(error:unknown):never {
  if(error && typeof error==="object" && "code" in error &&
     (error.code==="P2002"||error.code==="P2034")) {
    throw new ConflictException("PUBLICATION_CONFLICT_RETRY");
  }
  throw error;
}

@Injectable()
export class PublicationsService {
  constructor(
    @Inject(PrismaService) private readonly db:PrismaService,
    @Inject(DocumentsAccessService) private readonly access:DocumentsAccessService,
    @Inject(MediaObjectStore) private readonly store:MediaObjectStore,
    @Inject(RsvpChallengeService) private readonly challenge:RsvpChallengeService,
  ) {}

  async getOwnerPublication(userId:string,projectId:string) {
    const project=await this.access.project(userId,projectId,"VIEWER");
    const publication=await this.db.publication.findFirst({
      where:{projectId,workspaceId:project.workspaceId},
      select:{id:true,slug:true,status:true,latestRelease:true,updatedAt:true},
    });
    return publication??null;
  }

  async publish(userId:string,projectId:string,input:PublishInput) {
    const project=await this.access.project(userId,projectId,"ADMIN");
    const revision=await this.db.projectRevision.findFirst({
      where:{id:input.projectRevisionId,projectId,project:{workspaceId:project.workspaceId}},
      select:{document:true,sha256:true},
    });
    if(!revision)throw new NotFoundException("REVISION_NOT_FOUND");
    const document=validatedDocument(revision.document);
    await verifyAssets(this.db,project.workspaceId,document);
    const digest=snapshotHash(document);
    if(digest!==revision.sha256)throw new ConflictException("REVISION_INTEGRITY_MISMATCH");
    const requestHash=snapshotHash({projectId,...input});
    const route="publication.publish:"+projectId;
    try {
      return await this.db.$transaction(async tx=>{
        const existing=await tx.idempotencyRecord.findUnique({
          where:{workspaceId_actorId_route_key:{workspaceId:project.workspaceId,actorId:userId,route,key:input.idempotencyKey}},
          select:{requestHash:true,response:true},
        });
        if(existing){
          if(existing.requestHash!==requestHash)throw new ConflictException("IDEMPOTENCY_KEY_REUSED");
          return existing.response as PublicationView;
        }
        // Recheck permission in the same transaction as publication, not only before validation.
        const member=await tx.workspaceMember.findUnique({
          where:{workspaceId_userId:{workspaceId:project.workspaceId,userId}},select:{role:true},
        });
        if(!member||!["OWNER","ADMIN"].includes(member.role))throw new NotFoundException("NOT_FOUND");
        let publication=await tx.publication.findUnique({
          where:{projectId},select:{id:true,slug:true,status:true,latestRelease:true,workspaceId:true},
        });
        let nextRelease:number;
        if(!publication){
          if(input.expectedRelease!==0)throw new ConflictException("RELEASE_CONFLICT");
          publication=await tx.publication.create({
            data:{projectId,workspaceId:project.workspaceId,slug:input.slug,status:"ACTIVE",latestRelease:1},
            select:{id:true,slug:true,status:true,latestRelease:true,workspaceId:true},
          });
          nextRelease=1;
        } else {
          if(publication.workspaceId!==project.workspaceId)throw new NotFoundException();
          if(publication.slug!==input.slug)throw new ConflictException("PUBLICATION_SLUG_IMMUTABLE");
          if(publication.latestRelease!==input.expectedRelease)throw new ConflictException("RELEASE_CONFLICT");
          const change=await tx.publication.updateMany({
            where:{id:publication.id,latestRelease:input.expectedRelease},
            data:{latestRelease:{increment:1},status:"ACTIVE"},
          });
          if(change.count!==1)throw new ConflictException("RELEASE_CONFLICT");
          nextRelease=input.expectedRelease+1;
        }
        await tx.publicationRelease.create({
          data:{
            publicationId:publication.id,projectRevisionId:input.projectRevisionId,
            number:nextRelease,snapshot:json(document),sha256:digest,createdById:userId,
          },
        });
        const outcome:PublicationView={id:publication.id,slug:publication.slug,status:"ACTIVE",latestRelease:nextRelease};
        await tx.idempotencyRecord.create({data:{
          workspaceId:project.workspaceId,actorId:userId,route,key:input.idempotencyKey,
          requestHash,response:json(outcome),expiresAt:new Date(Date.now()+48*3600*1000),
        }});
        await tx.auditEvent.create({data:{
          workspaceId:project.workspaceId,actorId:userId,action:"publication.release",
          entity:"Publication",entityId:publication.id,metadata:{release:nextRelease,revisionId:input.projectRevisionId},
        }});
        return outcome;
      },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    } catch(error){return dbConflict(error);}
  }

  async unpublish(userId:string,projectId:string,expectedRelease:number) {
    const project=await this.access.project(userId,projectId,"ADMIN");
    try{
      return await this.db.$transaction(async tx=>{
        const member=await tx.workspaceMember.findUnique({
          where:{workspaceId_userId:{workspaceId:project.workspaceId,userId}},select:{role:true},
        });
        if(!member||!["OWNER","ADMIN"].includes(member.role))throw new NotFoundException();
        const pub=await tx.publication.findUnique({where:{projectId},
          select:{id:true,latestRelease:true,status:true,slug:true,workspaceId:true}});
        if(!pub||pub.workspaceId!==project.workspaceId)throw new NotFoundException();
        if(pub.latestRelease!==expectedRelease)throw new ConflictException("RELEASE_CONFLICT");
        if(pub.status==="UNPUBLISHED")return {id:pub.id,status:"UNPUBLISHED" as const,latestRelease:pub.latestRelease};
        const result=await tx.publication.updateMany({
          where:{id:pub.id,status:"ACTIVE",latestRelease:expectedRelease},data:{status:"UNPUBLISHED"},
        });
        if(result.count!==1)throw new ConflictException("RELEASE_CONFLICT");
        await tx.auditEvent.create({data:{workspaceId:project.workspaceId,actorId:userId,
          action:"publication.unpublish",entity:"Publication",entityId:pub.id}});
        return {id:pub.id,status:"UNPUBLISHED" as const,latestRelease:pub.latestRelease};
      },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    }catch(error){return dbConflict(error);}
  }

  private async active(slug:string) {
    const pub=await this.db.publication.findUnique({
      where:{slug},select:{id:true,slug:true,status:true,workspaceId:true,latestRelease:true},
    });
    if(!pub||pub.status!=="ACTIVE"||pub.latestRelease<1)throw new NotFoundException("INVITATION_NOT_FOUND");
    const release=await this.db.publicationRelease.findFirst({
      where:{publicationId:pub.id,number:pub.latestRelease},
      select:{number:true,snapshot:true,sha256:true},
    });
    if(!release)throw new NotFoundException("INVITATION_NOT_FOUND");
    const document=validatedDocument(release.snapshot);
    if(snapshotHash(document)!==release.sha256)throw new ServiceUnavailableException("RELEASE_INTEGRITY_MISMATCH");
    return {pub,release,document};
  }

  /** Only active, immutable releases are ever served to anonymous guests. */
  async getPublic(slug:string) {
    const {pub,release,document}=await this.active(slug);
    const keys=new Set<string>();
    for(const asset of Object.values(document.assets))if(asset.storageKey.startsWith("asset:"))keys.add(asset.storageKey);
    for(const node of Object.values(document.nodes))if(node.type==="widget"&&node.block.kind==="music"&&
      node.block.source.startsWith("asset:"))keys.add(node.block.source);
    const ids=[...keys].map(k=>k.slice(6));
    const assets=ids.length?await this.db.mediaAsset.findMany({
      where:{id:{in:ids},workspaceId:pub.workspaceId,status:"READY"},
      select:{id:true,storageKey:true,mimeType:true},
    }):[];
    if(assets.length!==ids.length)throw new ServiceUnavailableException("RELEASE_MEDIA_UNAVAILABLE");
    const mediaUrls:Record<string,string>={};
    await Promise.all(assets.map(async asset=>{
      mediaUrls["asset:"+asset.id]=await this.store.signRead(asset.storageKey,asset.mimeType);
    }));
    const siteKey=this.challenge.siteKey();
    return {slug:pub.slug,release:release.number,sha256:release.sha256,document,mediaUrls,
      rsvpEnabled:!!siteKey||process.env.NODE_ENV!=="production",
      turnstileSiteKey:siteKey};
  }

  async rsvp(slug:string,input:RsvpInput){
    if(input.website)return {accepted:true}; // trap bots; do not reveal submission status
    const {pub,document}=await this.active(slug);
    const node=document.nodes[input.nodeId];
    if(!node||node.type!=="widget"||node.block.kind!=="rsvp"||!node.visible) {
      throw new NotFoundException("RSVP_WIDGET_NOT_FOUND");
    }
    if(node.block.deadline&&Date.now()>=Date.parse(node.block.deadline)) {
      throw new ConflictException("RSVP_CLOSED");
    }
    if(input.guests>node.block.maxGuests)throw new UnprocessableEntityException("RSVP_GUEST_LIMIT");
    const attendance=input.attendance==="yes"?"YES" as const:"NO" as const;
    const values={guestName:input.name,guestCount:input.guests,attendance,nodeId:input.nodeId};
    // On network retries the same client requestId must not duplicate a guest.
    const previous=await this.db.rsvpResponse.findUnique({
      where:{publicationId_requestId:{publicationId:pub.id,requestId:input.requestId}},
      select:{id:true,guestName:true,guestCount:true,attendance:true,nodeId:true},
    });
    if(previous){
      if(Object.entries(values).some(([k,v])=>previous[k as keyof typeof values]!==v)){
        throw new ConflictException("RSVP_REQUEST_ID_REUSED");
      }
      return {accepted:true,receiptId:previous.id};
    }
    await this.challenge.verify(input.turnstileToken);
    const bucket=new Date(Math.floor(Date.now()/60000)*60000);
    try{
      return await this.db.$transaction(async tx=>{
        // Unpublish must take effect even if it races the human verification call.
        const current=await tx.publication.findUnique({where:{id:pub.id},select:{status:true,latestRelease:true}});
        if(!current||current.status!=="ACTIVE"||current.latestRelease!==pub.latestRelease){
          throw new NotFoundException("INVITATION_NOT_FOUND");
        }
        const prior=await tx.rsvpResponse.findUnique({
          where:{publicationId_requestId:{publicationId:pub.id,requestId:input.requestId}},
          select:{id:true,guestName:true,guestCount:true,attendance:true,nodeId:true},
        });
        if(prior) {
          if(Object.entries(values).some(([k,v])=>prior[k as keyof typeof values]!==v))throw new ConflictException("RSVP_REQUEST_ID_REUSED");
          return {accepted:true,receiptId:prior.id};
        }
        const rate=await tx.rsvpThrottle.upsert({
          where:{publicationId_bucket:{publicationId:pub.id,bucket}},
          create:{publicationId:pub.id,bucket,count:1},
          update:{count:{increment:1}},select:{count:true},
        });
        if(rate.count>MAX_RSVP_PER_MINUTE)throw new HttpException("RSVP_RATE_LIMIT",429);
        const stored=await tx.rsvpResponse.create({data:{
          publicationId:pub.id,requestId:input.requestId,nodeId:input.nodeId,
          guestName:input.name,attendance,guestCount:input.guests,
        },select:{id:true}});
        return {accepted:true,receiptId:stored.id};
      },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    }catch(error){return dbConflict(error);}
  }

  async listRsvp(userId:string,projectId:string,page:number,limit:number) {
    const project=await this.access.project(userId,projectId,"EDITOR");
    const pub=await this.db.publication.findFirst({
      where:{projectId,workspaceId:project.workspaceId},select:{id:true},
    });
    if(!pub)throw new NotFoundException("PUBLICATION_NOT_FOUND");
    const responses=await this.db.rsvpResponse.findMany({
      where:{publicationId:pub.id},
      orderBy:[{createdAt:"desc"},{id:"asc"}],skip:(page-1)*limit,take:limit+1,
      select:{id:true,guestName:true,nodeId:true,attendance:true,guestCount:true,message:true,createdAt:true},
    });
    return {items:responses.slice(0,limit),nextPage:responses.length>limit?page+1:null};
  }

  async rsvpSummary(userId:string,projectId:string) {
    const project=await this.access.project(userId,projectId,"EDITOR");
    const pub=await this.db.publication.findFirst({
      where:{projectId,workspaceId:project.workspaceId},select:{id:true},
    });
    if(!pub)throw new NotFoundException("PUBLICATION_NOT_FOUND");
    const groups=await this.db.rsvpResponse.groupBy({
      by:["attendance"],where:{publicationId:pub.id},
      _count:{_all:true},_sum:{guestCount:true},
    });
    return {responses:groups.reduce((sum,x)=>sum+x._count._all,0),
      attending:groups.find(x=>x.attendance==="YES")?._sum.guestCount??0,
      declined:groups.find(x=>x.attendance==="NO")?._count._all??0};
  }
}
