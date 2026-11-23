import assert from "node:assert/strict";
import {test} from "node:test";
import {ConflictException,NotFoundException} from "@nestjs/common";
import {CustomerPublicationService} from "../src/modules/customer-invitations/customer-publication.service.js";

test("publication owner lookup only queries drafts belonging to user",async()=>{
  let where:unknown=null;
  const db={invitationDraft:{findFirst:async(args:{where:unknown})=>{
    where=args.where;return null;
  }}};
  const service=new CustomerPublicationService(db as never,{} as never,{} as never);
  await assert.rejects(()=>service.getOwner("owner-1","draft-1"),NotFoundException);
  assert.deepEqual(where,{id:"draft-1",ownerId:"owner-1"});
});

test("publishing a foreign draft cannot read its content",async()=>{
  let where:unknown=null;
  const db={invitationDraft:{findFirst:async(args:{where:unknown})=>{
    where=args.where;return null;
  }}};
  const service=new CustomerPublicationService(db as never,{} as never,{} as never);
  await assert.rejects(()=>service.publish("owner-1","draft-2",{
    slug:"private-event",expectedRevision:1,expectedRelease:0,
  }),NotFoundException);
  assert.deepEqual(where,{id:"draft-2",ownerId:"owner-1"});
});

test("unpublishing enforces owner, release CAS and ACTIVE status",async()=>{
  let where:unknown=null;
  const db={customerPublication:{updateMany:async(args:{where:unknown})=>{
    where=args.where;return {count:0};
  }}};
  const service=new CustomerPublicationService(db as never,{} as never,{} as never);
  await assert.rejects(()=>service.unpublish("owner-1","draft-2",7),ConflictException);
  assert.deepEqual(where,{
    draftId:"draft-2",ownerId:"owner-1",latestRelease:7,status:"ACTIVE",
  });
});

test("anonymous access refuses unpublished or missing customer releases",async()=>{
  const db={customerPublication:{findUnique:async()=>({
    status:"UNPUBLISHED",latestRelease:3,
  })}};
  const service=new CustomerPublicationService(db as never,{} as never,{} as never);
  await assert.rejects(()=>service.getPublic("example-event"),NotFoundException);
});
