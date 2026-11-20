import assert from "node:assert/strict";
import {createServer} from "node:http";
import {createRequire} from "node:module";
import {join} from "node:path";
import {createEmptyProjectV2} from "../src/features/studio-v2/core/document.schema.ts";
import {createWidget} from "../src/features/studio-v2/core/invitation-behavior.ts";

const require=createRequire(join(process.env.STUDIO_BROWSER_PREFIX,"package.json"));
const {chromium}=require("playwright");
const document=createEmptyProjectV2("browser-public-invite");
const rsvp=createWidget("rsvp","rsvp-smoke","frame-1",390);
document.nodes[rsvp.id]=rsvp;
const root=document.nodes["frame-1"];
assert.equal(root.type,"frame");
root.children.push(rsvp.id);
let active=true;
const submissions=[];
const api=createServer(async(req,res)=>{
 res.setHeader("access-control-allow-origin","*");
 res.setHeader("access-control-allow-methods","GET, POST, OPTIONS");
 res.setHeader("access-control-allow-headers","Content-Type");
 res.setHeader("cache-control","no-store");
 if(req.method==="OPTIONS"){res.writeHead(204);res.end();return;}
 const path=new URL(req.url,"http://127.0.0.1:4000").pathname;
 if(path==="/api/v1/public/invitations/smoke"){
  if(!active){res.writeHead(404);res.end(JSON.stringify({message:"NOT_FOUND"}));return;}
  res.writeHead(200,{"content-type":"application/json"});
  res.end(JSON.stringify({slug:"smoke",release:1,sha256:"a".repeat(64),
   document,mediaUrls:{},rsvpEnabled:true,turnstileSiteKey:null}));
  return;
 }
 if(path==="/api/v1/public/invitations/smoke/rsvp"&&req.method==="POST"){
  const parts=[];for await(const chunk of req)parts.push(chunk);
  const input=JSON.parse(Buffer.concat(parts).toString());
  submissions.push(input);
  res.writeHead(201,{"content-type":"application/json"});
  res.end(JSON.stringify({accepted:true,receiptId:"smoke-receipt"}));
  return;
 }
 res.writeHead(404,{"content-type":"application/json"});res.end('{"message":"NOT_FOUND"}');
});
await new Promise(resolve=>api.listen(4000,"127.0.0.1",resolve));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:430,height:900}});
 await page.goto("http://127.0.0.1:4180/ru/i/smoke/",{waitUntil:"networkidle"});
 const guestStyle=await page.locator(".v2-public-invitation").evaluate(el=>({
   maxHeight:getComputedStyle(el).maxHeight,
 }));
 assert.equal(guestStyle.maxHeight,"none","Guest pages must not be clipped to the editor viewport");
 const form=page.locator(".v2-guest-form");
 await form.waitFor({state:"visible"});
 assert.equal(await page.locator('meta[name="robots"]').getAttribute("content").then(v=>v?.includes("noindex")),true);
 await form.getByLabel("Ваше имя").fill("Айжан");
 await form.getByRole("button",{name:"Подтвердить"}).click();
 await form.getByRole("status").getByText("Спасибо! Ответ принят.").waitFor({state:"visible"});
 assert.equal(submissions.length,1,"RSVP must submit exactly once");
 assert.equal(submissions[0].nodeId,"rsvp-smoke");
 assert.equal(submissions[0].name,"Айжан");
 assert.equal(submissions[0].attendance,"yes");
 assert.equal(submissions[0].guests,1);
 assert.match(submissions[0].requestId,/^[0-9a-f-]{36}$/i);
 assert.equal(Object.hasOwn(submissions[0],"turnstileToken"),false,"no fake captcha token");
 assert.equal(await form.getByRole("button",{name:"Подтвердить"}).isDisabled(),true);
 // Locale route must select the RU/KY guest labels without mutating the saved release.
 await page.goto("http://127.0.0.1:4180/ky/i/smoke/",{waitUntil:"networkidle"});
 await page.getByLabel("Атыңыз").waitFor({state:"visible"});
 active=false;
 const missing=await page.goto("http://127.0.0.1:4180/ru/i/smoke/",{waitUntil:"domcontentloaded"});
 assert.equal(missing.status(),404,"unpublished invitation must not be server-rendered");
 await page.close();
 console.log("PASS: dynamic SSR invite, built-in RSVP form, noindex and 404 on unpublish");
}finally{
 await browser.close();
 await new Promise((resolve,reject)=>api.close(err=>err?reject(err):resolve()));
}
