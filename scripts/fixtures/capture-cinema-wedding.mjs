import assert from "node:assert/strict";
import {mkdir, readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {resolve} from "node:path";
import {ownerUploadFixture} from "./owner-upload-fixture.mjs";

const require=createRequire(resolve(process.env.STUDIO_BROWSER_PREFIX??".","package.json"));
const {chromium}=require("playwright");
const origin=new URL(process.env.VF04_APP_ORIGIN??"http://127.0.0.1:4288");
const fixtureOrigin=new URL(process.env.VF04_API_ORIGIN??"http://127.0.0.1:4287").origin;
for (const url of [origin,new URL(fixtureOrigin)]) assert.ok(["localhost","127.0.0.1"].includes(url.hostname));
const output=resolve(process.argv[2]??".artifacts/cinema-wedding");
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true});
const errors=[];
const heights=[1741,1782,1770,1782];
const captureOnly=process.argv.includes("--capture-only");
const ownerOnly=process.argv.includes("--owner-only");

async function open({width=430,height=1741,locale="ru",suffix="",owner=false,brokenPoster=false}={}) {
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:"reduce",acceptDownloads:true});
  await page.route("**/*",route=>{
    const url=new URL(route.request().url());
    if (brokenPoster&&url.pathname.endsWith("/vf-04/hero-poster.webp")) return route.fulfill({status:404});
    return [origin.origin,fixtureOrigin].includes(url.origin)?route.continue():route.abort();
  });
  const tickets=owner?await ownerUploadFixture(page,{
    origin,fixtureOrigin,storageHost:"vf04.r2.cloudflarestorage.com",photoWidth:390,photoHeight:651,
  }):undefined;
  page.on("pageerror",error=>errors.push(error.message));
  await page.clock.setFixedTime(new Date("2026-11-27T06:00:00Z"));
  const route=owner?"/editor?template=cinema-wedding":"/c/cinema-wedding"+suffix;
  assert.equal((await page.goto(new URL("/"+locale+route,origin).href,{waitUntil:"domcontentloaded"})).status(),200);
  await page.locator("[data-preview-page]").first().waitFor();
  if (!owner) await page.waitForFunction(w=>document.querySelector("[data-preview-page]").clientWidth===w,width);
  await page.evaluate(async allowBroken=>{
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll("[data-preview-page] img")].map(async img=>{
      img.loading="eager";
      if (allowBroken&&img.src.endsWith("/vf-04/hero-poster.webp")) return;
      await img.decode();
    }));
  },brokenPoster);
  await page.addStyleTag({content:"nextjs-portal{display:none}"});
  return {page,tickets};
}

function shot(page,name,fullPage=false) {
  return page.screenshot({path:resolve(output,name+".png"),fullPage,animations:"disabled"});
}

async function capture() {
  const {page}=await open();
  const boards=await page.locator("[data-preview-page]").all();
  assert.equal(boards.length,4);
  for (const [i,board] of boards.entries()) {
    const id=String(i+1).padStart(2,"0");
    const height=heights[i];
    await page.setViewportSize({width:430,height});
    await board.evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top,behavior:"instant"}));
    const bounds=await board.evaluate(el=>[el.clientWidth,el.clientHeight,Math.round(el.getBoundingClientRect().top)]);
    assert.equal(bounds[0],430);
    assert.ok(bounds[1]>=height,JSON.stringify(bounds));
    assert.equal(bounds[2],0);
    if (!captureOnly&&bounds[1]>height) console.log("Expanded artboard "+id+": "+bounds[1]+"px");
    await shot(page,id);
    if (bounds[1]>height) await board.screenshot({path:resolve(output,id+"-full.png"),animations:"disabled"});
  }
  await shot(page,"full",true);
  await page.close();
}

async function checkMobile() {
  for (const [width,height] of [[320,568],[360,800],[375,812],[390,844],[412,915],[430,932]]) {
    for (const locale of ["ru","ky"]) {
      const {page}=await open({width,height,locale});
      const measured=await page.evaluate(()=>({
        viewportWidth:document.documentElement.scrollWidth,
        locale:document.querySelector(".v2-project-renderer").lang,
        pages:document.querySelectorAll("[data-preview-page]").length,
        video:document.querySelectorAll("video").length,
        reduced:matchMedia("(prefers-reduced-motion: reduce)").matches,
        controls:[...document.querySelectorAll(".v2-guest-form :is(input[autocomplete=name],textarea,button,.v2-guest-options label), .v2-stationery-music button, .v2-guest-link")].map(el=>[el.getBoundingClientRect().width,el.getBoundingClientRect().height]),
      }));
      assert.equal(measured.viewportWidth,width);
      assert.equal(measured.locale,locale);
      assert.equal(measured.pages,4);
      assert.equal(measured.video,0);
      assert.equal(measured.reduced,true);
      assert.ok(measured.controls.length>=10&&measured.controls.every(([w,h])=>w>=44&&h>=44),JSON.stringify(measured));
      assert.equal(await page.locator('[data-studio-node="story_storyVideo"] img').count(),1);
      assert.equal(await page.locator('[data-studio-node="story_storyVideo"] button').count(),0);
      if (width===430&&locale==="ky") await shot(page,"ky-full",true);
      await page.close();
    }
  }
  for (const locale of ["ru","ky"]) {
    const {page}=await open({width:320,height:844,locale,suffix:"-long"});
    const names=page.locator('[data-studio-node="cover_names"] > div > div');
    await names.getByText(locale==="ru"?/Константинопольская/:/Абдырахманова/).first().waitFor();
    const noOverlap=await page.evaluate(()=>{
      const position=(id)=>document.querySelector('[data-studio-node="'+id+'"]').getBoundingClientRect();
      const title=document.querySelector('[data-studio-node="cover_names"] > div > div').getBoundingClientRect();
      return title.bottom<=position("cover_date").top+1&&position("story_episode1Copy").bottom<=position("story_episode2").top+1;
    });
    assert.ok(noOverlap);
    await shot(page,"long-"+locale,true);
    await page.close();
  }
}

async function checkGuest(locale) {
  const {page}=await open({locale});
  const ru=locale==="ru";
  await page.locator('[data-studio-node="cover_next"] a').press("Enter");
  assert.match(page.url(),/-story$/);
  const calendar=page.locator('[data-studio-node="event_calendar"] button');
  const [download]=await Promise.all([page.waitForEvent("download"),calendar.press("Enter")]);
  assert.match(await readFile(await download.path(),"utf8"),/DTSTART:20270529T110000Z/);
  assert.match(decodeURIComponent(await page.locator('[data-studio-node="event_map"] a').getAttribute("href")),/Курманжан/);
  const form=page.locator(".v2-guest-form");
  const name=form.locator("input[autocomplete=name]");
  const wish=form.locator("textarea");
  const submit=form.locator("button[type=submit]");
  const contrast=await submit.evaluate(btn=>{
    const style=getComputedStyle(btn);
    const luma=color=>{
      const parts=color.match(/\d+/g).slice(0,3).map(Number);
      const channels=parts.map(x=>x/255).map(x=>x<=0.04045?x/12.92:((x+.055)/1.055)**2.4);
      return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
    };
    return (luma(style.color)+.05)/(luma(style.backgroundColor)+.05);
  });
  assert.ok(contrast>=4.5,contrast);
  await submit.click();
  assert.equal(await name.getAttribute("aria-invalid"),"true");
  assert.equal(await name.evaluate(el=>document.activeElement===el),true);
  await form.getByRole("alert").waitFor();
  if (ru) await shot(page,"rsvp-validation");
  await name.fill("Сбой");
  const wishText=ru?"Светлого будущего":"Жаркын келечек каалайбыз";
  await wish.fill(wishText);
  await form.locator(".v2-guest-stepper button").last().click();
  const [failed]=await Promise.all([
    page.waitForRequest(req=>req.method()==="POST"&&req.url().endsWith("/rsvp")),
    submit.click(),
  ]);
  const {attendance,guests}=failed.postDataJSON();
  assert.deepEqual([attendance,guests],["yes",2]);
  await form.getByRole("button",{name:ru?"Отправка…":"Жөнөтүлүүдө…"}).waitFor();
  if (ru) await shot(page,"rsvp-sending");
  await form.getByRole("status").getByText(ru?/попробуйте позже/:/кийин кайра аракет/).waitFor();
  assert.equal(await wish.inputValue(),wishText);
  if (ru) await shot(page,"rsvp-error");
  await name.fill(ru?"Тестовый гость":"Сыноо коногу");
  await form.locator("input[type=radio]").nth(1).check();
  assert.equal(await form.locator(".v2-guest-stepper").count(),0);
  if (ru) await shot(page,"rsvp-decline");
  const [accepted]=await Promise.all([
    page.waitForRequest(req=>req.method()==="POST"&&req.url().endsWith("/rsvp")),
    submit.click(),
  ]);
  assert.deepEqual([accepted.postDataJSON().attendance,accepted.postDataJSON().guests,accepted.postDataJSON().wish],["no",0,wishText]);
  await form.getByRole("status").getByText(ru?/Ответ принят/:/жообуңуз кабыл алынды/i).waitFor();
  if (ru) await shot(page,"rsvp-success");
  const player=page.locator(".v2-stationery-music");
  await player.getByRole("button",{name:ru?"Включить музыку":"Музыканы ойнотуу"}).click();
  await player.getByRole("button",{name:ru?"Остановить музыку":"Музыканы токтотуу"}).waitFor();
  if (ru) await shot(page,"music-playing");
  await player.getByRole("button",{name:ru?"Остановить музыку":"Музыканы токтотуу"}).click();
  await player.getByRole("button",{name:ru?"Включить музыку":"Музыканы ойнотуу"}).waitFor();
  await page.close();
}

async function checkDegradedStates() {
  const {page:broken}=await open({width:390,height:844,brokenPoster:true});
  await broken.waitForFunction(()=>document.querySelector('[data-studio-node="cover_heroPoster"] img').complete);
  assert.equal(await broken.locator('[data-studio-node="cover_heroPoster"] img').evaluate(img=>img.naturalWidth),0);
  await broken.locator('[data-studio-node="cover_next"] a').click();
  assert.match(broken.url(),/-story$/);
  await broken.locator('[data-studio-node="story_storyVideo"] img').waitFor();
  assert.ok(await broken.locator(".v2-guest-form button[type=submit]").isEnabled());
  await broken.close();
  const {page:silent}=await open({suffix:"-silent"});
  assert.equal(await silent.locator(".v2-stationery-music").count(),0);
  await silent.close();
  for (const [suffix,message] of [["-closed","Приём ответов завершён"],["-unavailable","Приём ответов пока недоступен"]]) {
    const {page}=await open({suffix});
    await page.getByRole("status").getByText(message).waitFor();
    assert.ok(await page.locator(".v2-guest-form button[type=submit]").isDisabled());
    await page.close();
  }
}

async function checkEditor() {
  const {page,tickets}=await open({owner:true,width:390,height:844});
  const preview=page.getByRole("complementary",{name:"Предпросмотр"});
  const node=id=>preview.locator('[data-studio-node="'+id+'"]');
  const next=page.getByRole("button",{name:"Следующая секция",exact:true});
  const close=page.locator(".ce-mobile-sheet-handle button");
  const sheet=page.getByRole("dialog");
  async function editText(id,label,copy){
    await node(id).click();
    await sheet.getByRole("textbox",{name:label+" ru",exact:true}).fill(copy);
    for (const line of copy.split("\n")) await node(id).getByText(line,{exact:true}).waitFor();
    await close.click();
  }
  await editText("cover_names","Имена пары","Алина и Айдар");
  await editText("cover_venue","Название площадки","Тестовая вилла");
  await next.click();
  await editText("story_intro","Текст приглашения","Ждём вас на свадьбе");
  await editText("story_episode1Copy","Первая встреча","01.01.2023\nНОВАЯ ГЛАВА\nКак всё начиналось");
  await next.click();
  await node("event_date").click();
  await sheet.locator('input[type="datetime-local"]').first().fill("2028-06-12T18:25");
  for (const [id,copy] of [["event_date","12"],["event_month","06"],["event_year","2028"]]) {
    for (const line of copy.split("\n")) await node(id).getByText(line,{exact:true}).waitFor();
  }
  await close.click();
  await node("event_program").click();
  await sheet.locator('input[type="time"]').first().fill("15:45");
  await node("event_program").getByText("15:45",{exact:true}).waitFor();
  await close.click();
  await editText("event_venueAddress","Адрес","Бишкек, тестовая площадка");

  await page.getByRole("button",{name:"Фото",exact:true}).click();
  const target=page.getByLabel("Что заменить на приглашении");
  const input=page.locator('.ce-cloud-group input[type=file]').first();
  const buffer=await readFile(new URL("../../public/images/collection/love-story/vf-01/cover_photo.webp",import.meta.url));
  const photos=["cover_heroPoster","story_storyVideo","story_episode1","story_episode2","story_episode3","event_venueHero","event_venuePhoto"];
  for (const id of photos) {
    await target.selectOption(id);
    await input.setInputFiles({name:id+".webp",mimeType:"image/webp",buffer});
    await page.getByText(/Загружено 1 \/ 1/).waitFor();
  }
  assert.equal([...tickets.values()].filter(value=>value.body).length,7);
  await close.click();
  await page.getByRole("button",{name:"Предыдущая секция",exact:true}).click();
  const replacement=node("story_episode1").locator("img");
  await replacement.waitFor();
  assert.match(await replacement.getAttribute("src"),/^https:\/\/vf04\.r2\.cloudflarestorage\.com\/read\//);
  assert.equal(await node("story_episode1Frame").locator("img").count(),1);
  await shot(page,"editor-replaced-episode");
  await next.click();
  await next.click();
  await editText("rsvp_intro","Вступление к анкете","Ответьте до пятницы");
  await node("rsvp_response").click();
  await sheet.getByLabel("Количество гостей").selectOption("5");
  await sheet.locator('input[type="datetime-local"]').first().fill("2028-06-07T21:00");
  await close.click();
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem("eventiq:customer-draft:v1:6eacc829-78b8-44ce-b3d1-01f02085bbfd")));
  for (const id of photos) assert.match(draft.values[id].assetId,/^customer_/);
  assert.equal(draft.values.ceremonyDate.value.value,"2028-06-12T18:25:00+06:00");
  assert.equal(draft.values.event_program.items[0].time,"15:45");
  assert.equal(draft.values.rsvp_response.maxGuests,5);
  assert.equal(draft.values.rsvp_response.deadline,"2028-06-07T21:00:00+06:00");
  await page.reload();
  await preview.getByText("Алина и Айдар",{exact:true}).waitFor();
  await page.close();
}

try {
  if (!ownerOnly) await capture();
  if (!captureOnly&&!ownerOnly) {
    await checkMobile();
    for (const locale of ["ru","ky"]) await checkGuest(locale);
    await checkDegradedStates();
    console.log("12 mobile combinations, posters, reduced motion, calendar, RSVP and music passed.");
  }
  if (ownerOnly||process.argv.includes("--owner")) {
    await checkEditor();
    console.log("UniversalMobileEditor with seven photo replacements, linked date and draft reload passed.");
  }
  assert.deepEqual(errors,[]);
} finally {
  await browser.close();
}
