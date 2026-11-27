import assert from "node:assert/strict";
import {createHash, randomUUID} from "node:crypto";
import {mkdir,readFile} from "node:fs/promises";
import {once} from "node:events";
import {createServer} from "node:http";
import {createRequire} from "node:module";
import {resolve} from "node:path";

const require = createRequire(resolve(process.env.STUDIO_BROWSER_PREFIX ?? ".", "package.json"));
const {chromium} = require("playwright");
const app = new URL(process.env.AUTH_QA_APP_ORIGIN ?? "http://127.0.0.1:4180");
const api = new URL(process.env.AUTH_QA_FIXTURE_ORIGIN ?? "http://127.0.0.1:4000");
for (const origin of [app,api]) {
  assert.equal(origin.protocol,"http:");
  assert.equal(origin.hostname,"127.0.0.1","Browser fixtures require an isolated loopback origin");
}
const output = process.env.AUTH_QA_ARTIFACTS;
if (output) await mkdir(output,{recursive:true});
const templates = new Map(await Promise.all(["love-story","vogue-wedding","italian-romance"].map(async slug=>{
  const pack=JSON.parse(await readFile(new URL("../templates/packages/"+slug+".v1.json",import.meta.url),"utf8"));
  return [slug,{...pack.manifest,document:pack.document,personalization:pack.personalization,templateVersionId:randomUUID(),mediaUrls:{}}];
})));
const love = templates.get("love-story");
const draftId = randomUUID();
const editorPath = "/ru/editor?template=love-story&draft="+draftId;
const editorNode = '[data-studio-node="cover_names"]';
const guest = "Локальный черновик до входа";
const privateTitle = "Приватный черновик аккаунта A";
const encode=value=>Buffer.from(JSON.stringify(value)).toString("base64url");
const users=["a","b"].map(letter=>({
  id:randomUUID(),aud:"authenticated",role:"authenticated",email:letter+"@fixture.test",
  created_at:"2026-01-01T00:00:00Z",app_metadata:{},user_metadata:{},
}));
const [alice,bob]=users;
const sessions = new Map();
const signoffs = [];
const codes = new Map();
const upstreamErrors = [];
let nextUser = alice;
let emailLink;
let verifiedExchanges = 0;
let successfulRefreshes = 0;
let rejectedRefreshes = 0;
let onOverview;
let pendingOverview;
const now=()=>Math.floor(Date.now()/1000);
const hash=value=>createHash("sha256").update(value).digest("base64url");

function mint(user,{duration=3600,canRefresh=true}={}){
  const expires_at=now()+duration;
  const access_token=encode({alg:"HS256",typ:"JWT"})+"."+encode({sub:user.id,exp:expires_at,jti:randomUUID()})+".fixture";
  const session={access_token,refresh_token:randomUUID(),user,expires_at,expires_in:duration,token_type:"bearer"};
  sessions.set(access_token,{session,canRefresh});
  return session;
}
async function body(request){
  const chunks=[];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString());
}
function overview(user){
  return {totals:{drafts:1,active:0,responses:0,attending:0,declined:0},
    entries:[{draft:{id:draftId,revision:1,templateVersionId:love.templateVersionId,
      updatedAt:"2026-01-01T00:00:00Z",templateVersion:{template:{name:"Приглашение "+user.email,publicSlug:"love-story"}}},
      summary:null,publication:null}],recent:[],nextPage:null};
}
function issue(redirect,challenge,user){
  assert.equal(redirect.origin,app.origin);
  assert.match(challenge,/^[a-zA-Z0-9_-]{43}$/);
  const code=randomUUID();
  codes.set(code,{challenge,user});
  redirect.searchParams.set("code",code);
  return redirect;
}
const server=createServer(async (request,response)=>{
  const url=new URL(request.url,api);
  response.setHeader("Access-Control-Allow-Origin",app.origin);
  response.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers","*");
  response.setHeader("Cache-Control","no-store");
  const json=(data,status=200)=>response.writeHead(status,{"Content-Type":"application/json"}).end(JSON.stringify(data));
  if(request.method==="OPTIONS")return response.writeHead(204).end();
  try{
    if(url.pathname==="/auth/v1/authorize"){
      assert.equal(url.searchParams.get("provider"),"google");
      assert.equal(url.searchParams.get("code_challenge_method"),"s256");
      const redirect=new URL(url.searchParams.get("redirect_to"));
      assert.match(redirect.pathname,/^\/(ru|ky)\/auth\/callback$/);
      return response.writeHead(303,{Location:issue(redirect,url.searchParams.get("code_challenge"),nextUser).href}).end();
    }
    if(url.pathname==="/auth/v1/otp"){
      const data=await body(request);
      assert.equal(data.email,nextUser.email);
      assert.equal(data.code_challenge_method,"s256");
      const redirect=new URL(url.searchParams.get("redirect_to"));
      assert.equal(redirect.pathname,"/ky/invitations","Existing OTP redirect allowlist is preserved");
      emailLink=issue(redirect,data.code_challenge,nextUser);
      return json({});
    }
    if(url.pathname==="/auth/v1/token"){
      const data=await body(request);
      if(url.searchParams.get("grant_type")==="pkce"){
        const exchange=codes.get(data.auth_code);
        codes.delete(data.auth_code);
        if(!exchange)return json({code:"flow_state_not_found",msg:"Invalid code"},400);
        assert.equal(hash(data.code_verifier),exchange.challenge);
        verifiedExchanges++;
        return json(mint(exchange.user));
      }
      assert.equal(url.searchParams.get("grant_type"),"refresh_token");
      const entry=[...sessions.values()].find(({session})=>session.refresh_token===data.refresh_token);
      if(!entry?.canRefresh){
        rejectedRefreshes++;
        return json({code:"refresh_token_not_found",msg:"Refresh token expired"},400);
      }
      entry.canRefresh=false;
      successfulRefreshes++;
      return json(mint(entry.session.user));
    }
    const access=sessions.get(request.headers.authorization?.replace(/^Bearer /,""));
    if(url.pathname==="/auth/v1/logout"){
      assert.equal(url.searchParams.get("scope"),"local");
      assert.ok(access);
      access.canRefresh=false;
      signoffs.push(access.session.user.id);
      return response.writeHead(204).end();
    }
    if(url.pathname.startsWith("/api/v1/catalog/templates/")){
      const pack=templates.get(url.pathname.split("/").at(-1));
      return json(pack??{},pack?200:404);
    }
    if(url.pathname.startsWith("/api/v1/customer/")){
      if(!access||access.session.expires_at<=now())return json({},401);
      const {user}=access.session;
      if(url.pathname.endsWith("/overview")){
        if(onOverview&&user.id===alice.id){
          pendingOverview=response;
          onOverview(response);
          return;
        }
        return json(overview(user));
      }
      if(url.pathname.endsWith("/customer/invitations"))return json([]);
      if(url.pathname.endsWith("/customer/invitations/"+draftId)&&user.id===alice.id){
        return json({id:draftId,revision:1,templateVersionId:love.templateVersionId,
          patch:{values:{coupleNames:{kind:"binding",value:{type:"text",value:{ru:privateTitle,ky:privateTitle}}}}},
          assets:[],mediaUrls:{},updatedAt:"2026-01-01T00:00:00Z"});
      }
    }
    return json({},404);
  }catch(error){
    upstreamErrors.push(error);
    if(!response.headersSent)json({},500);
  }
});
await new Promise((ok,reject)=>{
  server.once("error",reject);
  server.listen(Number(api.port),api.hostname,ok);
});
let browser;
const pageErrors=[];
async function setup(options){
  const context=await browser.newContext(options);
  await context.route("**/*",route=>[app.origin,api.origin].includes(new URL(route.request().url()).origin)?route.continue():route.abort());
  context.on("page",page=>page.on("pageerror",error=>pageErrors.push(error.message)));
  context.setDefaultTimeout(12000);
  return context;
}
async function shot(page,name){
  if(output)await page.screenshot({path:resolve(output,name+".png"),animations:"disabled"});
}
const visit=(page,path)=>page.goto(new URL(path,app).href);
const google=(page,locale="ru")=>page.getByRole("button",{name:locale==="ru"?"Войти через Google":"Google аркылуу кирүү"});
const photo=(page)=>page.getByRole("button",{name:"Фото",exact:true});
const editorPreview=(page)=>page.locator(".ce-preview-screen");
const entry=(page,user)=>page.getByText("Приглашение "+user.email,{exact:true}).first();
async function logout(page,locale="ru"){
  await page.getByRole("button",{name:"Профиль",exact:true}).click();
  await page.getByRole("button",{name:locale==="ru"?"Выйти":"Чыгуу",exact:true}).click();
  await google(page,locale).waitFor();
}

try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true});
  const mobile=await setup({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const legacyKey="eventiq:customer-draft:v1:"+love.templateVersionId;
  const legacyPatch={values:{coupleNames:{kind:"binding",value:{type:"text",value:{ru:"Старый общий черновик",ky:"Эски жалпы черновик"}}}}};
  await mobile.addInitScript(({key,patch,origin})=>{
    if (location.origin===origin && window.top===window) localStorage.setItem(key,JSON.stringify(patch));
  },{key:legacyKey,patch:legacyPatch,origin:app.origin});
  const editor=await mobile.newPage();
  assert.equal((await visit(editor,editorPath)).status(),200);
  await editorPreview(editor).locator(editorNode).click();
  assert.equal(await editorPreview(editor).getByText("Старый общий черновик").count(),0);
  assert.deepEqual(await editor.evaluate(key=>JSON.parse(localStorage.getItem(key)),legacyKey),legacyPatch);
  await editor.getByRole("dialog").getByRole("textbox",{name:/ ru$/}).first().fill(guest);
  await editorPreview(editor).getByText(guest,{exact:true}).waitFor();
  await editor.locator(".ce-mobile-sheet-handle button").click();
  await photo(editor).click();
  await google(editor).scrollIntoViewIfNeeded();
  await shot(editor,"01-editor-sign-in-ru");
  const callback=editor.waitForResponse(response=>new URL(response.url()).pathname==="/ru/auth/callback");
  await google(editor).click();
  const response=await callback;
  assert.equal(response.status(),303);
  assert.equal(response.headers()["cache-control"],"private, no-store");
  assert.equal(response.headers().location,editorPath);
  await editor.waitForURL(app.origin+editorPath);
  await editorPreview(editor).getByText(guest,{exact:true}).waitFor();
  assert.equal(verifiedExchanges,1);
  await editor.reload();
  await editorPreview(editor).getByText(guest,{exact:true}).waitFor();
  await photo(editor).click();
  editor.once("dialog",dialog=>dialog.accept());
  await editor.getByRole("button",{name:"Загрузить сохранённое",exact:true}).click();
  await editorPreview(editor).getByText(privateTitle,{exact:true}).waitFor();
  await editor.locator(".ce-mobile-sheet-handle button").click();

  const switcher=await mobile.newPage();
  await visit(switcher,"/ru/invitations");
  await entry(switcher,alice).waitFor();
  const inFlight=new Promise(resolve=>{onOverview=resolve;});
  const stale=await mobile.newPage();
  await visit(stale,"/ru/account");
  await Promise.race([inFlight,stale.getByText("Не удалось загрузить приглашения.",{exact:false}).waitFor().then(()=>{throw Error("Overview request failed");})]);
  const closed=once(pendingOverview,"close",{signal:AbortSignal.timeout(12000)});
  await logout(switcher);
  await google(stale).waitFor();
  await photo(editor).click();
  await google(editor).waitFor();
  await editorPreview(editor).getByText(guest,{exact:true}).waitFor();
  assert.equal(await editorPreview(editor).getByText(privateTitle).count(),0);
  assert.deepEqual(signoffs,[alice.id]);
  nextUser=bob;
  await google(switcher).click();
  await entry(switcher,bob).waitFor();
  await entry(stale,bob).waitFor();
  await closed;
  assert.equal(pendingOverview.writableEnded,false,"Logout cancels the old request");
  onOverview=undefined;
  assert.equal(await entry(stale,alice).count(),0);
  assert.equal(await editorPreview(editor).getByText(privateTitle).count(),0);
  await editor.reload();
  await editorPreview(editor).getByText(guest,{exact:true}).waitFor();
  assert.equal(await editorPreview(editor).getByText(privateTitle).count(),0);
  await shot(stale,"02-account-b-after-switch-ru");
  await mobile.close();

  const desktop=await setup({viewport:{width:1440,height:900}});
  const account=await desktop.newPage();
  await visit(account,"/ky/auth/callback?error=access_denied&next=%2Fky%2Feditor%3Ftemplate%3Dvogue-wedding");
  await account.getByText("Кирүү токтотулду.",{exact:false}).waitFor();
  assert.equal(new URL(account.url()).pathname,"/ky/editor");
  await visit(account,"/ky/auth/callback?error=access_denied&next=%2Fky%2Faccount");
  await account.getByText("Кирүү токтотулду.",{exact:false}).waitFor();
  await shot(account,"03-cancelled-ky-desktop");
  await visit(account,"/ky/auth/callback?code=invalid&next=https%3A%2F%2Fexample.test");
  await account.getByText("Кирүү мүмкүн болгон жок.",{exact:false}).waitFor();
  assert.equal(new URL(account.url()).pathname,"/ky/invitations");
  await account.getByRole("textbox",{name:"Email",exact:true}).fill(bob.email);
  await account.getByRole("button",{name:"Шилтемени email'ге жөнөтүү",exact:true}).click();
  await account.getByText("Почтаңызды текшериңиз.",{exact:false}).waitFor();
  assert.ok(emailLink);
  await account.goto(emailLink.href);
  await entry(account,bob).waitFor();
  assert.equal(new URL(account.url()).searchParams.has("code"),false);
  assert.equal(verifiedExchanges,3);
  await logout(account,"ky");
  for (const slug of ["vogue-wedding","italian-romance"]){
    await visit(account,"/ky/editor?template="+slug);
    await editorPreview(account).locator("[data-preview-page]").first().waitFor();
  }
  await desktop.close();

  for (const canRefresh of [true,false]){
    const context=await setup({viewport:{width:320,height:700},isMobile:true,hasTouch:true});
    const expired=mint(alice,{duration:-600,canRefresh});
    await context.addCookies([{name:"sb-127-auth-token",value:"base64-"+encode(expired),url:app.origin}]);
    const page=await context.newPage();
    await visit(page,"/ru/invitations");
    if(canRefresh){
      await entry(page,alice).waitFor();
      assert.equal(successfulRefreshes,1);
      const cookies=await context.cookies();
      assert.equal(JSON.parse(Buffer.from(cookies.find(cookie=>cookie.name==="sb-127-auth-token").value.slice(7),"base64url")).access_token===expired.access_token,false);
    }else{
      await google(page).waitFor();
      assert.equal(rejectedRefreshes,1);
      assert.equal(await entry(page,alice).count(),0);
      await shot(page,"04-expired-session-ru");
      await google(page).click();
      await entry(page,bob).waitFor();
    }
    await context.close();
  }
  assert.deepEqual(upstreamErrors,[]);
  assert.deepEqual(pageErrors,[]);
  console.log("Auth browser fixture passed: PKCE, callback, OTP, draft recovery, refresh, expiry, logout and account switch. RU/KY, 320/390/1440px.");
}finally{
  await browser?.close();
  server.closeAllConnections();
  await new Promise(ok=>server.close(ok));
}
