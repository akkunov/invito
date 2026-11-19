import {test} from "node:test";
import assert from "node:assert/strict";
import {RsvpChallengeService} from "../src/modules/publications/rsvp-challenge.service.js";

test("Turnstile: production fails closed, invalid token rejected, valid token verified server-side",async()=>{
 const keys=["NODE_ENV","RSVP_TURNSTILE_SITE_KEY","RSVP_TURNSTILE_SECRET"] as const;
 const old=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 const oldFetch=globalThis.fetch;
 const service=new RsvpChallengeService();
 try{
  process.env.NODE_ENV="production";
  delete process.env.RSVP_TURNSTILE_SITE_KEY;
  delete process.env.RSVP_TURNSTILE_SECRET;
  assert.equal(service.siteKey(),null);
  await assert.rejects(()=>service.verify(undefined),error=>
    typeof error==="object"&&error!==null&&"status" in error&&error.status===503);
  process.env.RSVP_TURNSTILE_SITE_KEY="test-public-site-key";
  process.env.RSVP_TURNSTILE_SECRET="server-secret";
  assert.equal(service.siteKey(),"test-public-site-key");
  await assert.rejects(()=>service.verify(undefined),error=>
    typeof error==="object"&&error!==null&&"status" in error&&error.status===403);
  let submitted:URLSearchParams|null=null;
  globalThis.fetch=async(_url,options)=>{
    submitted=options?.body as URLSearchParams;
    return new Response(JSON.stringify({success:true}),{
      status:200,headers:{"content-type":"application/json"},
    });
  };
  await service.verify("mock-valid-turnstile-token");
  assert.equal(submitted?.get("secret"),"server-secret");
  assert.equal(submitted?.get("response"),"mock-valid-turnstile-token");
  globalThis.fetch=async()=>new Response(JSON.stringify({success:false}),{
    status:200,headers:{"content-type":"application/json"},
  });
  await assert.rejects(()=>service.verify("invalid-token-12345"),error=>
    typeof error==="object"&&error!==null&&"status" in error&&error.status===403);
  globalThis.fetch=async()=>{throw new TypeError("network error");};
  await assert.rejects(()=>service.verify("valid-format-token"),error=>
    typeof error==="object"&&error!==null&&"status" in error&&error.status===503);
 }finally{
  globalThis.fetch=oldFetch;
  for(const key of keys)if(old[key]===undefined)delete process.env[key];
   else process.env[key]=old[key];
 }
});
