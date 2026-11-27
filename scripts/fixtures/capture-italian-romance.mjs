import assert from "node:assert/strict";
import {mkdir, readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {resolve} from "node:path";
import {ownerUploadFixture,readOwnerDraft} from "./owner-upload-fixture.mjs";

const require = createRequire(resolve(process.env.STUDIO_BROWSER_PREFIX ?? ".", "package.json"));
const {chromium} = require("playwright");
const origin = new URL(process.env.VF03_APP_ORIGIN ?? "http://127.0.0.1:4286");
const fixtureOrigin = new URL(process.env.VF03_API_ORIGIN ?? "http://127.0.0.1:4285").origin;
for (const url of [origin, new URL(fixtureOrigin)]) assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
const output = resolve(process.argv[2] ?? ".artifacts/italian-romance");
await mkdir(output, {recursive: true});

const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH, headless: true});
const errors = [];
const captureOnly = process.argv.includes("--capture-only");
const ownerOnly = process.argv.includes("--owner-only");

async function open({width=390,height=1058,locale="ru",suffix="",owner=false}={}) {
  const page = await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:"reduce"});
  await page.route("**/*", route => [origin.origin, fixtureOrigin].includes(new URL(route.request().url()).origin)
    ? route.continue() : route.abort());
  const tickets = owner ? await ownerUploadFixture(page,{
    origin,fixtureOrigin,storageHost:"vf03.r2.cloudflarestorage.com",photoWidth:390,photoHeight:651,
  }) : undefined;
  page.on("pageerror", error=>errors.push(error.message));
  await page.clock.setFixedTime(new Date("2026-11-27T06:00:00Z"));
  const route = owner ? "/editor?template=italian-romance" : "/c/italian-romance"+suffix;
  assert.equal((await page.goto(new URL("/"+locale+route,origin).href,{waitUntil:"domcontentloaded"})).status(),200);
  await page.locator("[data-preview-page]").first().waitFor();
  if (!owner) await page.waitForFunction(w=>document.querySelector("[data-preview-page]").clientWidth===w,width);
  await page.evaluate(async()=>{
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll("[data-preview-page] img")].map(img=>{
      img.loading="eager";
      return img.decode();
    }));
  });
  await page.addStyleTag({content:"nextjs-portal{display:none}"});
  return {page,tickets};
}

function shot(page,name,fullPage=false) {
  return page.screenshot({path:resolve(output,name+".png"),fullPage,animations:"disabled"});
}

async function capture() {
  const {page}=await open();
  const boards=page.locator("[data-preview-page]");
  const sizes=await boards.evaluateAll(els=>els.map(el=>[el.clientWidth,el.clientHeight]));
  assert.equal(sizes.length,4);
  assert.ok(sizes.every(([w,h])=>w===390&&(captureOnly?h>=1058:h===1058)),JSON.stringify(sizes));
  for (const [i,board] of (await boards.all()).entries()) {
    const id=String(i+1).padStart(2,"0");
    await board.evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top,behavior:"instant"}));
    assert.equal(Math.round(await board.evaluate(el=>el.getBoundingClientRect().top)),0);
    await shot(page,id);
    if (sizes[i][1]>1058) await board.screenshot({path:resolve(output,id+"-full.png"),animations:"disabled"});
  }
  await shot(page,"full",true);
  await page.close();
}

async function checkMobile() {
  for (const [width,height] of [[320,568],[360,800],[375,812],[390,844],[412,915],[430,932]]) {
    for (const locale of ["ru","ky"]) {
      const {page}=await open({width,height,locale});
      const measured=await page.evaluate(()=>({
        width:document.documentElement.scrollWidth,
        locale:document.querySelector(".v2-project-renderer").lang,
        sections:document.querySelectorAll("[data-preview-page]").length,
        touchTargets:[...document.querySelectorAll(".v2-month-header button,.v2-guest-form :is(input[autocomplete=name],textarea,button,.v2-guest-options label)")].map(el=>el.getBoundingClientRect().height),
        overlap:document.querySelector(".v2-editorial-mosaic").getBoundingClientRect().top < document.querySelector('[data-studio-node="gallery_storyQuote"] > div > div').getBoundingClientRect().bottom,
      }));
      assert.equal(measured.width,width);
      assert.equal(measured.locale,locale);
      assert.equal(measured.sections,4);
      assert.equal(measured.overlap,false);
      assert.ok(measured.touchTargets.length>=8&&measured.touchTargets.every(h=>h>=44),JSON.stringify(measured));
      if (width===390&&locale==="ky") await shot(page,"ky-full",true);
      await page.close();
    }
  }
  for (const locale of ["ru","ky"]) {
    const {page}=await open({width:320,locale,suffix:"-long"});
    const names=page.locator('[data-studio-node="cover_coverNames"] > div > div');
    assert.match(await names.innerText(),locale==="ru"?/Константинопольская/:/Абдырахманова/);
    assert.ok(await names.evaluate(el=>el.getBoundingClientRect().bottom<=
      document.querySelector('[data-studio-node="cover_coverScene"]').getBoundingClientRect().top+1));
    await shot(page,"long-"+locale,true);
    await page.close();
  }
}

async function checkGuest(locale) {
  const {page}=await open({locale});
  const ru=locale==="ru";
  await page.locator('[data-studio-node="cover_scrollNext"] a').click();
  assert.match(page.url(),/-invitation$/);
  const calendar=page.locator(".v2-collection-month");
  const day=calendar.locator("[data-event-day]");
  assert.equal(await day.innerText(),"29");
  assert.equal(await day.getAttribute("aria-current"),"date");
  const next=calendar.getByRole("button",{name:ru?"Следующий месяц":"Кийинки ай",exact:true});
  await next.press("Enter");
  const returnToEvent=calendar.getByRole("button",{name:ru?"К месяцу свадьбы":"Той өтүүчү айга кайтуу",exact:true});
  await returnToEvent.waitFor();
  assert.equal(await day.count(),0);
  assert.equal(await calendar.getByText("30",{exact:true}).count(),1);
  assert.equal(await calendar.getByText("31",{exact:true}).count(),0);
  if (ru) await shot(page,"calendar-next");
  await returnToEvent.click();
  assert.equal(await day.innerText(),"29");

  const gallery=page.locator(".v2-editorial-mosaic");
  await gallery.locator("button").nth(1).click();
  const dialog=page.locator(".v2-editorial-lightbox");
  await dialog.getByText("2 / 3",{exact:true}).waitFor();
  await page.keyboard.press("ArrowRight");
  await dialog.getByText("3 / 3",{exact:true}).waitFor();
  await page.keyboard.press("Escape");
  await dialog.waitFor({state:"hidden"});
  const map=page.locator('[data-studio-node="gallery_venueCard"] a');
  assert.match(decodeURIComponent(await map.getAttribute("href")),/Курманжан/);
  assert.match(await map.innerText(),/Villa Toscana/);

  const form=page.locator(".v2-guest-form");
  const name=form.locator("input[autocomplete=name]");
  const wish=form.locator("textarea");
  const submit=form.locator("button[type=submit]");
  await submit.click();
  assert.equal(await name.getAttribute("aria-invalid"),"true");
  assert.equal(await name.evaluate(el=>document.activeElement===el),true);
  await form.getByRole("alert").waitFor();
  if (ru) await shot(page,"rsvp-validation");
  await name.fill("Сбой");
  await wish.fill(ru?"Тёплые пожелания":"Жылуу каалоолор");
  await form.locator(".v2-guest-stepper button").last().click();
  const [failed]=await Promise.all([
    page.waitForRequest(req=>req.method()==="POST"&&req.url().endsWith("/rsvp")),
    submit.click(),
  ]);
  assert.equal(failed.postDataJSON().guests,2);
  assert.equal(failed.postDataJSON().attendance,"yes");
  assert.ok(failed.postDataJSON().wish.length>0);
  await form.getByRole("button",{name:ru?"Отправка…":"Жөнөтүлүүдө…"}).waitFor();
  if (ru) await shot(page,"rsvp-sending");
  await form.getByRole("status").getByText(ru?/попробуйте позже/:/кийин кайра аракет/).waitFor();
  assert.equal(await wish.inputValue(),ru?"Тёплые пожелания":"Жылуу каалоолор");
  if (ru) await shot(page,"rsvp-error");

  await name.fill(ru?"Тестовый гость":"Сыноо коногу");
  await form.locator("input[type=radio]").nth(1).check();
  assert.equal(await form.locator(".v2-guest-stepper").count(),0);
  if (ru) await shot(page,"rsvp-decline");
  const [accepted]=await Promise.all([
    page.waitForRequest(req=>req.method()==="POST"&&req.url().endsWith("/rsvp")),
    submit.click(),
  ]);
  assert.equal(accepted.postDataJSON().attendance,"no");
  assert.equal(accepted.postDataJSON().guests,0);
  assert.equal(accepted.postDataJSON().wish,ru?"Тёплые пожелания":"Жылуу каалоолор");
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

async function checkVariants() {
  for (const count of [1,2,4]) {
    const {page}=await open({width:320,height:844,suffix:"-gallery-"+count});
    const photos=page.locator(".v2-editorial-mosaic button");
    assert.equal(await photos.count(),count);
    for (const [i,photo] of (await photos.all()).entries()) {
      await photo.press("Enter");
      await page.locator(".v2-editorial-lightbox").getByText(`${i+1} / ${count}`,{exact:true}).waitFor();
      await page.keyboard.press("Escape");
    }
    await page.close();
  }
  const {page:leap}=await open({suffix:"-leap"});
  const february=leap.locator(".v2-collection-month");
  assert.match(await february.innerText(),/февраль 2028/i);
  assert.equal(await february.locator("[data-event-day]").innerText(),"29");
  assert.equal(await february.getByText("30",{exact:true}).count(),0);
  await leap.close();
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
  const {page,tickets}=await open({owner:true,height:844});
  const preview=page.getByRole("complementary",{name:"Предпросмотр"});
  const node=id=>preview.locator('[data-studio-node="'+id+'"]');
  const next=page.getByRole("button",{name:"Следующая секция",exact:true});
  const close=page.locator(".ce-mobile-sheet-handle button");
  const sheet=page.getByRole("dialog");
  async function editText(id,label,copy){
    await node(id).click();
    await sheet.getByRole("textbox",{name:label+" ru",exact:true}).fill(copy);
    await node(id).getByText(copy,{exact:true}).waitFor();
    await close.click();
  }
  await editText("cover_coverNames","Имена пары","Алина и Айдар");
  await editText("cover_coverVenue","Название площадки","Тестовая вилла");
  await next.click();
  await node("invitation_calendar").click();
  await sheet.locator('input[type="datetime-local"]').first().fill("2027-06-12T18:25");
  await node("invitation_calendar").getByText("12",{exact:true}).waitFor();
  assert.equal(await node("invitation_calendar").locator("[data-event-day]").innerText(),"12");
  await close.click();
  await editText("invitation_invitationCopy","Текст приглашения","Ждём вас на нашей свадьбе");
  await node("invitation_program").click();
  await sheet.locator('input[type="time"]').first().fill("15:45");
  await node("invitation_program").getByText("15:45",{exact:true}).waitFor();
  await close.click();
  await next.click();
  await editText("gallery_storyQuote","Цитата","Всё начинается с любви");
  await editText("gallery_venueCard","Адрес","Бишкек, тестовая площадка");

  await page.getByRole("button",{name:"Фото",exact:true}).click();
  const target=page.getByLabel("Что заменить на приглашении");
  const input=page.locator('.ce-cloud-group input[type=file]').first();
  const buffer=await readFile(new URL("../../public/images/collection/love-story/vf-01/cover_photo.webp",import.meta.url));
  for (const [id,count] of [["cover_coverScene",1],["gallery_polaroidGallery",3],["gallery_venueStoryPreview",1],["gallery_venuePhoto",1]]) {
    await target.selectOption(id);
    await input.setInputFiles(Array.from({length:count},(_,i)=>({name:id+"-"+i+".webp",mimeType:"image/webp",buffer})));
    await page.getByText(new RegExp(`Загружено ${count} / ${count}`)).waitFor();
  }
  assert.equal([...tickets.tickets.values()].filter(value=>value.body).length,6);
  const photos=preview.locator(".v2-editorial-mosaic img");
  assert.equal(await photos.count(),3);
  assert.ok((await photos.evaluateAll(images=>images.map(img=>img.src))).every(url=>url.startsWith("https://vf03.r2.cloudflarestorage.com/read/")));
  await close.click();
  await shot(page,"editor-gallery-replaced");

  await next.click();
  await editText("rsvpPage_rsvpIntro","Вступление к анкете","Ответьте до пятницы");
  await node("rsvpPage_rsvpWidget").click();
  await sheet.getByLabel("Количество гостей").selectOption("5");
  await sheet.locator('input[type="datetime-local"]').first().fill("2027-06-07T21:00");
  await close.click();
  const draft=await readOwnerDraft(page,tickets.subject,"4a3887dd-875e-4933-b80f-4d247231847b");
  assert.match(draft.values.cover_coverScene.assetId,/^customer_/);
  assert.match(draft.values.gallery_venueStoryPreview.assetId,/^customer_/);
  assert.match(draft.values.gallery_venuePhoto.assetId,/^customer_/);
  assert.equal(new Set(draft.values.gallery_polaroidGallery.assetIds).size,3);
  assert.equal(draft.values.ceremonyDate.value.value,"2027-06-12T18:25:00+06:00");
  assert.equal(draft.values.invitation_program.items[0].time,"15:45");
  assert.equal(draft.values.rsvpPage_rsvpWidget.maxGuests,5);
  assert.equal(draft.values.rsvpPage_rsvpWidget.deadline,"2027-06-07T21:00:00+06:00");
  await page.reload();
  await preview.getByText("Алина и Айдар",{exact:true}).waitFor();
  await page.close();
}

try {
  if (!ownerOnly) await capture();
  if (!captureOnly && !ownerOnly) {
    await checkMobile();
    for (const locale of ["ru","ky"]) await checkGuest(locale);
    await checkVariants();
    console.log("12 mobile combinations, long names, calendar, 1–4 photos, place, RSVP and music passed.");
  }
  if (ownerOnly || process.argv.includes("--owner")) {
    await checkEditor();
    console.log("UniversalMobileEditor with six photo replacements, date, editable fields and draft reload passed.");
  }
  assert.deepEqual(errors,[]);
} finally {
  await browser.close();
}
