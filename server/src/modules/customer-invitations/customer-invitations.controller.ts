import {Body,Controller,Get,Header,Inject,Param,Patch,Post,Query,Req} from "@nestjs/common";
import {z} from "zod";
import {parseInput} from "../documents/documents-input.js";
import {startUploadInput} from "../media/media.controller.js";
import type {AuthenticatedRequest} from "../auth/auth.types.js";
import {CustomerInvitationsService} from "./customer-invitations.service.js";
import {personalizationPatchSchema} from "../../../../src/features/studio-v2/core/personalization.schema.js";

const uuid=z.uuid();
export const accountOverviewQuery=z.strictObject({
  page:z.coerce.number().int().min(1).max(10000).default(1),
  limit:z.coerce.number().int().min(1).max(24).default(8),
});
export const createCustomerInvitationSchema=z.strictObject({templateVersionId:uuid,patch:personalizationPatchSchema.optional()});
export const updateCustomerInvitationSchema=z.strictObject({expectedRevision:z.number().int().min(1),patch:personalizationPatchSchema});

@Controller("customer")
export class CustomerInvitationsController {
  constructor(@Inject(CustomerInvitationsService) private readonly service:CustomerInvitationsService){}

  @Get("account/overview")
  @Header("Cache-Control","private, no-store")
  overview(@Req() request:AuthenticatedRequest,@Query() query:unknown){
    const {page,limit}=parseInput(accountOverviewQuery,query);
    return this.service.overview(request.user.id,page,limit);
  }

  @Post("invitations")
  @Header("Cache-Control","no-store")
  create(@Req() request:AuthenticatedRequest,@Body() body:unknown){
    const {templateVersionId,patch}=parseInput(createCustomerInvitationSchema,body);
    return this.service.create(request.user.id,templateVersionId,patch);
  }

  @Get("invitations")
  @Header("Cache-Control","no-store")
  list(@Req() request:AuthenticatedRequest){return this.service.list(request.user.id);}

  @Get("invitations/:id")
  @Header("Cache-Control","no-store")
  get(@Req() request:AuthenticatedRequest,@Param("id") id:string){
    return this.service.get(request.user.id,parseInput(uuid,id));
  }

  @Get("invitations/:id/editor-source")
  @Header("Cache-Control","private, no-store")
  editorSource(@Req() request:AuthenticatedRequest,@Param("id") id:string){
    return this.service.editorSource(request.user.id,parseInput(uuid,id));
  }

  @Patch("invitations/:id")
  @Header("Cache-Control","no-store")
  save(@Req() request:AuthenticatedRequest,@Param("id") id:string,@Body() body:unknown){
    const {expectedRevision,patch}=parseInput(updateCustomerInvitationSchema,body);
    return this.service.save(request.user.id,parseInput(uuid,id),expectedRevision,patch);
  }

  @Post("media/uploads")
  @Header("Cache-Control","no-store")
  startMedia(@Req() request:AuthenticatedRequest,@Body() body:unknown){
    const input=parseInput(startUploadInput,body);
    return this.service.startMedia(request.user.id,input);
  }

  @Get("media/:id/read-url")
  @Header("Cache-Control","no-store")
  mediaUrl(@Req() request:AuthenticatedRequest,@Param("id") id:string){
    return this.service.mediaUrl(request.user.id,parseInput(uuid,id));
  }

  @Post("media/:id/complete")
  @Header("Cache-Control","no-store")
  completeMedia(@Req() request:AuthenticatedRequest,@Param("id") id:string){
    return this.service.completeMedia(request.user.id,parseInput(uuid,id));
  }
}
