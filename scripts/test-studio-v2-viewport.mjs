import assert from "node:assert/strict";
import {
  MIN_ZOOM, MAX_ZOOM, RULER_THICKNESS, screenToWorld, worldToScreen,
  panViewport, zoomAt, viewportWorldBounds, unionRects, fitBounds,
  rulerMarks, getRulerStep, minimapProjection
} from "../src/features/studio-v2/core/viewport.ts";
import { createStudioV2Demo } from "../src/features/studio-v2/demo-project.ts";
import { parseProjectV2 } from "../src/features/studio-v2/core/document.schema.ts";

const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`expected ${a} near ${b}`);
assert.equal(RULER_THICKNESS,14);
const viewport={x:320,y:210,zoom:.4};
const origin={x:-1300,y:1850};
const px=worldToScreen(origin,viewport);
const world=screenToWorld(px,viewport);
close(world.x,origin.x);close(world.y,origin.y);
const anchor={x:180,y:320};
const before=screenToWorld(anchor,viewport);
const changed=zoomAt(viewport,1.7,anchor);
const after=screenToWorld(anchor,changed);
close(before.x,after.x);close(before.y,after.y);
close(zoomAt(viewport,0.001,anchor).zoom,MIN_ZOOM);
close(zoomAt(viewport,900,anchor).zoom,MAX_ZOOM);
const panned=panViewport(viewport,{x:-19,y:30});
assert.equal(panned.x,301);assert.equal(panned.y,240);
const bounds=viewportWorldBounds(viewport,{width:720,height:480});
close(bounds.width,1800);close(bounds.height,1200);
const artboards=[
 {x:-1100,y:-450,width:1080,height:1920},
 {x:180,y:-450,width:1080,height:1920},
 {x:1460,y:-450,width:1080,height:1920},
];
const union=unionRects(artboards);
assert.equal(union.x,-1100);assert.equal(union.width,3640);
const fitted=fitBounds(union,{width:1000,height:700},45);
assert.ok(fitted.zoom>=MIN_ZOOM&&fitted.zoom<=MAX_ZOOM);
const top=worldToScreen({x:union.x,y:union.y},fitted);
const bottom=worldToScreen({x:union.x+union.width,y:union.y+union.height},fitted);
assert.ok(top.x>=-0.01&&top.y>=-0.01);
assert.ok(bottom.x<=1000.01&&bottom.y<=700.01);
for(const zoom of [.1,.28,1,2.9]){
 const major=getRulerStep(zoom);
 assert.ok(major*zoom>=63.9,`ruler major labels should not overlap at zoom ${zoom}`);
 const marks=rulerMarks({x:20,y:80,zoom},{width:1600,height:900},"x");
 assert.ok(marks.length<160);
 assert.ok(marks.every((m,i)=>i===0||m.position>marks[i-1].position));
}
const projection=minimapProjection(artboards,viewport,{width:1100,height:650},{width:188,height:122});
const mapPoint={x:94,y:60};
const worldPoint=projection.unproject(mapPoint);
const roundtrip=projection.project({x:worldPoint.x,y:worldPoint.y,width:10,height:10});
close(roundtrip.x,mapPoint.x);close(roundtrip.y,mapPoint.y);
assert.equal(projection.artboards.length,3);

const demo=createStudioV2Demo();
assert.equal(demo.pages.length,5);
assert.ok(Object.keys(demo.nodes).length>20);
assert.equal(parseProjectV2(demo).pages.length,5);
assert.ok(demo.pages.every(p=>demo.nodes[p.rootNodeId]?.type==="frame"));
assert.deepEqual(demo.pages.map(p=>p.placement.x),[0,1280,2560,3840,5120]);

console.log("PASS: v2 viewport coordinates, anchor zoom, pan, fitting, thin rulers, minimap and 5-page project");
