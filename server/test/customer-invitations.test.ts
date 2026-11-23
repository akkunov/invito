import assert from "node:assert/strict";
import {test} from "node:test";
import {ForbiddenException,NotFoundException} from "@nestjs/common";
import {CustomerInvitationsService} from "../src/modules/customer-invitations/customer-invitations.service.js";

test("private invitation reads always filter by authenticated owner",async()=>{
  let where:unknown;
  const db={invitationDraft:{findFirst:async(args:{where:unknown})=>{where=args.where;return null;}}};
  const service=new CustomerInvitationsService(db as never,{} as never,{} as never);
  await assert.rejects(()=>service.get("owner-uuid","draft-uuid"),NotFoundException);
  assert.deepEqual(where,{id:"draft-uuid",ownerId:"owner-uuid"});
});

test("private invitation saves never use customer-supplied owner IDs",async()=>{
  let where:unknown;
  const db={invitationDraft:{findFirst:async(args:{where:unknown})=>{where=args.where;return null;}}};
  const service=new CustomerInvitationsService(db as never,{} as never,{} as never);
  await assert.rejects(()=>service.save("owner-uuid","draft-uuid",1,{values:{}}),NotFoundException);
  assert.deepEqual(where,{id:"draft-uuid",ownerId:"owner-uuid"});
});

test("customer media upload cannot use a workspace without OWNER membership",async()=>{
  let uploadCalled=false;
  const db={
    workspace:{findUnique:async()=>({id:"private-workspace"})},
    workspaceMember:{findUnique:async()=>({role:"VIEWER"})},
  };
  const media={startUpload:async()=>{uploadCalled=true;}};
  const service=new CustomerInvitationsService(db as never,media as never,{} as never);
  await assert.rejects(()=>service.startPhoto("owner-uuid",{
    name:"portrait.png",mimeType:"image/png",bytes:100,sha256:"a".repeat(64),
  }),ForbiddenException);
  assert.equal(uploadCalled,false);
});
