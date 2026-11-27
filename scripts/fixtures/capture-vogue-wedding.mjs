import assert from "node:assert/strict";
import {mkdir, readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {resolve} from "node:path";
import {ownerUploadFixture,readOwnerDraft} from "./owner-upload-fixture.mjs";

const require = createRequire(resolve(process.env.STUDIO_BROWSER_PREFIX ?? ".", "package.json"));
const {chromium} = require("playwright");
const origin = new URL(process.env.VF02_APP_ORIGIN ?? "http://127.0.0.1:4282");
const fixtureOrigin = new URL(process.env.VF02_API_ORIGIN ?? "http://127.0.0.1:4283").origin;
for (const url of [origin, new URL(fixtureOrigin)]) assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
const output = resolve(process.argv[2] ?? "/tmp/eventiq-vf-02");
await mkdir(output, {recursive: true});
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH, headless: true});
const errors = [];

async function open(width = 390, height = 1048, locale = "ru", {suffix = "", edit = false} = {}) {
  const page = await browser.newPage({viewport: {width,height}, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: "reduce"});
  await page.route("**/*", route => [origin.origin, fixtureOrigin].includes(new URL(route.request().url()).origin)
    ? route.continue() : route.abort());
  const uploads = edit ? await ownerUploadFixture(page, {
    origin, fixtureOrigin, storageHost: "vf02.r2.cloudflarestorage.com", photoWidth: 390, photoHeight: 651,
  }) : undefined;
  page.on("pageerror", error => errors.push(error.message));
  await page.clock.setFixedTime(new Date("2026-11-25T00:35:24Z"));
  const route = edit ? "/editor?template=vogue-wedding" : "/c/vogue-wedding" + suffix;
  assert.equal((await page.goto(new URL("/"+locale+route,origin).href)).status(),200);
  await page.locator("[data-preview-page]").first().waitFor();
  if (!edit) {
    await page.locator(".v2-countdown-grid").getByText("185", {exact: true}).waitFor();
    await page.waitForFunction(target => document.querySelector("[data-preview-page]").clientWidth === target, width);
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll("[data-preview-page] img")].map(img => {
      img.loading = "eager";
      return img.decode();
    }));
  });
  await page.addStyleTag({content: "nextjs-portal {display:none}"});
  return {page, uploads};
}

function shot(page, name, fullPage = false) {
  return page.screenshot({path: resolve(output, name+".png"), fullPage, animations: "disabled"});
}

async function capture(page) {
  const boards = page.locator("[data-preview-page]");
  assert.deepEqual(await page.locator(".v2-countdown-grid strong").allTextContents(),["185","10","24","36"]);
  const sizes = await boards.evaluateAll(sections => sections.map(el => [el.clientWidth,el.clientHeight]));
  assert.equal(sizes.length,4);
  assert.ok(sizes.every(([w,h]) => w===390 && (process.argv.includes("--capture-only") ? h>=1048 : h===1048)));
  for (const [i, board] of (await boards.all()).entries()) {
    await board.evaluate(el => window.scrollTo({top: scrollY + el.getBoundingClientRect().top, behavior: "instant"}));
    assert.equal(Math.round(await board.evaluate(el => el.getBoundingClientRect().top)), 0);
    await shot(page, String(i+1).padStart(2,"0"));
  }
  await shot(page,"full",true);
}

async function checkGuest(locale) {
  const {page} = await open(390,1048,locale);
  const ru = locale === "ru";
  await page.locator('[data-studio-node="cover_coverScroll"] a').click();
  assert.match(page.url(),/-invitation$/);
  const gallery = page.locator(".v2-editorial-mosaic");
  assert.deepEqual(await gallery.getByText(/^0[1-4]$/).allTextContents(),["01","02","03","04"]);
  await gallery.locator("button").nth(1).click();
  const lightbox = page.locator(".v2-editorial-lightbox");
  await lightbox.waitFor();
  await page.keyboard.press("ArrowRight");
  await lightbox.getByText("3 / 4",{exact:true}).waitFor();
  await lightbox.getByRole("button",{name:ru?"Закрыть":"Жабуу",exact:true}).click();
  const map = page.locator('[data-studio-node="gallery_mapButton"] a');
  assert.match(decodeURIComponent(await map.getAttribute("href")),/Курманжан/);

  const form = page.locator(".v2-guest-form");
  const name = form.locator("input[autocomplete=name]");
  const submit = form.locator("button[type=submit]");
  const guests = form.locator("select");
  await name.scrollIntoViewIfNeeded();
  await form.locator("input").first().press("Tab");
  assert.equal(await form.locator("input[type=radio]").first().evaluate(el => el.matches(":focus-visible")), true);
  await submit.click();
  await form.getByRole("alert").waitFor();
  assert.equal(await name.getAttribute("aria-invalid"),"true");
  assert.equal(await name.evaluate(el => document.activeElement === el), true);
  if (ru) await shot(page,"rsvp-validation");

  await name.fill("Сбой");
  await guests.selectOption("3");
  const [failed] = await Promise.all([
    page.waitForRequest(req => req.method()==="POST"&&req.url().endsWith("/rsvp")),
    submit.click(),
  ]);
  assert.equal(failed.postDataJSON().guests,3);
  assert.equal(failed.postDataJSON().attendance,"yes");
  await form.getByRole("button",{name:ru?"Отправка…":"Жөнөтүлүүдө…"}).waitFor();
  assert.equal(await submit.isDisabled(),true);
  if (ru) await shot(page,"rsvp-sending");
  await form.getByRole("status").getByText(ru?/попробуйте позже/:/кийин кайра аракет/).waitFor();
  assert.equal(await name.inputValue(),"Сбой");
  assert.equal(await guests.inputValue(),"3");
  if (ru) await shot(page,"rsvp-error");

  await name.fill(ru?"Тестовый гость":"Сыноо коногу");
  await form.locator("input[type=radio]").nth(1).check();
  assert.equal(await guests.count(),0);
  if (ru) await shot(page,"rsvp-decline");
  const [accepted] = await Promise.all([
    page.waitForRequest(req => req.method()==="POST"&&req.url().endsWith("/rsvp")),
    submit.click(),
  ]);
  assert.equal(accepted.postDataJSON().attendance,"no");
  assert.equal(accepted.postDataJSON().guests,0);
  await form.getByRole("status").getByText(ru?/Ответ принят/:/жообуңуз кабыл алынды/i).waitFor();
  if (ru) await shot(page,"rsvp-success");
  await page.close();
}

async function checkEditor() {
  const {page,uploads} = await open(390,844,"ru",{edit:true});
  const preview = page.getByRole("complementary",{name:"Предпросмотр"});
  await preview.locator('[data-studio-node="cover_coverNames"]').click();
  const close = page.locator(".ce-mobile-sheet-handle button");
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("textbox",{name:"Имена пары ru",exact:true}).fill("Алина и Айдар");
  const language = sheet.locator(".ce-form > .ce-language select");
  await language.selectOption("ky");
  await sheet.getByRole("textbox",{name:"Имена пары ky",exact:true}).fill("Алина жана Айдар");
  await preview.getByText("Алина жана Айдар",{exact:true}).waitFor();
  await language.selectOption("ru");
  await preview.getByText("Алина и Айдар",{exact:true}).waitFor();
  await close.click();
  await preview.locator('[data-studio-node="cover_coverDate"]').click();
  await sheet.locator('input[type="datetime-local"]').first().fill("2027-06-12T18:25");
  await preview.getByText(/12 ИЮНЯ 2027/).waitFor();
  await close.click();

  const next = page.getByRole("button",{name:"Следующая секция",exact:true});
  await next.click();
  await preview.locator('[data-studio-node="invitation_invitationText"]').click();
  await sheet.getByRole("textbox",{name:"Текст приглашения ru",exact:true}).fill("Ждём вас на нашей свадьбе");
  await preview.getByText("Ждём вас на нашей свадьбе",{exact:true}).waitFor();
  await close.click();
  await preview.locator('[data-studio-node="invitation_scheduleWidget"]').click();
  await sheet.locator('input[type="time"]').first().fill("15:45");
  await preview.getByText("15:45",{exact:true}).waitFor();
  await close.click();
  await next.click();
  await preview.locator('[data-studio-node="gallery_venueName"]').click();
  await sheet.getByRole("textbox",{name:"Название площадки ru",exact:true}).fill("Тестовый зал");
  await preview.getByText("Тестовый зал",{exact:true}).waitFor();
  await close.click();
  await preview.locator('[data-studio-node="gallery_venueAddress"]').click();
  await sheet.getByRole("textbox",{name:"Адрес ru",exact:true}).fill("Бишкек, тестовая площадка");
  await preview.getByText("Бишкек, тестовая площадка",{exact:true}).waitFor();
  await close.click();

  await page.getByRole("button",{name:"Фото",exact:true}).click();
  const target = page.getByLabel("Что заменить на приглашении");
  const input = page.locator('.ce-cloud-group input[type=file]').first();
  const buffer = await readFile(new URL("../../public/images/collection/love-story/vf-01/cover_photo.webp",import.meta.url));
  for (const [id,count] of [["cover_coverPhoto",1],["gallery_galleryWidget",4],["gallery_venuePhoto",1]]) {
    await target.selectOption(id);
    const files = Array.from({length:count},(_,i) => ({name:id+"-"+i+".webp",mimeType:"image/webp",buffer}));
    await input.setInputFiles(files);
    await page.getByText(new RegExp(`Загружено ${count} / ${count}`)).waitFor();
  }
  assert.equal([...uploads.tickets.values()].filter(ticket => ticket.body).length,6);
  const mosaic = preview.locator(".v2-editorial-mosaic");
  await mosaic.locator("img").first().waitFor();
  assert.equal(await mosaic.locator("img").count(),4);
  assert.ok((await mosaic.locator("img").evaluateAll(images => images.map(img => img.src)))
    .every(src => src.startsWith("https://vf02.r2.cloudflarestorage.com/read/")));
  assert.deepEqual(await mosaic.locator(".v2-contact-sheet-index").allTextContents(),["01","02","03","04"]);
  assert.equal(await mosaic.locator("img").first().evaluate(img => getComputedStyle(img).filter), "grayscale(1)");
  await close.click();
  await shot(page,"editor-gallery-replaced");

  await next.click();
  await preview.locator('[data-studio-node="rsvpPage_rsvpIntro"]').click();
  await sheet.getByRole("textbox",{name:"Вступление к анкете ru",exact:true}).fill("Ответьте до пятницы");
  await preview.getByText("Ответьте до пятницы",{exact:true}).waitFor();
  await close.click();
  await preview.locator('[data-studio-node="rsvpPage_rsvpWidget"]').click();
  await sheet.getByLabel("Количество гостей").selectOption("5");
  await sheet.locator('input[type="datetime-local"]').first().fill("2027-06-07T21:00");
  await close.click();
  const stored = await readOwnerDraft(page,uploads.subject,"9aa5a875-fff4-4d92-ba35-a7f43e00a306");
  assert.match(stored.values.cover_coverPhoto.assetId,/^customer_/);
  assert.match(stored.values.gallery_venuePhoto.assetId,/^customer_/);
  assert.equal(new Set(stored.values.gallery_galleryWidget.assetIds).size,4);
  assert.ok(stored.values.gallery_galleryWidget.assetIds.every(id => id.startsWith("customer_")));
  assert.equal(stored.values.ceremonyDate.value.value,"2027-06-12T18:25:00+06:00");
  assert.equal(stored.values.invitation_scheduleWidget.items[0].time,"15:45");
  assert.equal(stored.values.rsvpPage_rsvpWidget.maxGuests,5);
  assert.equal(stored.values.rsvpPage_rsvpWidget.deadline,"2027-06-07T21:00:00+06:00");
  await page.reload();
  await preview.getByText("Алина и Айдар",{exact:true}).waitFor();
  await page.close();
}

try {
  if (process.argv.includes("--owner-only")) {
    await checkEditor();
    console.log("Passed UniversalMobileEditor with six photo replacements, editable fields and draft reload.");
  } else {
    const {page} = await open();
    await capture(page);
    await page.close();
  }
  if (!process.argv.some(arg => arg === "--capture-only" || arg === "--owner-only")) {
    for (const [width,height] of [[320,568],[360,800],[375,812],[390,844],[412,915],[430,932]]) {
      for (const locale of ["ru","ky"]) {
        const {page} = await open(width,height,locale);
        const layout = await page.evaluate(() => ({
          lang: document.querySelector(".v2-project-renderer").lang,
          width: document.documentElement.scrollWidth,
          sections: document.querySelectorAll("[data-preview-page]").length,
          controls: [...document.querySelectorAll(".v2-guest-form input[autocomplete=name], .v2-guest-form select, .v2-guest-form button, .v2-guest-options label")]
            .map(control => control.getBoundingClientRect().height),
        }));
        assert.equal(layout.lang,locale);
        assert.equal(layout.width,width);
        assert.equal(layout.sections,4);
        assert.equal(layout.controls.length,5);
        assert.ok(layout.controls.every(h => h>=44),JSON.stringify(layout));
        if (width===390&&locale==="ky") await shot(page,"ky-full",true);
        await page.close();
      }
    }
    for (const locale of ["ru","ky"]) {
      const {page} = await open(320,844,locale,{suffix:"-long"});
      const title = page.locator('[data-studio-node="cover_coverNames"] > div > div');
      assert.match(await title.innerText(),locale==="ru"?/Константинопольская/:/Абдырахманова/);
      assert.ok(await title.evaluate(el => {
        const photo = document.querySelector('[data-studio-node="cover_coverPhoto"]');
        return el.getBoundingClientRect().bottom <= photo.getBoundingClientRect().top + 1;
      }));
      await shot(page,"long-"+locale,true);
      await page.close();
      await checkGuest(locale);
    }
    for (const [suffix,message] of [["-closed","Приём ответов завершён"],["-unavailable","Приём ответов пока недоступен"]]) {
      const {page} = await open(390,1048,"ru",{suffix});
      await page.getByRole("status").getByText(message).waitFor();
      assert.ok(await page.locator(".v2-guest-form button[type=submit]").isDisabled());
      await page.close();
    }
    if (process.argv.includes("--owner")) await checkEditor();
    console.log("Passed 12 mobile viewports, long names RU/KY, fixed countdown, lightbox, map and RSVP in both locales.");
    if (process.argv.includes("--owner")) console.log("Passed UniversalMobileEditor with six photo replacements, editable fields and draft reload.");
  }
  assert.deepEqual(errors,[]);
} finally {
  await browser.close();
}
