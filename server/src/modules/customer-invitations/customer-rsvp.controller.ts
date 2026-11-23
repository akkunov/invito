import {Body,Controller,Get,Header,Inject,Param,Post,Query,Req} from "@nestjs/common";
import {z} from "zod";
import type {AuthenticatedRequest} from "../auth/auth.types.js";
import {Public} from "../auth/public.decorator.js";
import {parseInput,pagingInput} from "../documents/documents-input.js";
import {rsvpSchema} from "../publications/publications-input.js";
import {CustomerRsvpService} from "./customer-rsvp.service.js";
const slug=z.string().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const uuid=z.uuid();

@Controller()
export class CustomerRsvpController {
  constructor(@Inject(CustomerRsvpService) private readonly service:CustomerRsvpService){}

  @Public()
  @Post("public/customer-invitations/:slug/rsvp")
  @Header("Cache-Control","no-store")
  submit(@Param("slug") value:string,@Body() body:unknown){
    return this.service.submit(parseInput(slug,value),parseInput(rsvpSchema,body));
  }

  @Get("customer/invitations/:id/rsvp/summary")
  @Header("Cache-Control","no-store")
  summary(@Req() req:AuthenticatedRequest,@Param("id") id:string){
    return this.service.summary(req.user.id,parseInput(uuid,id));
  }

  @Get("customer/invitations/:id/rsvp")
  @Header("Cache-Control","no-store")
  list(@Req() req:AuthenticatedRequest,@Param("id") id:string,@Query() query:unknown){
    const {page,limit}=parseInput(pagingInput,query);
    return this.service.list(req.user.id,parseInput(uuid,id),page,limit);
  }
}
