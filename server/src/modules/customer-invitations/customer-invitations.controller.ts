import {Body,Controller,Get,Header,Inject,Param,Patch,Post,Req} from "@nestjs/common";
import {z} from "zod";
import {parseInput} from "../documents/documents-input.js";
import {startUploadInput} from "../media/media.controller.js";
import type {AuthenticatedRequest} from "../auth/auth.types.js";
import {CustomerInvitationsService} from "./customer-invitations.service.js";

const uuid=z.uuid();
export const createCustomerInvitationSchema=z.strictObject({templateVersionId:uuid});
export const updateCustomerInvitationSchema=z.strictObject({expectedRevision:z.number().int().min(1),patch:z.unknown()});
const customerPhotoSchema=startUploadInput.refine(d=>d.mimeType!=="audio/mpeg", "Images only");

@Controller("customer")
export class CustomerInvitationsController {
  constructor(@Inject(CustomerInvitationsService) private readonly service:CustomerInvitationsService){}

  @Post("invitations")
  @Header("Cache-Control","no-store")
  create(@Req() request:AuthenticatedRequest,@Body() body:unknown){
    const {templateVersionId}=parseInput(createCustomerInvitationSchema,body);
    return this.service.create(request.user.id,templateVersionId);
  }

  @Get("invitations")
  @Header("Cache-Control","no-store")
  list(@Req() request:AuthenticatedRequest){return this.service.list(request.user.id);}

  @Get("invitations/:id")
  @Header("Cache-Control","no-store")
  get(@Req() request:AuthenticatedRequest,@Param("id") id:string){
    return this.service.get(request.user.id,parseInput(uuid,id));
  }

  @Patch("invitations/:id")
  @Header("Cache-Control","no-store")
  save(@Req() request:AuthenticatedRequest,@Param("id") id:string,@Body() body:unknown){
    const {expectedRevision,patch}=parseInput(updateCustomerInvitationSchema,body);
    return this.service.save(request.user.id,parseInput(uuid,id),expectedRevision,patch);
  }

  @Post("media/uploads")
  @Header("Cache-Control","no-store")
  startPhoto(@Req() request:AuthenticatedRequest,@Body() body:unknown){
    const input=parseInput(customerPhotoSchema,body);
    if(input.mimeType==="audio/mpeg")throw new Error("UNREACHABLE");
    return this.service.startPhoto(request.user.id,input as {name:string;mimeType:"image/jpeg"|"image/png"|"image/webp";bytes:number;sha256:string});
  }

  @Post("media/:id/complete")
  @Header("Cache-Control","no-store")
  completePhoto(@Req() request:AuthenticatedRequest,@Param("id") id:string){
    return this.service.completePhoto(request.user.id,parseInput(uuid,id));
  }
}
