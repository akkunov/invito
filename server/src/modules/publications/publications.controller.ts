import {Body, Controller, Get, Header, Inject, Param, Post, Query, Req} from "@nestjs/common";
import type {AuthenticatedRequest} from "../auth/auth.types.js";
import {Public} from "../auth/public.decorator.js";
import {PublicationsService} from "./publications.service.js";
import {
  createPublicationSchema,unpublishSchema,rsvpSchema,parseInput,pagingInput,
} from "./publications-input.js";

@Controller()
export class PublicationsController {
  constructor(@Inject(PublicationsService) private readonly service:PublicationsService){}

  @Get("projects/:projectId/publication")
  @Header("Cache-Control","private, no-store")
  ownerPublication(@Req() req:AuthenticatedRequest,@Param("projectId") id:string){
    return this.service.getOwnerPublication(req.user.id,id);
  }

  @Post("projects/:projectId/publish")
  @Header("Cache-Control","private, no-store")
  publish(@Req() req:AuthenticatedRequest,@Param("projectId") id:string,@Body() body:unknown){
    return this.service.publish(req.user.id,id,parseInput(createPublicationSchema,body));
  }

  @Post("projects/:projectId/unpublish")
  @Header("Cache-Control","private, no-store")
  unpublish(@Req() req:AuthenticatedRequest,@Param("projectId") id:string,@Body() body:unknown){
    const {expectedRelease}=parseInput(unpublishSchema,body);
    return this.service.unpublish(req.user.id,id,expectedRelease);
  }

  @Get("projects/:projectId/rsvp")
  @Header("Cache-Control","private, no-store")
  listRsvp(@Req() req:AuthenticatedRequest,@Param("projectId") id:string,@Query() q:unknown){
    const {page,limit}=parseInput(pagingInput,q);
    return this.service.listRsvp(req.user.id,id,page,limit);
  }

  @Get("projects/:projectId/rsvp/summary")
  @Header("Cache-Control","private, no-store")
  summary(@Req() req:AuthenticatedRequest,@Param("projectId") id:string){
    return this.service.rsvpSummary(req.user.id,id);
  }

  @Public()
  @Get("public/invitations/:slug")
  @Header("Cache-Control","public, no-store, max-age=0")
  guest(@Param("slug") slug:string){
    return this.service.getPublic(slug);
  }

  @Public()
  @Post("public/invitations/:slug/rsvp")
  @Header("Cache-Control","no-store")
  guestRsvp(@Param("slug") slug:string,@Body() body:unknown){
    return this.service.rsvp(slug,parseInput(rsvpSchema,body));
  }
}
