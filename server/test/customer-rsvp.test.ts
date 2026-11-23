import assert from "node:assert/strict";
import {test} from "node:test";
import {NotFoundException} from "@nestjs/common";
import {CustomerRsvpService} from "../src/modules/customer-invitations/customer-rsvp.service.js";

test("RSVP list rejects requests without an owned customer publication",async()=>{
  let checked:unknown;
  const db={customerPublication:{findFirst:async(args:{where:unknown})=>{
    checked=args.where;return null;
  }}};
  const service=new CustomerRsvpService(db as never,{} as never);
  await assert.rejects(()=>service.list("owner-A","draft-B",1,20),NotFoundException);
  assert.deepEqual(checked,{draftId:"draft-B",ownerId:"owner-A"});
});

test("RSVP summary filters by authenticated owner",async()=>{
  let checked:unknown;
  const db={customerPublication:{findFirst:async(args:{where:unknown})=>{
    checked=args.where;return null;
  }}};
  const service=new CustomerRsvpService(db as never,{} as never);
  await assert.rejects(()=>service.summary("owner-A","draft-B"),NotFoundException);
  assert.deepEqual(checked,{draftId:"draft-B",ownerId:"owner-A"});
});

test("guest RSVP rejects inactive customer invitation before accepting a submission",async()=>{
  const db={customerPublication:{findUnique:async()=>({
    id:"pub-A",status:"UNPUBLISHED",latestRelease:1,
  })}};
  const service=new CustomerRsvpService(db as never,{} as never);
  await assert.rejects(()=>service.submit("hidden-event",{
    requestId:"93c8c11b-09a1-47d1-9b24-8297dd73891b",nodeId:"rsvp",
    name:"Guest",attendance:"yes",guests:1,website:"",
  }),NotFoundException);
});

test("honeypot RSVP does not create a database response",async()=>{
  const service=new CustomerRsvpService({} as never,{} as never);
  assert.deepEqual(await service.submit("event",{
    requestId:"93c8c11b-09a1-47d1-9b24-8297dd73891b",nodeId:"rsvp",
    name:"bot",attendance:"yes",guests:1,website:"spam",
  }),{accepted:true});
});
