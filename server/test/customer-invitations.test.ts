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

test("account overview pages only the authenticated owner's invitations and counts people separately from responses",async()=>{
  const ownerId="owner-uuid";
  const publication={id:"published",ownerId,slug:"invitation",status:"ACTIVE",latestRelease:2};
  const groups=[
    {publicationId:publication.id,attendance:"YES",_count:{_all:1},_sum:{guestCount:3}},
    {publicationId:publication.id,attendance:"NO",_count:{_all:2},_sum:{guestCount:0}},
  ];
  const publicationOwner={ownerId,draft:{ownerId}};
  let rsvpQueries=0;
  const db={
    invitationDraft:{
      findMany:async({where,skip,take}:{where:unknown;skip:number;take:number})=>{
        assert.deepEqual(where,{ownerId});assert.equal(skip,1);assert.equal(take,1);
        return [{id:"draft",publication}];
      },
      count:async({where}:{where:{ownerId:string;publication?:null}})=>{
        assert.equal(where.ownerId,ownerId);return "publication" in where?2:3;
      },
    },
    customerPublication:{count:async({where}:{where:unknown})=>{
      assert.deepEqual(where,{...publicationOwner,status:"ACTIVE"});return 1;
    }},
    customerRsvpResponse:{
      groupBy:async({where}:{where:{publication:unknown;publicationId?:unknown}})=>{
        assert.deepEqual(where.publication,publicationOwner);
        if(rsvpQueries++)assert.deepEqual(where.publicationId,{in:[publication.id]});
        return groups;
      },
      findMany:async({where,take}:{where:unknown;take:number})=>{
        assert.deepEqual(where,{publication:publicationOwner});assert.equal(take,5);return [];
      },
    },
  };
  const service=new CustomerInvitationsService(db as never,{} as never,{} as never);
  const overview=await service.overview(ownerId,2,1);
  assert.equal(overview.nextPage,3);
  assert.deepEqual(overview.totals,{drafts:2,active:1,responses:3,attending:3,declined:2});
  assert.deepEqual(overview.entries[0]?.summary,{responses:3,attending:3,declined:2});
  assert.equal(rsvpQueries,2);
});
