import {Body,Controller,Get,Header,Inject,Param,Post,Req} from "@nestjs/common";
import {z} from "zod";
import type {AuthenticatedRequest} from "../auth/auth.types.js";
import {Public} from "../auth/public.decorator.js";
import {parseInput} from "../documents/documents-input.js";
import {CustomerPublicationService} from "./customer-publication.service.js";

const uuid=z.uuid();
const slug=z.string().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const publishCustomerSchema=z.strictObject({
  slug,expectedRevision:z.number().int().min(1),
  expectedRelease:z.number().int().min(0),
});
export const unpublishCustomerSchema=z.strictObject({
  expectedRelease:z.number().int().min(1),
});

@Controller()
export class CustomerPublicationController {
  constructor(@Inject(CustomerPublicationService) private readonly service:CustomerPublicationService){}

  @Get("customer/invitations/:id/publication")
  @Header("Cache-Control","no-store")
  getOwner(@Req() request:AuthenticatedRequest,@Param("id") id:string){
    return this.service.getOwner(request.user.id,parseInput(uuid,id));
  }

  @Post("customer/invitations/:id/publish")
  @Header("Cache-Control","no-store")
  publish(@Req() request:AuthenticatedRequest,@Param("id") id:string,@Body() body:unknown){
    return this.service.publish(request.user.id,parseInput(uuid,id),parseInput(publishCustomerSchema,body));
  }

  @Post("customer/invitations/:id/unpublish")
  @Header("Cache-Control","no-store")
  unpublish(@Req() request:AuthenticatedRequest,@Param("id") id:string,@Body() body:unknown){
    const {expectedRelease}=parseInput(unpublishCustomerSchema,body);
    return this.service.unpublish(request.user.id,parseInput(uuid,id),expectedRelease);
  }

  @Public()
  @Get("public/customer-invitations/:slug")
  @Header("Cache-Control","no-store")
  getPublic(@Param("slug") publicSlug:string){
    return this.service.getPublic(parseInput(slug,publicSlug));
  }
}
