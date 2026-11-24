import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {mkdir} from "node:fs/promises";
import {join} from "node:path";
const require=createRequire(join(process.env.STUDIO_BROWSER_PREFIX,"package.json"));
const {chromium}=require("playwright");
const base=(process.env.CUSTOMER_EDITOR_TEST_URL??"http://127.0.0.1:4180").replace(/\/$/,"");
const artifacts=process.env.STUDIO_TEST_ARTIFACTS??"studio-browser-artifacts";
await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true}),errors=[];
async function open(locale,viewport){
 const context=await browser.newContext({viewport});
 const page=await context.newPage();
 page.on("pageerror",e=>errors.push(e.message));
 await page.goto(base+"/"+locale+"/editor?template=editorial-riviera-wedding",{waitUntil:"networkidle"});
 await page.locator(viewport.width <= 850 ? ".ue-mobile" : ".editor-app-modern").waitFor({state:"visible"});
 return {context,page};
}
try{
 const {context,page}=await open("ru",{width:1440,height:920});
 try{
  assert.equal(await page.locator(".editor-workspace>.editor-control-pane").count(),1);
  assert.equal(await page.locator(".editor-workspace>.editor-stage").count(),1);
  assert.ok(await page.locator(".editor-block-list li").count()>=5);
  assert.ok(await page.locator(".editor-phone").isVisible());
  assert.ok((await page.locator(".editor-phone").boundingBox())?.width>=330);
  assert.equal(await page.locator(".inspector-appearance-section").count(),1);
  const cover=page.locator(".editor-inspector");
  const first=cover.locator(".inspector-fields input").first();
  const initial=await first.inputValue();
  await first.fill("Имя Тест");
  assert.notEqual(initial,"Имя Тест");
  await page.waitForFunction(()=>document.querySelector(".editor-phone")?.textContent?.includes("Имя Тест"),null,{timeout:15000});
  await page.locator(".editor-block-list li").nth(1).locator(".editor-block-select").click();
  assert.ok(await page.locator(".editor-inspector h2").isVisible());
  await page.locator(".editor-block-list li").first().locator(".editor-block-select").click();
  const appearance=page.locator(".inspector-appearance-section");
  await appearance.locator("summary").click();
  assert.equal(await appearance.evaluate(el=>el.open),true);
  await page.screenshot({path:join(artifacts,"public-customer-editor-desktop.png")});
 }finally{await context.close();}
 const {context:mobileContext,page:mobile}=await open("ky",{width:390,height:844});
 try{
  const canvas=mobile.getByRole("complementary",{name:"Алдын ала көрүү"});
  const tools=mobile.getByRole("navigation",{name:"Куралдар"});
  assert.ok(await canvas.isVisible());
  await mobile.getByRole("button",{name:"Кийинки бөлүм"}).click();
  assert.match(await mobile.locator(".ce-mobile-page-nav span").innerText(),/^2 \/ /);
  await mobile.getByRole("button",{name:"Мурунку бөлүм"}).click();

  const textTool=tools.getByRole("button",{name:"Текст",exact:true});
  await textTool.click();
  const form=mobile.locator(".ce-controls .editor-inspector");
  assert.ok(await form.isVisible());
  const field=form.locator(".inspector-fields input").first();
  await field.fill("Айгүл Тест");
  await mobile.waitForFunction(()=>document.querySelector(".ce-preview-screen")?.textContent?.includes("Айгүл Тест"));
  await mobile.keyboard.press("Escape");
  await form.waitFor({state:"hidden"});
  assert.ok(await canvas.isVisible());
  assert.ok(await textTool.evaluate(button=>button===document.activeElement));

  const phone=await mobile.locator(".ce-preview-screen").boundingBox();
  assert.ok(phone&&phone.width<=390&&phone.height>200,"Preview must fit a narrow screen");
  const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=3,"No horizontal browser-page scrolling");
  await mobile.screenshot({path:join(artifacts,"public-customer-editor-mobile.png")});
 }finally{await mobileContext.close();}
 assert.deepEqual(errors,[],"No uncaught editor errors");
 console.log("PASS: public INVITO customer editor, responsive workspace, section navigation, dismissing settings and live content");
}finally{await browser.close();}
