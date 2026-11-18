import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";
import {mkdir,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {STRESS_LIMITS,createStudioStressProject} from "./studio-v2-stress-fixture.mjs";
import {parseProjectV2} from "../src/features/studio-v2/core/document.schema.ts";
import {layoutDocument} from "../src/features/studio-v2/core/layout-engine.ts";
import {visibleArtboards,pinnedArtboards} from "../src/features/studio-v2/core/render-window.ts";
import {createEditorSession,dispatchStudioCommand,undoStudio,redoStudio} from "../src/features/studio-v2/core/command-engine.ts";

const percentile=(a,q)=>{const sorted=[...a].sort((x,y)=>x-y);return +sorted[Math.min(sorted.length-1,Math.ceil(q*sorted.length)-1)].toFixed(2);};
const sample=(fn,count=8)=>{for(let i=0;i<2;i++)fn();const values=[];for(let i=0;i<count;i++){const t=performance.now();fn();values.push(performance.now()-t);}return {samples:values.length,p50Ms:percentile(values,.5),p95Ms:percentile(values,.95),maxMs:+Math.max(...values).toFixed(2)};};
const doc=createStudioStressProject(),pages=doc.pages.length,nodes=Object.keys(doc.nodes).length,assets=Object.keys(doc.assets).length;
assert.deepEqual({pages,nodes,assets},STRESS_LIMITS);
assert.equal(parseProjectV2(doc).pages.length,30);
for(const page of doc.pages){const root=doc.nodes[page.rootNodeId];assert.equal(root.type,"frame");assert.equal(root.children.length>=15,true);}
const camera={x:0,y:0,zoom:.5},size={width:1200,height:800};
const rects=doc.pages.map(page=>({id:page.id,rect:{x:page.placement.x,y:page.placement.y,width:1080,height:1920}}));
const initial=visibleArtboards(rects,camera,size,pinnedArtboards(doc,doc.pages[0].id,[]),nodes);
assert.ok(initial.size<=5,"Large documents should mount only nearby artboards");
const pinned=pinnedArtboards(doc,null,["stress-node-469"],undefined,"stress-page-18");
assert.ok(pinned.has("stress-page-19")&&pinned.has("stress-page-18"));
assert.ok(visibleArtboards(rects,camera,size,pinned,nodes).has("stress-page-19"));
const broken=structuredClone(doc),extra={...broken.nodes["stress-node-1"],id:"stress-overflow",parentId:"stress-frame-0"};
broken.nodes[extra.id]=extra;broken.nodes["stress-frame-0"].children.push(extra.id);
assert.equal(Object.keys(broken.nodes).length,501);
assert.equal((await import("../src/features/studio-v2/core/document.schema.ts")).isProjectV2(broken),false);
function updateAndUndo(){
 let session=createEditorSession(doc);
 const before=session.document.nodes["stress-node-1"].x;
 session=dispatchStudioCommand(session,{kind:"updateNode",id:"stress-node-1",changes:{x:before+12}});
 assert.equal(session.document.nodes["stress-node-1"].x,before+12);
 session=undoStudio(session);assert.equal(session.document.nodes["stress-node-1"].x,before);
 session=redoStudio(session);assert.equal(session.document.nodes["stress-node-1"].x,before+12);
}
updateAndUndo();
const metrics={
 runtime:{node:process.version,platform:process.platform,arch:process.arch,heapUsedMb:+(process.memoryUsage().heapUsed/1048576).toFixed(2)},
 fixture:STRESS_LIMITS,
 validation:sample(()=>parseProjectV2(doc),10),
 layout:sample(()=>layoutDocument(doc),10),
 viewport:sample(()=>visibleArtboards(rects,camera,size,pinned,nodes),30),
 editHistory:sample(updateAndUndo,6),
 initialMountedArtboards:initial.size
};
const out=process.env.STUDIO_STRESS_ARTIFACTS??"studio-browser-artifacts";
await mkdir(out,{recursive:true});
await writeFile(join(out,"stress-core.json"),JSON.stringify(metrics,null,2));
assert.ok(Object.values(metrics).every(x=>x!==undefined));
console.log("PASS: Studio v2 schema limits, render culling, history and core stress metrics");
console.log(JSON.stringify(metrics,null,2));
