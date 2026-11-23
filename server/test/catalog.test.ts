import assert from "node:assert/strict";
import {test} from "node:test";
import {NotFoundException} from "@nestjs/common";
import {CatalogService} from "../src/modules/catalog/catalog.service.js";

test("catalog lists published templates without exposing draft documents", async()=>{
  const calls:unknown[]=[];
  const prisma={
    template:{
      count:async({where}:any)=>{calls.push(where);return 1;},
      findMany:async({where}:any)=>{calls.push(where);return [{
        id:"example-template",workspaceId:"workspace",publicSlug:"editorial-ivory",
        name:"Editorial Ivory",description:"Wedding",category:"WEDDING",
        tags:["wedding"],latestVersion:1,updatedAt:new Date("2026-11-23T00:00:00.000Z"),
        versions:[],
      }];},
    },
  };
  const service=new CatalogService(prisma as never,{signRead:async()=>""} as never,{} as never);
  const result=await service.list({category:"WEDDING",page:1,limit:12});
  assert.equal(result.items[0]?.slug,"editorial-ivory");
  assert.equal(result.items[0]?.coverUrl,null);
  assert.equal("document" in result.items[0]!,false);
  assert.equal(result.total,1);
  assert.ok(calls.every((where:any)=>where.status==="PUBLISHED"&&where.publicSlug.not===null));
});

test("catalog refuses absent or unpublished public slugs",async()=>{
  const service=new CatalogService({
    template:{findUnique:async()=>({status:"DRAFT",versions:[]})},
  } as never,{} as never,{} as never);
  await assert.rejects(()=>service.detail("draft-only"),NotFoundException);
});

test("template publication requires Workspace admin before database reads",async()=>{
  let accessed=false;
  const service=new CatalogService({template:{findFirst:async()=>{accessed=true;}}} as never,
    {} as never,{member:async()=>{throw new Error("DENIED");}} as never);
  await assert.rejects(()=>service.publish("user","workspace","template","editorial-ivory"),/DENIED/);
  assert.equal(accessed,false);
});
