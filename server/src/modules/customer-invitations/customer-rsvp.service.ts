import {ConflictException,HttpException,Inject,Injectable,NotFoundException,UnprocessableEntityException} from "@nestjs/common";
import {Prisma} from "../../generated/prisma/client.js";
import {PrismaService} from "../../database/prisma.service.js";
import {RsvpChallengeService} from "../publications/rsvp-challenge.service.js";
import {validatedDocument,snapshotHash} from "../documents/documents-input.js";
import type {z} from "zod";
import type {rsvpSchema} from "../publications/publications-input.js";

type Input=z.infer<typeof rsvpSchema>;
@Injectable()
export class CustomerRsvpService {
  constructor(
    @Inject(PrismaService) private readonly db:PrismaService,
    @Inject(RsvpChallengeService) private readonly challenge:RsvpChallengeService,
  ){}

  private async active(slug:string){
    const publication=await this.db.customerPublication.findUnique({
      where:{slug},select:{id:true,status:true,latestRelease:true},
    });
    if(!publication||publication.status!=="ACTIVE"||publication.latestRelease<1)
      throw new NotFoundException("INVITATION_NOT_FOUND");
    const release=await this.db.customerPublicationRelease.findUnique({
      where:{publicationId_number:{publicationId:publication.id,number:publication.latestRelease}},
      select:{snapshot:true,sha256:true},
    });
    if(!release)throw new NotFoundException("INVITATION_NOT_FOUND");
    const document=validatedDocument(release.snapshot);
    if(snapshotHash(document)!==release.sha256)throw new ConflictException("RELEASE_INTEGRITY_MISMATCH");
    return {publication,document};
  }

  async submit(slug:string,input:Input){
    if(input.website)return {accepted:true};
    const {publication,document}=await this.active(slug);
    const node=document.nodes[input.nodeId];
    if(!node||node.type!=="widget"||node.block.kind!=="rsvp"||!node.visible)
      throw new NotFoundException("RSVP_WIDGET_NOT_FOUND");
    if(node.block.deadline&&Date.now()>=Date.parse(node.block.deadline))
      throw new ConflictException("RSVP_CLOSED");
    if(input.guests>node.block.maxGuests)
      throw new UnprocessableEntityException("RSVP_GUEST_LIMIT");

    if(input.wish&&!node.block.wish)throw new UnprocessableEntityException("RSVP_WISH_UNAVAILABLE");
    const attendance=input.attendance==="yes"?"YES" as const:"NO" as const;
    const values={guestName:input.name,guestCount:input.guests,attendance,nodeId:input.nodeId,...(node.block.wish?{wish:input.wish||null}:{})};
    const prior=await this.db.customerRsvpResponse.findUnique({
      where:{publicationId_requestId:{publicationId:publication.id,requestId:input.requestId}},
      select:{id:true,guestName:true,guestCount:true,attendance:true,nodeId:true,wish:true},
    });
    if(prior){
      if(Object.entries(values).some(([key,value])=>prior[key as keyof typeof values]!==value))
        throw new ConflictException("RSVP_REQUEST_ID_REUSED");
      return {accepted:true,receiptId:prior.id};
    }
    await this.challenge.verify(input.turnstileToken);
    const bucket=new Date(Math.floor(Date.now()/60000)*60000);
    try{
      return await this.db.$transaction(async tx=>{
        const current=await tx.customerPublication.findUnique({
          where:{id:publication.id},select:{status:true,latestRelease:true},
        });
        if(!current||current.status!=="ACTIVE"||current.latestRelease!==publication.latestRelease)
          throw new NotFoundException("INVITATION_NOT_FOUND");
        const existing=await tx.customerRsvpResponse.findUnique({
          where:{publicationId_requestId:{publicationId:publication.id,requestId:input.requestId}},
          select:{id:true,guestName:true,guestCount:true,attendance:true,nodeId:true,wish:true},
        });
        if(existing){
          if(Object.entries(values).some(([key,value])=>existing[key as keyof typeof values]!==value))
            throw new ConflictException("RSVP_REQUEST_ID_REUSED");
          return {accepted:true,receiptId:existing.id};
        }
        const rate=await tx.customerRsvpThrottle.upsert({
          where:{publicationId_bucket:{publicationId:publication.id,bucket}},
          create:{publicationId:publication.id,bucket,count:1},
          update:{count:{increment:1}},select:{count:true},
        });
        if(rate.count>60)throw new HttpException("RSVP_RATE_LIMIT",429);
        const stored=await tx.customerRsvpResponse.create({
          data:{publicationId:publication.id,requestId:input.requestId,...values},
          select:{id:true},
        });
        return {accepted:true,receiptId:stored.id};
      },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    }catch(error){
      if(error&&typeof error==="object"&&"code" in error&&["P2002","P2034"].includes(String(error.code)))
        throw new ConflictException("RSVP_CONFLICT_RETRY");
      throw error;
    }
  }

  private async owner(userId:string,draftId:string){
    const publication=await this.db.customerPublication.findFirst({
      where:{draftId,ownerId:userId},select:{id:true,status:true,latestRelease:true},
    });
    if(!publication)throw new NotFoundException("PUBLICATION_NOT_FOUND");
    return publication;
  }

  async summary(userId:string,draftId:string){
    const publication=await this.owner(userId,draftId);
    const groups=await this.db.customerRsvpResponse.groupBy({
      by:["attendance"],where:{publicationId:publication.id},
      _count:{_all:true},_sum:{guestCount:true},
    });
    return {
      responses:groups.reduce((total,group)=>total+group._count._all,0),
      attending:groups.find(group=>group.attendance==="YES")?._sum.guestCount??0,
      declined:groups.find(group=>group.attendance==="NO")?._count._all??0,
    };
  }

  async list(userId:string,draftId:string,page:number,limit:number){
    const publication=await this.owner(userId,draftId);
    const rows=await this.db.customerRsvpResponse.findMany({
      where:{publicationId:publication.id},orderBy:[{createdAt:"desc"},{id:"asc"}],
      skip:(page-1)*limit,take:limit+1,
      select:{id:true,guestName:true,attendance:true,guestCount:true,nodeId:true,wish:true,createdAt:true},
    });
    return {items:rows.slice(0,limit),nextPage:rows.length>limit?page+1:null};
  }
}
