import {Body, Controller, Get, Inject, Param, Post, Query, Req} from "@nestjs/common";
import {z} from "zod";
import {Public} from "../auth/public.decorator.js";
import type {AuthenticatedRequest} from "../auth/auth.types.js";
import {parseInput} from "../documents/documents-input.js";
import {CatalogService} from "./catalog.service.js";

export const catalogQuerySchema=z.strictObject({
  category:z.enum(["WEDDING","KYZ_UZATUU","BIRTHDAY","ANNIVERSARY","CORPORATE","OTHER"]).optional(),
  search:z.string().trim().max(100).optional(),
  page:z.coerce.number().int().min(1).max(10000).default(1),
  limit:z.coerce.number().int().min(1).max(48).default(12),
});
const slugSchema=z.string().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const catalogPublishSchema=z.strictObject({publicSlug:slugSchema});

@Controller()
export class CatalogController {
  constructor(@Inject(CatalogService) private readonly catalog:CatalogService){}

  @Public()
  @Get("catalog/templates")
  list(@Query() query:unknown){
    return this.catalog.list(parseInput(catalogQuerySchema,query));
  }

  @Public()
  @Get("catalog/templates/:slug")
  detail(@Param("slug") slug:string){
    return this.catalog.detail(parseInput(slugSchema,slug));
  }

  @Post("workspaces/:workspaceId/templates/:templateId/publish")
  publish(@Req() req:AuthenticatedRequest,@Param("workspaceId") workspaceId:string,
    @Param("templateId") templateId:string,@Body() body:unknown){
    const input=parseInput(catalogPublishSchema,body);
    return this.catalog.publish(req.user.id,workspaceId,templateId,input.publicSlug);
  }
}
