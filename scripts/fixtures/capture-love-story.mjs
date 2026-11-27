import assert from "node:assert/strict";
import {createHash, randomUUID} from "node:crypto";
import {mkdir, readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {resolve} from "node:path";

const require = createRequire(resolve(process.env.STUDIO_BROWSER_PREFIX ?? ".", "package.json"));
const {chromium} = require("playwright");
const origin = new URL(process.env.VF01_APP_ORIGIN ?? "http://127.0.0.1:4280");
assert.ok(["localhost", "127.0.0.1"].includes(origin.hostname), "Use a loopback fixture");
const fixtureOrigin = new URL(process.env.VF01_API_ORIGIN ?? "http://127.0.0.1:4281").origin;
assert.ok(["localhost", "127.0.0.1"].includes(new URL(fixtureOrigin).hostname), "Use a loopback fixture API");
const output = resolve(process.argv[2] ?? "/tmp/eventiq-vf-01");
const captureOnly = process.argv.includes("--capture-only");
const ownerChecks = process.argv.includes("--owner");
const tonePath = new URL("./media/qa-tone.mp3", import.meta.url);
const pack = JSON.parse(await readFile(new URL("../../templates/packages/love-story.v1.json", import.meta.url),"utf8"));
await mkdir(output, {recursive: true});

const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH, headless: true});
const errors = [];

async function open(width, locale, {slug = "love-story", height = 1045, editor = false, authenticated = false} = {}) {
  const page = await browser.newPage({
    viewport: {width, height}, deviceScaleFactor: 1, isMobile: true,
    hasTouch: true, reducedMotion: "reduce", acceptDownloads: true,
  });
  await page.route("**/*", route => {
    const target = new URL(route.request().url());
    return [origin.origin, fixtureOrigin].includes(target.origin) ? route.continue() : route.abort();
  });
  const uploads = authenticated ? await ownerFixture(page) : undefined;
  page.on("pageerror", error => errors.push(error.message));
  await page.clock.setFixedTime(new Date("2026-11-24T00:35:24Z"));
  const path = editor ? "/editor?template=love-story" : "/c/" + slug;
  assert.equal((await page.goto(new URL("/" + locale + path, origin).href)).status(), 200);
  await page.locator("[data-preview-page]").first().waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll("[data-preview-page] img")].map(image => {
      image.loading = "eager";
      return image.decode();
    }));
  });
  await page.addStyleTag({content: "nextjs-portal { display: none; }"});
  return {page,uploads};
}

async function shot(page, name, fullPage = false) {
  await page.screenshot({path: resolve(output, name + ".png"), fullPage, animations: "disabled"});
}

async function ownerFixture(page){
  const user={id:randomUUID(),aud:"authenticated",role:"authenticated",email:"fixture@example.test"};
  const encode=value=>Buffer.from(JSON.stringify(value)).toString("base64url");
  const expiry=Math.floor(Date.now()/1000)+3600;
  const token=encode({alg:"HS256",typ:"JWT"})+"."+encode({sub:user.id,exp:expiry})+".QA";
  const session={access_token:token,refresh_token:"fixture",user,expires_at:expiry,expires_in:3600,token_type:"bearer"};
  await page.context().addCookies([{name:"sb-localhost-auth-token",value:"base64-"+encode(session),url:origin.origin}]);
  const tickets=new Map();
  const cors={"access-control-allow-origin":origin.origin,"access-control-allow-methods":"GET,POST,PUT,OPTIONS","access-control-allow-headers":"*"};
  const mockStorage="https://vf01.r2.cloudflarestorage.com";
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
        pixelWidth:audio?null:390,pixelHeight:audio?null:651},201);
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
  return tickets;
}

async function checkOwnerEdits(editor, preview, uploads){
  const fieldNodes=pack.personalization.fields
    .filter(field=>field.kind==="text"||field.kind==="date"||field.kind==="schedule"||field.kind==="rsvp")
    .map(field=>({...field,target:field.nodeId??Object.values(pack.document.nodes).find(node=>node.bindingKey===field.key||node.block?.addressKey===field.key)?.id}));
  const close=editor.locator(".ce-mobile-sheet-handle button");
  let pageIndex=0;
  for(const field of fieldNodes){
    console.log("Owner field:",field.id);
    const root=pack.document.nodes[field.target].parentId;
    const destination=pack.document.pages.findIndex(section=>section.rootNodeId===root);
    while(pageIndex!==destination){
      await editor.getByRole("button",{name:pageIndex<destination?"Следующая секция":"Предыдущая секция",exact:true}).click();
      pageIndex+=pageIndex<destination?1:-1;
    }
    const node=preview.locator(`[data-studio-node="${field.target}"]`);
    await node.click();
    const sheet=editor.getByRole("dialog");
    if(field.kind==="text"){
      const value=field.id.endsWith("Date")?"15.06.2024":"Тест "+field.label.ru;
      await sheet.getByRole("textbox",{name:field.label.ru+" ru",exact:true}).fill(value);
      await node.getByText(value,{exact:true}).waitFor();
    }else if(field.kind==="date"){
      await sheet.locator('input[type="datetime-local"]').first().fill("2027-06-12T18:25");
      await preview.getByText(/12 ИЮНЯ 2027/).waitFor();
    }else if(field.kind==="schedule"){
      await sheet.locator('input[type="time"]').first().fill("15:45");
      await preview.getByText("15:45",{exact:true}).waitFor();
    }else{
      await sheet.getByLabel("Количество гостей").selectOption("5");
      await sheet.locator('input[type="datetime-local"]').first().fill("2027-06-07T21:00");
    }
    await close.click();
  }
  const photoFields=pack.personalization.fields.filter(field=>field.kind==="image");
  await editor.getByRole("button",{name:"Фото",exact:true}).click();
  const target=editor.getByLabel("Что заменить на приглашении");
  const photoInput=editor.locator('.ce-cloud-group input[type=file]').first();
  const photo=new URL("../../public/images/collection/love-story/vf-01/cover_photo.webp",import.meta.url);
  for(const [index,field] of photoFields.entries()){
    await target.selectOption(field.id);
    await photoInput.setInputFiles({name:field.id+".webp",mimeType:"image/webp",buffer:await readFile(photo)});
    await editor.getByText(/Загружено 1 \/ 1/).waitFor();
    assert.equal([...uploads.values()].filter(ticket=>ticket.body).length,index+1);
  }
  await close.click();
  await editor.getByRole("button",{name:"Музыка",exact:true}).click();
  const musicInput=editor.locator('.ue-music-upload input[type=file]');
  await musicInput.setInputFiles({name:"invalid.txt",mimeType:"text/plain",buffer:Buffer.from("invalid")});
  await editor.getByText(/Выберите файл MP3/).waitFor();
  await musicInput.setInputFiles({name:"qa-tone.mp3",mimeType:"audio/mpeg",buffer:await readFile(tonePath)});
  await editor.getByText("Трек добавлен в черновик.").waitFor();
  assert.equal([...uploads.values()].filter(ticket=>ticket.body).length,7);
  await shot(editor,"editor-music-upload");
  const stored=await editor.evaluate(()=>JSON.parse(localStorage.getItem("eventiq:customer-draft:v1:692e3ce4-8b41-48be-b39b-c093be771c68")));
  for(const field of photoFields)assert.match(stored.values[field.id].assetId,/^customer_/);
  for(const field of fieldNodes)assert.ok(stored.values[field.id],field.id);
  assert.equal(stored.values.rsvpPage_rsvpWidget.maxGuests,5);
  assert.equal(stored.values.rsvpPage_rsvpWidget.deadline,"2027-06-07T21:00:00+06:00");
  assert.match(stored.values.rsvpPage_music.source,/^asset:/);
  await editor.reload();
  await editor.getByRole("button",{name:"Музыка",exact:true}).click();
  await editor.getByRole("button",{name:"Заменить MP3"}).waitFor();
  await editor.getByRole("button",{name:"Без музыки",exact:true}).click();
  await editor.getByRole("button",{name:"Загрузить MP3"}).waitFor();
}

try {
  const {page:baseline} = await open(390, "ru");
  const artboards = baseline.locator("[data-preview-page]");
  assert.deepEqual(await artboards.evaluateAll(pages => pages.map(page => [page.clientWidth, page.clientHeight])),
    [[390, 1045], [390, 1045], [390, 1045], [390, 1045]]);
  for (const [index, artboard] of (await artboards.all()).entries()) {
    await artboard.evaluate(section => window.scrollTo({top: section.getBoundingClientRect().top + scrollY, behavior: "instant"}));
    assert.equal(Math.round(await artboard.evaluate(section => section.getBoundingClientRect().top)), 0);
    if(index===3&&!captureOnly){
      await baseline.getByRole("button",{name:"Включить музыку"}).click();
      await baseline.getByRole("button",{name:"Остановить музыку"}).waitFor();
      await artboard.evaluate(section => window.scrollTo({top: section.getBoundingClientRect().top + scrollY, behavior: "instant"}));
    }
    await shot(baseline, String(index + 1).padStart(2, "0"));
  }
  await shot(baseline, "full", true);
  await baseline.close();

  if (!captureOnly) {
    for (const width of [320, 360, 375, 390, 412, 430]) {
      for (const locale of ["ru", "ky"]) {
        const {page} = await open(width, locale, {height: 844});
        await page.waitForFunction(target => document.querySelector("[data-preview-page]").clientWidth === target, width);
        const layout = await page.evaluate(() => ({
          lang: document.querySelector(".v2-project-renderer").lang,
          width: document.documentElement.scrollWidth,
          sections: document.querySelectorAll("[data-preview-page]").length,
          controls: [...document.querySelectorAll(".v2-guest-form input[autocomplete=name], .v2-guest-form textarea, .v2-guest-form button, .v2-guest-options label")]
            .map(control => control.getBoundingClientRect().height),
        }));
        assert.equal(layout.lang, locale);
        assert.equal(layout.width, width);
        assert.equal(layout.sections, 4);
        assert.ok(layout.controls.length >= 7 && layout.controls.every(height => height >= 44), JSON.stringify(layout));
        if (width === 390 && locale === "ky") await shot(page, "ky-full", true);
        await page.close();
      }
    }

    for (const locale of ["ru", "ky"]) {
      const {page:stress} = await open(320, locale, {slug: "love-story-long", height: 844});
      await stress.waitForFunction(() => document.querySelector("[data-preview-page]").clientWidth === 320);
      const names = stress.locator("[data-studio-node=cover_names] span").first();
      const date = stress.locator("[data-studio-node=cover_date]");
      await stress.waitForFunction(() => {
        const title = document.querySelector("[data-studio-node=cover_names] > div > div").getBoundingClientRect();
        const eventDate = document.querySelector("[data-studio-node=cover_date]").getBoundingClientRect();
        return title.bottom <= eventDate.top + 1;
      });
      assert.match(await names.textContent(), locale === "ky" ? /Айгүл/ : /Александра/);
      assert.match(await date.innerText(), /2027/);
      const chapter = stress.locator("[data-studio-node=story_meetingText] > div > div");
      assert.match(await chapter.innerText(), locale === "ky" ? /Биз саякатта/ : /Мы встретились/);
      assert.ok(await chapter.evaluate(text => text.getBoundingClientRect().bottom <
        document.querySelector("[data-studio-node=story_tripDate]").getBoundingClientRect().top));
      assert.equal(await stress.evaluate(() => document.documentElement.scrollWidth), 320);
      await shot(stress, "long-" + locale, true);
      await stress.close();
    }

    const {page:guest} = await open(390, "ru");
    await guest.getByRole("link", {name: "К следующему разделу"}).click();
    assert.match(guest.url(), /-story$/);
    const [download] = await Promise.all([
      guest.waitForEvent("download"), guest.getByRole("button", {name: "В календарь"}).click(),
    ]);
    assert.match(await readFile(await download.path(), "utf8"), /DTSTART:20270529T110000Z/);
    assert.match(await guest.getByRole("link", {name: "Открыть карту"}).getAttribute("href"), /^https:\/\/www\.google\.com\/maps\/search\//);

    const form = guest.locator(".v2-guest-form");
    const submit = form.locator("button[type=submit]");
    const name = form.locator("input[autocomplete=name]");
    const wish = form.locator("textarea");
    await submit.click();
    assert.equal(await name.getAttribute("aria-invalid"), "true");
    await form.getByRole("alert").waitFor();
    await shot(guest, "rsvp-01-validation");
    await name.fill("Сбой");
    await wish.fill("Счастья!");
    await form.getByRole("button", {name: "Увеличить количество гостей"}).click();
    const pending = guest.waitForRequest(request => request.method() === "POST" && request.url().endsWith("/rsvp"));
    await submit.click();
    const request = await pending;
    const {wish: submittedWish, guests} = request.postDataJSON();
    assert.deepEqual({wish: submittedWish, guests}, {wish: "Счастья!", guests: 2});
    await form.getByRole("button", {name: "Отправка…"}).waitFor();
    assert.ok(await submit.isDisabled());
    await shot(guest, "rsvp-02-sending");
    await form.getByRole("status").getByText(/попробуйте позже/).waitFor();
    assert.equal(await wish.inputValue(), "Счастья!");
    await shot(guest, "rsvp-03-error");
    await name.fill("Тестовый гость");
    await form.getByRole("radio", {name: "К сожалению, нет"}).check();
    assert.equal(await form.locator(".v2-guest-stepper").count(), 0);
    await shot(guest, "rsvp-04-decline");
    const [decline] = await Promise.all([
      guest.waitForRequest(request => request.method() === "POST" && request.url().endsWith("/rsvp")),
      submit.click(),
    ]);
    assert.equal(decline.postDataJSON().guests, 0);
    assert.equal(decline.postDataJSON().attendance, "no");
    await form.getByRole("status").getByText(/Ответ принят/).waitFor();
    await shot(guest, "rsvp-05-success");
    const player=guest.locator(".v2-stationery-music");
    await player.getByRole("button",{name:"Включить музыку"}).click();
    await player.getByRole("button",{name:"Остановить музыку"}).waitFor();
    await shot(guest,"music-playing");
    await player.getByRole("button",{name:"Остановить музыку"}).click();
    await player.getByRole("button",{name:"Включить музыку"}).waitFor();
    await guest.close();

    const {page:silent}=await open(390,"ru",{slug:"love-story-silent"});
    assert.equal(await silent.locator(".v2-stationery-music").count(),0);
    await silent.close();

    for (const [id, text] of [["closed", "Приём ответов завершён"], ["unavailable", "Приём ответов пока недоступен"]]) {
      const {page} = await open(390, "ru", {slug: "love-story-" + id});
      await page.getByRole("status").getByText(text).waitFor();
      assert.ok(await page.locator(".v2-guest-form button[type=submit]").isDisabled());
      await page.locator(".v2-guest-form").scrollIntoViewIfNeeded();
      await shot(page, "rsvp-" + id);
      await page.close();
    }

    const {page:editor,uploads} = await open(390, "ru", {editor: true, height: 844, authenticated:ownerChecks});
    const preview = editor.getByRole("complementary", {name: "Предпросмотр"});
    await preview.locator("[data-studio-node=cover_names]").click();
    await editor.locator("textarea:visible").first().fill("Алина и Айдар");
    await preview.getByText("Алина и Айдар").waitFor();
    await shot(editor, "editor");
    if(ownerChecks){
      await editor.locator(".ce-mobile-sheet-handle button").click();
      await checkOwnerEdits(editor, preview, uploads);
    }
    await editor.close();
  }
  assert.deepEqual(errors, []);
  console.log("Love Story PASS", browser.version(), captureOnly
    ? "four 390 × 1045 DPR 1 artboards"
    : "visual capture, 12 responsive views, long RU/KY content, calendar, map, RSVP, audio and editor"+(ownerChecks?", all owner edit and upload fields":""));
} finally {
  await browser.close();
}
