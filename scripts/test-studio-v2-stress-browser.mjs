import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";
import {createRequire} from "node:module";
import {mkdir,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {STRESS_LIMITS,createStudioStressProject} from "./studio-v2-stress-fixture.mjs";

const require=createRequire(join(process.env.STUDIO_BROWSER_PREFIX,"package.json"));
const {chromium}=require("playwright");
const base=(process.env.STUDIO_TEST_URL??"http://127.0.0.1:4173/invito").replace(/\/$/,"");
const artifacts=process.env.STUDIO_STRESS_ARTIFACTS??"studio-browser-artifacts";
await mkdir(artifacts,{recursive:true});
const round=n=>+n.toFixed(2);
const p=(samples,percent)=>{const a=[...samples].sort((a,b)=>a-b);return round(a[Math.min(a.length-1,Math.max(0,Math.ceil(a.length*percent)-1))]);};
const describe=a=>({count:a.length,p50Ms:p(a,.5),p95Ms:p(a,.95),maxMs:round(Math.max(...a))});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
const errors=[],requests=[];
page.on("pageerror",e=>errors.push(e.message));
page.on("requestfailed",r=>requests.push({url:r.url(),error:r.failure()?.errorText}));
const result={status:"pending",config:STRESS_LIMITS,environment:{chromium:browser.version(),commit:process.env.STUDIO_EXPECT_SHA??process.env.GITHUB_SHA??null},metrics:{},diagnostics:{errors,failedRequests:requests}};
async function seed(doc){
 // Same origin, but load a non-editor static URL so autosave cannot race setup.
 await page.goto(base+"/studio-build.txt",{waitUntil:"domcontentloaded"});
 await page.evaluate(async documentData=>{
  const canvas=document.createElement("canvas");canvas.width=16;canvas.height=16;
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("2D canvas missing");
  ctx.fillStyle="#707A5C";ctx.fillRect(0,0,16,16);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("PNG encoding unavailable")),"image/png"));
  const db=await new Promise((resolve,reject)=>{
   const req=indexedDB.open("invito-studio-v2-local",3);
   req.onupgradeneeded=()=>{for(const name of ["projects","projectRecovery","media","templates"])if(!req.result.objectStoreNames.contains(name))req.result.createObjectStore(name);};
   req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(req.result);
  });
  try{await new Promise((resolve,reject)=>{
   const tx=db.transaction(["projects","media"],"readwrite");
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
   for(const asset of Object.values(documentData.assets)){
    asset.sizeBytes=blob.size;
    tx.objectStore("media").put(blob,asset.storageKey);
   }
   tx.objectStore("projects").put(documentData,documentData.id);
  });}finally{db.close();}
  localStorage.setItem("invito-studio-active-project",documentData.id);
 },doc);
}
async function memory(){
 try{
  const cdp=await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  const m=await cdp.send("Performance.getMetrics");
  const v=Object.fromEntries(m.metrics.map(x=>[x.name,x.value]));
  const counter=await cdp.send("Memory.getDOMCounters").catch(()=>null);
  await cdp.detach();
  return {jsHeapMb:v.JSHeapUsedSize===undefined?null:round(v.JSHeapUsedSize/1048576),domNodes:counter?.nodes??null,documents:counter?.documents??null,domListeners:v.JSEventListeners??null};
 }catch{return {jsHeapMb:null,domNodes:null,documents:null,domListeners:null};}
}
async function settled(){
 await page.waitForFunction(()=>document.querySelector(".v2-draft-state")?.textContent==="Сохранено локально",{timeout:60000});
}
async function navigate(index){
 const id="stress-page-"+index,button=page.locator(".v2-page-item").filter({hasText:"Stress "+String(index+1).padStart(2,"0")});
 const start=performance.now();
 await button.click({timeout:15000});
 await page.waitForFunction(id=>{
  const shell=document.querySelector('[data-studio-page="'+id+'"]');
  return shell?.dataset.artboardRendered==="true"&&shell.querySelector("[data-studio-node]")!==null;
 },id,{timeout:20000});
 return performance.now()-start;
}
try{
 const doc=createStudioStressProject();
 assert.equal(doc.pages.length,30);assert.equal(Object.keys(doc.nodes).length,500);assert.equal(Object.keys(doc.assets).length,200);
 await seed(doc);
 const coldStart=performance.now();
 await page.goto(base+"/ru/admin/studio-v2/",{waitUntil:"domcontentloaded"});
 await page.locator(".v2-stage").waitFor({state:"visible",timeout:60000});
 await settled();
 result.metrics.coldStartMs=round(performance.now()-coldStart);
 result.metrics.memoryAfterLoad=await memory();
 const snapshot=await page.evaluate(()=>({
  pageShells:document.querySelectorAll("[data-studio-page]").length,
  mounted:document.querySelectorAll('[data-artboard-rendered="true"]').length,
  renderedNodes:document.querySelectorAll(".v2-workspace [data-studio-node]").length,
  declaredAssets:document.querySelectorAll(".v2-asset-card").length
 }));
 assert.equal(snapshot.pageShells,30,"All page shells must remain discoverable");
 assert.ok(snapshot.mounted>0&&snapshot.mounted<12,"Offscreen artboards should not create full DOM trees");
 result.metrics.initialScene=snapshot;

 const timings=[];for(const i of [1,12,24,29,0,28,2,17,25,0])timings.push(await navigate(i));
 result.metrics.navigation=describe(timings);
 assert.ok(result.metrics.navigation.p95Ms<15000,"Navigation has become unusably slow");
 result.metrics.memoryAfterNavigation=await memory();

 // Record animation-frame pacing while real wheel events pan the work area.
 await page.evaluate(()=>{
  window.__stressIntervals=[];let previous=0;
  const frame=now=>{if(previous)window.__stressIntervals.push(now-previous);previous=now;if(window.__stressIntervals.length<120)requestAnimationFrame(frame);};
  requestAnimationFrame(frame);
 });
 const stage=page.locator(".v2-stage"),rect=await stage.boundingBox();
 assert.ok(rect);
 await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
 for(let i=0;i<24;i++)await page.mouse.wheel(60,0);
 await page.waitForFunction(()=>window.__stressIntervals?.length>=120,null,{timeout:20000});
 const frameMs=await page.evaluate(()=>window.__stressIntervals);
 result.metrics.framePacing={...describe(frameMs),slowFramesOver50ms:frameMs.filter(x=>x>50).length};
 result.metrics.memoryAfterPan=await memory();

 // 200 real IndexedDB blobs, created as valid PNGs and resolved by the media hook.
 await page.getByRole("button",{name:"Ресурсы",exact:true}).click();
 await page.waitForFunction(()=>document.querySelectorAll(".v2-asset-card img").length===200,null,{timeout:60000});
 result.metrics.assets={count:await page.locator(".v2-asset-card img").count(),memory:await memory()};
 await page.getByRole("button",{name:"Страницы / слои",exact:true}).click();

 // Modify one of the 500 nodes with existing UI; Undo/Redo and local save must survive.
 await navigate(2);
 const layer=page.locator(".v2-layer-row").filter({hasText:/^Stress node 2$/});
 await layer.click();
 const radius=page.getByLabel("Радиус",{exact:true});
 const changedAt=performance.now();
 await radius.fill("43");await radius.blur();
 await page.waitForFunction(()=>document.querySelector('[data-studio-node="stress-node-2"]')?.style.borderTopLeftRadius==="43px");
 result.metrics.editCommitMs=round(performance.now()-changedAt);
 await page.getByRole("button",{name:"Отменить",exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[data-studio-node="stress-node-2"]')?.style.borderTopLeftRadius!=="43px");
 await page.getByRole("button",{name:"Повторить",exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[data-studio-node="stress-node-2"]')?.style.borderTopLeftRadius==="43px");
 await settled();
 result.metrics.memoryAfterEdit=await memory();
 await page.reload({waitUntil:"domcontentloaded"});
 await settled();await navigate(2);
 await page.waitForFunction(()=>document.querySelector('[data-studio-node="stress-node-2"]')?.style.borderTopLeftRadius==="43px");
 result.metrics.persistenceVerified=true;
 await page.screenshot({path:join(artifacts,"stress-desktop.png")});

 // Use the real responsive CSS/navigation on a narrow viewport with the same project.
 await page.setViewportSize({width:390,height:844});
 await page.getByRole("button",{name:"Открыть страницы"}).click();
 const mobileNav=performance.now();
 await page.locator(".v2-page-item").filter({hasText:"Stress 30"}).click();
 result.metrics.mobileNavigationMs=round(performance.now()-mobileNav);
 await page.waitForFunction(()=>document.querySelector('[data-studio-page="stress-page-29"]')?.dataset.artboardRendered==="true");
 await page.getByRole("button",{name:"Открыть свойства"}).click();
 await page.locator(".v2-inspector-tabs").waitFor({state:"visible"});
 result.metrics.mobile={viewport:{width:390,height:844},memory:await memory()};
 await page.screenshot({path:join(artifacts,"stress-mobile.png")});
 assert.deepEqual(errors,[],"No unhandled browser errors");
 result.status="pass";
 console.log("PASS: 30 pages, 500 nodes, 200 image assets; viewport, interactions, undo/redo, autosave and mobile");
}catch(e){
 result.status="fail";
 result.failure=e instanceof Error?e.stack??e.message:String(e);
 await page.screenshot({path:join(artifacts,"stress-failure.png")}).catch(()=>{});
 console.error(result.failure);
 process.exitCode=1;
}finally{
 await writeFile(join(artifacts,"stress-browser.json"),JSON.stringify(result,null,2));
 console.log(JSON.stringify({status:result.status,metrics:result.metrics,errors:result.diagnostics.errors},null,2));
 await browser.close();
}
