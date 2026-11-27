import assert from "node:assert/strict";
import {createHash, randomUUID} from "node:crypto";

export async function ownerUploadFixture(page, {origin, fixtureOrigin, storageHost, photoWidth, photoHeight}) {
  const user={id:randomUUID(),aud:"authenticated",role:"authenticated",email:"fixture@example.test"};
  const encode=value=>Buffer.from(JSON.stringify(value)).toString("base64url");
  const expiry=Math.floor(Date.now()/1000)+3600;
  const token=encode({alg:"HS256",typ:"JWT"})+"."+encode({sub:user.id,exp:expiry})+".QA";
  const session={access_token:token,refresh_token:"fixture",user,expires_at:expiry,expires_in:3600,token_type:"bearer"};
  const supabaseHost=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL??"http://localhost").hostname;
  await page.context().addCookies([{name:"sb-"+supabaseHost.split(".")[0]+"-auth-token",value:"base64-"+encode(session),url:origin.origin}]);
  const tickets=new Map();
  const cors={"access-control-allow-origin":origin.origin,"access-control-allow-methods":"GET,POST,PUT,OPTIONS","access-control-allow-headers":"*"};
  const mockStorage="https://"+storageHost;
  await page.route(fixtureOrigin+"/api/v1/customer/**",async route=>{
    const req=route.request();
    const path=new URL(req.url()).pathname;
    const reply=(json,status=200)=>route.fulfill({json,status,headers:cors});
    if(req.method()==="OPTIONS")return route.fulfill({status:204,headers:cors});
    assert.equal(req.headers().authorization,"Bearer "+token);
    if(path.endsWith("/invitations"))return reply([]);
    if(path.endsWith("/uploads")){
      const id=randomUUID();
      const request=req.postDataJSON();
      tickets.set(id,request);
      return reply({id,uploadUrl:mockStorage+"/upload/"+id,headers:{"Content-Type":request.mimeType}},201);
    }
    const match=path.match(/\/media\/([^/]+)\/(complete|read-url)$/);
    const ticket=match&&tickets.get(match[1]);
    if(!ticket?.body)return reply({},404);
    const id=match[1];
    if(match[2]==="complete"){
      const audio=ticket.mimeType==="audio/mpeg";
      return reply({id,storageKey:"asset:"+id,mimeType:ticket.mimeType,sizeBytes:ticket.bytes,name:ticket.name,status:"READY",
        pixelWidth:audio?null:photoWidth,pixelHeight:audio?null:photoHeight},201);
    }
    return reply({url:mockStorage+"/read/"+id,expiresInSeconds:ticket.mimeType==="audio/mpeg"?1200:60});
  });
  await page.route(mockStorage+"/**",async route=>{
    const req=route.request();
    if(req.method()==="OPTIONS")return route.fulfill({status:204,headers:cors});
    const ticket=tickets.get(new URL(req.url()).pathname.split("/").at(-1));
    assert.ok(ticket);
    if(req.method()==="PUT"){
      const body=req.postDataBuffer();
      assert.equal(body.length,ticket.bytes);
      assert.equal(createHash("sha256").update(body).digest("hex"),ticket.sha256);
      ticket.body=body;
      return route.fulfill({status:200,headers:cors,body:""});
    }
    return route.fulfill({status:200,headers:cors,body:ticket.body,contentType:ticket.mimeType});
  });
  return {tickets,subject:user.id};
}

export function readOwnerDraft(page,subject,version){
  return page.evaluate(key=>JSON.parse(localStorage.getItem(key)).patch,
    ["eventiq:customer-draft:v2",subject,version,"new"].join(":"));
}
