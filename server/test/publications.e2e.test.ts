import "reflect-metadata";
import {test} from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createServer} from "node:http";
import type {AddressInfo} from "node:net";
import {NestFactory} from "@nestjs/core";
import {SignJWT,generateKeyPair,exportJWK} from "jose";
import {AppModule} from "../src/app.module.js";
import {PrismaService} from "../src/database/prisma.service.js";
import {createEmptyProjectV2} from "../../src/features/studio-v2/core/document.schema.ts";
import {createWidget} from "../../src/features/studio-v2/core/invitation-behavior.ts";

test("Publishing #29.5: immutable guest release, authorization, RSVP and unpublish",async t=>{
 const keys=await generateKeyPair("RS256");
 const jwk={...await exportJWK(keys.publicKey),kid:"publish-ci",alg:"RS256",use:"sig"};
 const oidc=createServer((_,res)=>{
   res.writeHead(200,{"content-type":"application/json"});
   res.end(JSON.stringify({keys:[jwk]}));
 });
 await new Promise<void>(resolve=>oidc.listen(0,"127.0.0.1",resolve));
 const issuer="http://127.0.0.1:"+(oidc.address() as AddressInfo).port+"/";
 process.env.AUTH_ISSUER=issuer;process.env.AUTH_AUDIENCE="invito-publish-ci";
 process.env.AUTH_JWKS_URL=issuer+"jwks";process.env.AUTH_PROVIDER_ID="oidc-publish-ci";
 process.env.NODE_ENV="test";
 const app=await NestFactory.create(AppModule,{logger:false});
 app.setGlobalPrefix("api/v1");
 await app.listen(0,"127.0.0.1");
 const url="http://127.0.0.1:"+(app.getHttpServer().address() as AddressInfo).port+"/api/v1";
 const db=app.get(PrismaService);
 const users:string[]=[];
 let workspaceId:string|undefined;
 t.after(async()=>{
  try{
   if(workspaceId){
    await db.rsvpThrottle.deleteMany({where:{publication:{workspaceId}}});
    await db.rsvpResponse.deleteMany({where:{publication:{workspaceId}}});
    await db.idempotencyRecord.deleteMany({where:{workspaceId}});
    await db.auditEvent.deleteMany({where:{workspaceId}});
    await db.publicationRelease.deleteMany({where:{publication:{workspaceId}}});
    await db.publication.deleteMany({where:{workspaceId}});
    await db.projectRevision.deleteMany({where:{project:{workspaceId}}});
    await db.studioProject.deleteMany({where:{workspaceId}});
    await db.workspace.delete({where:{id:workspaceId}});
   }
   for(const id of users)await db.user.delete({where:{id}});
  }finally{
   await app.close();
   await new Promise<void>((resolve,reject)=>oidc.close(e=>e?reject(e):resolve()));
  }
 });
 const jwt=(sub:string)=>new SignJWT({name:"Publisher CI"}).setProtectedHeader({alg:"RS256",kid:"publish-ci"})
   .setIssuer(issuer).setAudience("invito-publish-ci").setSubject(sub).setIssuedAt().setExpirationTime("5m")
   .sign(keys.privateKey);
 const owner=await jwt("publisher-"+randomUUID());
 const viewer=await jwt("viewer-"+randomUUID());
 const outsider=await jwt("outsider-"+randomUUID());
 async function request(path:string,token:string|null=null,method="GET",body?:unknown){
   const response=await fetch(url+path,{
     method,headers:{...(token?{authorization:"Bearer "+token}:{}),
      ...(body!==undefined?{"content-type":"application/json"}:{})},
     ...(body!==undefined?{body:JSON.stringify(body)}:{}),
   });
   let result:any=null;try{result=await response.json();}catch{}
   return {status:response.status,data:result};
 }
 for(const token of [owner,viewer,outsider]){
   const me=await request("/me",token);assert.equal(me.status,200);
   users.push(me.data.id);
 }
 const ws=await request("/workspaces",owner,"POST",{
   slug:"publish-"+randomUUID().slice(0,12),name:"Publishing CI",
 });
 assert.equal(ws.status,201,JSON.stringify(ws.data));
 workspaceId=ws.data.id;
 await db.workspaceMember.create({data:{workspaceId,userId:users[1]!,role:"VIEWER"}});
 const document=createEmptyProjectV2("publish-"+randomUUID().slice(0,8));
 const node=createWidget("rsvp","rsvp-form","frame-1",380);
 document.nodes[node.id]=node;
 const root=document.nodes["frame-1"];
 if(root.type!=="frame")throw Error("Expected frame-1");
 root.children.push(node.id);
 const projectResult=await request("/workspaces/"+workspaceId+"/projects",owner,"POST",{
   title:"Wedding",document,
 });
 assert.equal(projectResult.status,201,JSON.stringify(projectResult.data));
 const projectId:string=projectResult.data.id;
 const revision=await db.projectRevision.findFirstOrThrow({where:{projectId,number:1}});
 const slug="wedding-"+randomUUID().slice(0,12);
 const publishBody={
   slug,projectRevisionId:revision.id,expectedRelease:0,idempotencyKey:"publish-"+randomUUID(),
 };
 const publishUrl="/projects/"+projectId+"/publish";
 assert.equal((await request(publishUrl,viewer,"POST",publishBody)).status,403);
 assert.equal((await request(publishUrl,outsider,"POST",publishBody)).status,404);
 const initial=await request(publishUrl,owner,"POST",publishBody);
 assert.equal(initial.status,201,JSON.stringify(initial.data));
 assert.equal(initial.data.status,"ACTIVE");
 assert.equal(initial.data.latestRelease,1);
 const replay=await request(publishUrl,owner,"POST",publishBody);
 assert.equal(replay.status,201);
 assert.deepEqual(replay.data,initial.data,"same idempotency key cannot create second release");
 assert.equal((await db.publicationRelease.count({where:{publicationId:initial.data.id}})),1);
 assert.equal((await request(publishUrl,owner,"POST",{...publishBody,slug:slug+"-changed"})).status,409);
 const guest=await request("/public/invitations/"+slug);
 assert.equal(guest.status,200,JSON.stringify(guest.data));
 assert.equal(guest.data.document.id,document.id);
 assert.equal(guest.data.release,1);
 assert.deepEqual(guest.data.mediaUrls,{});
 assert.equal(guest.data.rsvpEnabled,true);
 assert.equal(guest.data.turnstileSiteKey,null);
 const other=await request("/public/invitations/does-not-exist");
 assert.equal(other.status,404);
 assert.equal((await request("/projects/"+projectId+"/rsvp",viewer)).status,403);
 assert.equal((await request("/projects/"+projectId+"/rsvp",outsider)).status,404);
 const rsvp={
   requestId:randomUUID(),nodeId:"rsvp-form",name:"Гость",attendance:"yes",guests:2,website:"",
 };
 const badGuest=await request("/public/invitations/"+slug+"/rsvp",null,"POST",{...rsvp,guests:11});
 assert.equal(badGuest.status,400);
 const accepted=await request("/public/invitations/"+slug+"/rsvp",null,"POST",rsvp);
 assert.equal(accepted.status,201,JSON.stringify(accepted.data));
 assert.equal(accepted.data.accepted,true);
 const receipt=await request("/public/invitations/"+slug+"/rsvp",null,"POST",rsvp);
 assert.equal(receipt.status,201);
 assert.equal(receipt.data.receiptId,accepted.data.receiptId);
 assert.equal((await request("/public/invitations/"+slug+"/rsvp",null,"POST",
   {...rsvp,guests:1})).status,409);
 assert.equal((await request("/public/invitations/"+slug+"/rsvp",null,"POST",
   {...rsvp,requestId:randomUUID(),nodeId:"not-found"})).status,404);
 const no={...rsvp,requestId:randomUUID(),name:"Отказ",attendance:"no",guests:0};
 assert.equal((await request("/public/invitations/"+slug+"/rsvp",null,"POST",no)).status,201);
 const responses=await request("/projects/"+projectId+"/rsvp",owner);
 assert.equal(responses.status,200);
 assert.equal(responses.data.items.length,2);
 const summary=await request("/projects/"+projectId+"/rsvp/summary",owner);
 assert.equal(summary.status,200);
 assert.deepEqual(summary.data,{responses:2,attending:2,declined:1});
 // Saving a new draft revision MUST NOT mutate an already published snapshot.
 const laterDocument={...structuredClone(document),locale:"ky",revision:document.revision+1};
 const update=await request("/projects/"+projectId+"/revisions",owner,"PUT",
   {expectedRevision:1,document:laterDocument});
 assert.equal(update.status,200,JSON.stringify(update.data));
 assert.equal((await request("/public/invitations/"+slug)).data.document.locale,"ru");
 const revised=await db.projectRevision.findFirstOrThrow({where:{projectId,number:2}});
 const nextBody={slug,projectRevisionId:revised.id,expectedRelease:1,idempotencyKey:"next-"+randomUUID()};
 const next=await request(publishUrl,owner,"POST",nextBody);
 assert.equal(next.status,201,JSON.stringify(next.data));
 assert.equal(next.data.latestRelease,2);
 assert.equal((await request("/public/invitations/"+slug)).data.document.locale,"ky");
 const originalRelease=await db.publicationRelease.findFirstOrThrow({
   where:{publicationId:initial.data.id,number:1},
 });
 assert.equal((originalRelease.snapshot as {locale:string}).locale,"ru");
 assert.equal((await request(publishUrl,owner,"POST",
   {...nextBody,idempotencyKey:"stale-"+randomUUID()})).status,409);
 const unpublished=await request("/projects/"+projectId+"/unpublish",owner,"POST",
   {expectedRelease:2});
 assert.equal(unpublished.status,201,JSON.stringify(unpublished.data));
 assert.equal(unpublished.data.status,"UNPUBLISHED");
 assert.equal((await request("/public/invitations/"+slug)).status,404);
 assert.equal((await request("/public/invitations/"+slug+"/rsvp",null,"POST",
   {...rsvp,requestId:randomUUID()})).status,404);
 assert.equal((await request("/projects/"+projectId+"/publication",viewer)).status,200);
 const restored=await request(publishUrl,owner,"POST",
   {...nextBody,expectedRelease:2,idempotencyKey:"restore-"+randomUUID()});
 assert.equal(restored.status,201);
 assert.equal(restored.data.latestRelease,3);
 assert.equal((await request("/public/invitations/"+slug)).status,200);
 assert.equal(await db.publicationRelease.count({where:{publicationId:initial.data.id}}),3);
 const count=await db.auditEvent.count({where:{workspaceId,entity:"Publication"}});
 assert.ok(count>=4);
});
